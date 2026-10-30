/**
 * Conventional Commits header parsing, shared by the changeset linter, the release notes generator
 * and the pull request checks.
 */

export interface ConventionalHeader {
  readonly type: string;
  readonly scope: string | undefined;
  readonly breaking: boolean;
  readonly description: string;
}

const HEADER = /^(?<type>[a-z]+)(?:\((?<scope>[^()\s]+)\))?(?<bang>!)?: (?<description>\S.*)$/u;
const KEBAB_CASE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/u;

/** Parses `type(scope)!: description`. Returns undefined when the header is malformed. */
export function parseHeader(header: string): ConventionalHeader | undefined {
  const groups = HEADER.exec(header.trim())?.groups;
  if (groups === undefined) return undefined;
  const { type, scope, bang, description } = groups;
  if (type === undefined || description === undefined) return undefined;
  return { type, scope, breaking: bang === '!', description: description.trim() };
}

export function isKebabCase(value: string): boolean {
  return KEBAB_CASE.test(value);
}

/** Turns a lowercase changeset description into a sentence for release notes. */
export function toSentence(description: string): string {
  const trimmed = description.trim();
  const capitalized = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
  return /[.!?]$/u.test(capitalized) ? capitalized : `${capitalized}.`;
}
