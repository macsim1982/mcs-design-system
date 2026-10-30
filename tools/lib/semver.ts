/**
 * Minimal Semantic Versioning helpers for the release scripts (no dependency needed).
 */

export interface SemVer {
  readonly major: number;
  readonly minor: number;
  readonly patch: number;
  readonly prerelease: readonly string[];
}

export type Bump = 'patch' | 'minor' | 'major';

const SEMVER =
  /^v?(?<major>\d+)\.(?<minor>\d+)\.(?<patch>\d+)(?:-(?<pre>[0-9A-Za-z.-]+))?(?:\+[0-9A-Za-z.-]+)?$/u;

export function parseSemver(version: string): SemVer | undefined {
  const groups = SEMVER.exec(version.trim())?.groups;
  if (groups === undefined) return undefined;
  const { major, minor, patch, pre } = groups;
  return {
    major: Number(major),
    minor: Number(minor),
    patch: Number(patch),
    prerelease: pre === undefined ? [] : pre.split('.'),
  };
}

function compareIdentifiers(a: string, b: string): number {
  const aNumeric = /^\d+$/u.test(a);
  const bNumeric = /^\d+$/u.test(b);
  if (aNumeric && bNumeric) return Math.sign(Number(a) - Number(b));
  if (aNumeric !== bNumeric) return aNumeric ? -1 : 1;
  return a < b ? -1 : a > b ? 1 : 0;
}

function comparePrerelease(a: readonly string[], b: readonly string[]): number {
  if (a.length === 0 || b.length === 0) return Math.sign(b.length - a.length);
  for (let index = 0; index < Math.max(a.length, b.length); index += 1) {
    const left = a[index];
    const right = b[index];
    if (left === undefined) return -1;
    if (right === undefined) return 1;
    const result = compareIdentifiers(left, right);
    if (result !== 0) return result;
  }
  return 0;
}

/** Returns -1, 0 or 1. Throws on an invalid version: release scripts must fail loudly. */
export function compareSemver(a: string, b: string): number {
  const left = parseSemver(a);
  const right = parseSemver(b);
  if (left === undefined || right === undefined) {
    throw new Error(`Version SemVer invalide : "${left === undefined ? a : b}".`);
  }
  return (
    Math.sign(left.major - right.major) ||
    Math.sign(left.minor - right.minor) ||
    Math.sign(left.patch - right.patch) ||
    comparePrerelease(left.prerelease, right.prerelease)
  );
}

export const BUMP_RANK: Readonly<Record<Bump, number>> = { patch: 0, minor: 1, major: 2 };

/**
 * Bump level that a breaking change requires: major from 1.0.0, minor before (0.x convention).
 * An unknown version (first release) is treated as stable.
 */
export function requiredBreakingBump(currentVersion: string | undefined): Bump {
  if (currentVersion === undefined) return 'major';
  return parseSemver(currentVersion)?.major === 0 ? 'minor' : 'major';
}

/**
 * npm dist-tag for a version (docs/engineering/RELEASE_PROCESS.md, section 3):
 * pre-releases use their identifier, a lower version than `latest` gets a maintenance tag.
 */
export function chooseDistTag(version: string, latest: string | undefined): string {
  const parsed = parseSemver(version);
  if (parsed === undefined) throw new Error(`Version SemVer invalide : "${version}".`);
  const [identifier] = parsed.prerelease;
  if (identifier !== undefined) return /^\d+$/u.test(identifier) ? 'next' : identifier;
  if (latest === undefined || compareSemver(version, latest) > 0) return 'latest';
  return `maint-${String(parsed.major)}.${String(parsed.minor)}`;
}
