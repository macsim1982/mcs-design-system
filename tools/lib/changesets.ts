/**
 * Changeset parsing and linting (docs/engineering/RELEASE_PROCESS.md, section 4.2).
 *
 * First summary line: `type(scope)!: description`. Optional labelled lines: `API:`, `Tokens:`,
 * `Migration:` (required for breaking changes) and `Known issue:`.
 */
import { isKebabCase, parseHeader } from './conventional.ts';
import type { ConventionalHeader } from './conventional.ts';
import { BUMP_RANK, requiredBreakingBump } from './semver.ts';
import type { Bump } from './semver.ts';

export const CHANGESET_TYPES = [
  'feat',
  'improve',
  'fix',
  'perf',
  'deprecate',
  'revert',
  'docs',
] as const;
export type ChangesetType = (typeof CHANGESET_TYPES)[number];

export const LABELS = ['API', 'Tokens', 'Migration', 'Known issue'] as const;
export type Label = (typeof LABELS)[number];

export interface ChangesetRelease {
  readonly name: string;
  readonly type: Bump;
}

export interface Changeset {
  readonly id: string;
  readonly releases: readonly ChangesetRelease[];
  readonly summary: string;
}

export interface ParsedSummary {
  readonly headerLine: string;
  readonly header: ConventionalHeader | undefined;
  readonly labels: ReadonlyMap<Label, readonly string[]>;
}

const RELEASE_LINE =
  /^\s*(?<quote>['"]?)(?<name>[^'":\s][^'"]*?)\k<quote>\s*:\s*(?<type>patch|minor|major)\s*$/u;
const LABEL_LINE = new RegExp(`^(${LABELS.join('|')})\\s*:\\s*(.*)$`, 'iu');

function isChangesetType(value: string): value is ChangesetType {
  return (CHANGESET_TYPES as readonly string[]).includes(value);
}

function canonicalLabel(raw: string): Label | undefined {
  return LABELS.find((label) => label.toLowerCase() === raw.toLowerCase());
}

/** Parses a `.changeset/<id>.md` file. Throws on a malformed front matter. */
export function parseChangeset(id: string, content: string): Changeset {
  const normalized = content.replace(/\r\n/gu, '\n');
  const match = /^---\n(?<front>[\s\S]*?)\n?---\n?(?<body>[\s\S]*)$/u.exec(normalized);
  const front = match?.groups?.['front'];
  const body = match?.groups?.['body'];
  if (front === undefined || body === undefined) {
    throw new Error(`Changeset "${id}" : front matter manquant (bloc --- … ---).`);
  }
  const releases = front
    .split('\n')
    .filter((line) => line.trim() !== '')
    .map((line) => {
      const groups = RELEASE_LINE.exec(line)?.groups;
      const name = groups?.['name'];
      const type = groups?.['type'];
      if (name === undefined || type === undefined) {
        throw new Error(`Changeset "${id}" : ligne de front matter invalide : "${line}".`);
      }
      return { name, type: type as Bump };
    });
  return { id, releases, summary: body.trim() };
}

function labelOf(line: string): { label: Label; text: string } | undefined {
  const match = LABEL_LINE.exec(line.trim());
  const label = match?.[1] === undefined ? undefined : canonicalLabel(match[1]);
  return label === undefined ? undefined : { label, text: (match?.[2] ?? '').trim() };
}

/** Splits a summary into its header and labelled sections; continuation lines are joined. */
export function parseSummary(summary: string): ParsedSummary {
  const lines = summary.split('\n');
  const headerLine = (lines[0] ?? '').trim();
  const labels = new Map<Label, string[]>();
  let current: string[] | undefined;
  for (const line of lines.slice(1)) {
    const labelled = labelOf(line);
    if (labelled !== undefined) {
      current = labels.get(labelled.label) ?? [];
      labels.set(labelled.label, current);
      current.push(labelled.text);
    } else if (line.trim() === '') {
      current = undefined;
    } else if (current !== undefined && current.length > 0) {
      const lastIndex = current.length - 1;
      current[lastIndex] = `${current[lastIndex] ?? ''} ${line.trim()}`.trim();
    }
  }
  return { headerLine, header: parseHeader(headerLine), labels };
}

function lintHeader(id: string, parsed: ParsedSummary): string[] {
  const { header, headerLine } = parsed;
  if (header === undefined) {
    return [
      `${id} : première ligne invalide "${headerLine}". Format attendu : type(portée): description.`,
    ];
  }
  const errors: string[] = [];
  if (!isChangesetType(header.type)) {
    errors.push(`${id} : type "${header.type}" non autorisé (${CHANGESET_TYPES.join(', ')}).`);
  }
  if (header.scope !== undefined && !isKebabCase(header.scope)) {
    errors.push(`${id} : la portée "${header.scope}" doit être en kebab-case.`);
  }
  if (/^[A-Z]/u.test(header.description)) {
    errors.push(`${id} : la description commence par une minuscule (impératif, en anglais).`);
  }
  if (header.description.endsWith('.')) {
    errors.push(`${id} : la description ne se termine pas par un point.`);
  }
  return errors;
}

function lintBreaking(
  changeset: Changeset,
  parsed: ParsedSummary,
  versions: ReadonlyMap<string, string>,
): string[] {
  const errors: string[] = [];
  const declaredBreaking = parsed.header?.breaking === true;
  let breaking = declaredBreaking;
  for (const release of changeset.releases) {
    const required = requiredBreakingBump(versions.get(release.name));
    if (release.type === 'major' && !declaredBreaking) {
      errors.push(`${changeset.id} : ${release.name} est en major mais l'en-tête n'a pas de "!".`);
      breaking = true;
    }
    if (declaredBreaking && BUMP_RANK[release.type] < BUMP_RANK[required]) {
      errors.push(
        `${changeset.id} : rupture déclarée ("!") mais ${release.name} est en ${release.type} ; attendu : ${required}.`,
      );
    }
  }
  const migration = parsed.labels.get('Migration') ?? [];
  if (breaking && !migration.some((entry) => entry !== '')) {
    errors.push(`${changeset.id} : une rupture exige une ligne "Migration: …".`);
  }
  return errors;
}

/**
 * Lints one changeset. `versions` maps package names to their current version (to apply the 0.x
 * convention for breaking changes). Empty changesets (no release) are always valid.
 */
export function lintChangeset(
  changeset: Changeset,
  versions: ReadonlyMap<string, string>,
): string[] {
  if (changeset.releases.length === 0) return [];
  const parsed = parseSummary(changeset.summary);
  const headerErrors = lintHeader(changeset.id, parsed);
  if (parsed.header === undefined) return headerErrors;
  return [...headerErrors, ...lintBreaking(changeset, parsed, versions)];
}

/** True when a changeset announces a breaking change, whatever the bump level. */
export function isBreakingChangeset(changeset: Changeset): boolean {
  if (changeset.releases.some((release) => release.type === 'major')) return true;
  return parseSummary(changeset.summary).header?.breaking === true;
}
