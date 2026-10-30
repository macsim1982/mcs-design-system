/**
 * Release notes (user-facing) and technical changelog generation from a Changesets release plan
 * (`changeset status --output`). Format: docs/engineering/RELEASE_PROCESS.md, section 7.
 */
import { parseSummary } from './changesets.ts';
import type { Label } from './changesets.ts';
import { toSentence } from './conventional.ts';
import { BUMP_RANK, compareSemver, parseSemver } from './semver.ts';
import type { Bump } from './semver.ts';

export interface PlannedRelease {
  readonly name: string;
  readonly type: Bump | 'none';
  readonly oldVersion: string;
  readonly newVersion: string;
}

export interface PlannedChangeset {
  readonly id: string;
  readonly summary: string;
  readonly releases: readonly { readonly name: string; readonly type: Bump | 'none' }[];
  readonly pr?: number | undefined;
  readonly commit?: string | undefined;
}

export interface ReleasePlan {
  readonly releases: readonly PlannedRelease[];
  readonly changesets: readonly PlannedChangeset[];
}

export interface ReleaseMeta {
  /** ISO date (YYYY-MM-DD). */
  readonly date: string;
  /** Component folder names, used to build the « Components » section. */
  readonly components: readonly string[];
  /** Package whose changes are listed in the « Tokens » section. */
  readonly tokensPackage?: string;
}

export const CHANGELOG_MARKER = '<!-- releases -->';

const SECTIONS = [
  { type: 'feat', title: 'Features', always: true, noun: 'feature' },
  { type: 'improve', title: 'Improvements', always: true, noun: 'improvement' },
  { type: 'perf', title: 'Performance', always: true, noun: 'performance improvement' },
  { type: 'fix', title: 'Fixes', always: true, noun: 'fix' },
  { type: 'deprecate', title: 'Deprecations', always: false, noun: 'deprecation' },
  { type: 'revert', title: 'Reverts', always: false, noun: 'revert' },
  { type: 'docs', title: 'Documentation', always: false, noun: 'documentation change' },
] as const;

interface Entry {
  readonly type: string;
  readonly scope: string | undefined;
  readonly sentence: string;
  readonly breaking: boolean;
  readonly packages: readonly string[];
  readonly labels: ReadonlyMap<Label, readonly string[]>;
  readonly reference: string;
  readonly headerLine: string;
}

const activeReleases = (plan: ReleasePlan): PlannedRelease[] =>
  plan.releases.filter((release) => release.type !== 'none');

/** Highest version among released packages (the fixed group shares one version). */
export function releaseVersion(plan: ReleasePlan): string {
  const versions = activeReleases(plan).map((release) => release.newVersion);
  const [first, ...rest] = versions;
  if (first === undefined) throw new Error('Aucun paquet à publier dans le plan de release.');
  return rest.reduce((max, version) => (compareSemver(version, max) > 0 ? version : max), first);
}

export function releaseKind(plan: ReleasePlan): string {
  const rank = Math.max(...activeReleases(plan).map((release) => BUMP_RANK[release.type as Bump]));
  const kind = rank === 2 ? 'MAJOR' : rank === 1 ? 'MINOR' : 'PATCH';
  const pre = parseSemver(releaseVersion(plan))?.prerelease.length ?? 0;
  return pre > 0 ? `${kind} (pre-release)` : kind;
}

/** Extracts `#123` from a squash-merge subject such as `feat(button): add x (#123)`. */
export function parsePrNumber(subject: string): number | undefined {
  const match = /\(#(?<number>\d+)\)\s*$/u.exec(subject);
  const number = match?.groups?.['number'];
  return number === undefined ? undefined : Number(number);
}

function toEntry(changeset: PlannedChangeset): Entry {
  const parsed = parseSummary(changeset.summary);
  const header = parsed.header;
  const refs = [
    changeset.pr === undefined ? undefined : `#${String(changeset.pr)}`,
    changeset.commit?.slice(0, 7),
  ].filter((ref): ref is string => ref !== undefined);
  return {
    type: header?.type ?? 'improve',
    scope: header?.scope,
    sentence: toSentence(header?.description ?? parsed.headerLine),
    breaking:
      header?.breaking === true || changeset.releases.some((release) => release.type === 'major'),
    packages: changeset.releases.map((release) => release.name),
    labels: parsed.labels,
    reference: refs.length === 0 ? '' : ` (${refs.join(', ')})`,
    headerLine: parsed.headerLine,
  };
}

const bullet = (entry: Entry, text = entry.sentence): string =>
  entry.scope === undefined ? `- ${text}` : `- **${entry.scope}:** ${text}`;

function labelLines(entries: readonly Entry[], label: Label): string[] {
  return entries.flatMap((entry) =>
    (entry.labels.get(label) ?? [])
      .filter((text) => text !== '')
      .map((text) => bullet(entry, text)),
  );
}

function section(title: string, lines: readonly string[], empty: string): string {
  return [`## ${title}`, '', ...(lines.length === 0 ? [empty] : lines), ''].join('\n');
}

function componentLines(entries: readonly Entry[], components: readonly string[]): string[] {
  return components
    .map((component) => {
      const own = entries.filter((entry) => entry.scope === component);
      const counts = SECTIONS.map(({ type, noun }) => {
        const count = own.filter((entry) => entry.type === type).length;
        if (count === 0) return undefined;
        return `${String(count)} ${noun}${count > 1 ? 's' : ''}`;
      }).filter((text): text is string => text !== undefined);
      return counts.length === 0 ? undefined : `- **${component}:** ${counts.join(', ')}`;
    })
    .filter((line): line is string => line !== undefined);
}

function packageTable(plan: ReleasePlan): string[] {
  const rows = activeReleases(plan)
    .toSorted((a, b) => a.name.localeCompare(b.name))
    .map((release) => `| \`${release.name}\` | ${release.newVersion} | ${release.type} |`);
  return ['| Package | Version | Bump |', '| --- | --- | --- |', ...rows];
}

/** Renders `docs/releases/v<version>.md`. */
export function renderReleaseNotes(plan: ReleasePlan, meta: ReleaseMeta): string {
  const version = releaseVersion(plan);
  const entries = plan.changesets.filter((cs) => cs.releases.length > 0).map(toEntry);
  const tokensPackage = meta.tokensPackage ?? '@mcs-ds/tokens';
  const tokenEntries = entries.filter(
    (entry) => entry.scope === 'tokens' || entry.packages.includes(tokensPackage),
  );
  const packages = activeReleases(plan)
    .toSorted((a, b) => a.name.localeCompare(b.name))
    .map((release) => `\`${release.name}@${release.newVersion}\``)
    .join(', ');

  const parts = [
    `# Release ${version}`,
    '',
    `- **Date:** ${meta.date}`,
    `- **Type:** ${releaseKind(plan)}`,
    `- **Packages:** ${packages}`,
    '',
    section(
      'Breaking Changes',
      entries.filter((entry) => entry.breaking).map((entry) => bullet(entry) + entry.reference),
      'None.',
    ),
    section('Migration', labelLines(entries, 'Migration'), 'No migration required.'),
    ...SECTIONS.map(({ type, title, always }) => {
      const lines = entries
        .filter((entry) => entry.type === type)
        .map((entry) => bullet(entry) + entry.reference);
      return lines.length === 0 && !always ? '' : section(title, lines, 'None.');
    }).filter((text) => text !== ''),
    section(
      'Tokens',
      [...tokenEntries.map((entry) => bullet(entry)), ...labelLines(entries, 'Tokens')],
      'No token changes.',
    ),
    section('Components', componentLines(entries, meta.components), 'No component changes.'),
    section('Public API', labelLines(entries, 'API'), 'No public API changes.'),
    section('Known Regressions', labelLines(entries, 'Known issue'), 'None known.'),
    section('Packages', packageTable(plan), 'None.'),
  ];
  return `${parts.join('\n').trimEnd()}\n`;
}

/** Renders the technical CHANGELOG.md section for this release. */
export function renderChangelogSection(plan: ReleasePlan, meta: ReleaseMeta): string {
  const lines = [`## ${releaseVersion(plan)} (${meta.date})`, ''];
  for (const release of activeReleases(plan).toSorted((a, b) => a.name.localeCompare(b.name))) {
    lines.push(`### \`${release.name}\` (${release.type})`, '');
    const own = plan.changesets
      .filter((cs) => cs.releases.some((r) => r.name === release.name))
      .map(toEntry);
    if (own.length === 0) lines.push('- Version bump only (fixed version group).');
    for (const entry of own) lines.push(`- ${entry.headerLine}${entry.reference}`);
    lines.push('');
  }
  return lines.join('\n');
}

/** Inserts a section right after the marker of CHANGELOG.md (newest release first). */
export function prependChangelog(changelog: string, sectionText: string): string {
  const index = changelog.indexOf(CHANGELOG_MARKER);
  if (index === -1) {
    throw new Error(`CHANGELOG.md doit contenir le marqueur ${CHANGELOG_MARKER}.`);
  }
  const head = changelog.slice(0, index + CHANGELOG_MARKER.length);
  const tail = changelog.slice(index + CHANGELOG_MARKER.length).replace(/^\n+/u, '');
  return `${head}\n\n${sectionText.trimEnd()}\n${tail === '' ? '' : `\n${tail}`}`;
}
