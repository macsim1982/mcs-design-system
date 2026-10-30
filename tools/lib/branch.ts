/**
 * Branch naming and push rules (docs/engineering/GIT_WORKFLOW.md, sections 2 and 4).
 * Used by the pre-push hook and by the pull request workflow.
 */

export type BranchKind = 'trunk' | 'work' | 'maintenance' | 'bot';

export type BranchCheck =
  | { readonly valid: true; readonly kind: BranchKind }
  | { readonly valid: false; readonly reason: string };

export const MAX_BRANCH_LENGTH = 72;

const WORK = /^(?:feature|fix|hotfix|chore|docs)\/[a-z0-9]+(?:-[a-z0-9]+)*$/u;
const MAINTENANCE = /^release\/\d+\.(?:\d+\.)?x$/u;
const BOT = /^(?:renovate|changeset-release)\/[\w./-]+$/u;
const ZERO_SHA = /^0+$/u;

const EXPECTED_FORMAT =
  'Format attendu : <type>/<description-en-kebab-case>, types feature, fix, hotfix, chore, docs ' +
  '(ou release/<majeure>.x, release/<majeure>.<mineure>.x pour la maintenance).';

export function checkBranchName(name: string): BranchCheck {
  if (name === 'main') return { valid: true, kind: 'trunk' };
  if (MAINTENANCE.test(name)) return { valid: true, kind: 'maintenance' };
  if (BOT.test(name)) return { valid: true, kind: 'bot' };
  if (name.length > MAX_BRANCH_LENGTH) {
    return {
      valid: false,
      reason: `Nom de branche trop long (${String(name.length)} > ${String(MAX_BRANCH_LENGTH)}) : "${name}".`,
    };
  }
  if (WORK.test(name)) return { valid: true, kind: 'work' };
  return { valid: false, reason: `Nom de branche invalide : "${name}". ${EXPECTED_FORMAT}` };
}

/** Branches that only accept changes through pull requests. */
export function isProtectedBranch(name: string): boolean {
  return name === 'main' || name.startsWith('release/');
}

export interface PushedRef {
  readonly localRef: string;
  readonly localSha: string;
  readonly remoteRef: string;
  readonly remoteSha: string;
}

/** Parses the lines Git writes on the pre-push hook's standard input. */
export function parsePushedRefs(input: string): PushedRef[] {
  return input
    .split('\n')
    .map((line) => line.trim().split(/\s+/u))
    .filter((parts) => parts.length === 4)
    .map(([localRef = '', localSha = '', remoteRef = '', remoteSha = '']) => ({
      localRef,
      localSha,
      remoteRef,
      remoteSha,
    }));
}

/** Returns one error message per refused ref; an empty list means the push may proceed. */
export function checkPushedRefs(refs: readonly PushedRef[]): string[] {
  const errors: string[] = [];
  for (const ref of refs) {
    if (ref.remoteRef.startsWith('refs/tags/')) {
      const tag = ref.remoteRef.slice('refs/tags/'.length);
      if (/^v\d/u.test(tag) || tag.startsWith('@')) {
        errors.push(`Le tag de version "${tag}" est créé par la CI de release, pas à la main.`);
      }
      continue;
    }
    if (!ref.remoteRef.startsWith('refs/heads/')) continue;
    const branch = ref.remoteRef.slice('refs/heads/'.length);
    if (isProtectedBranch(branch)) {
      const action = ZERO_SHA.test(ref.localSha) ? 'Suppression' : 'Push direct';
      errors.push(
        `${action} interdit vers la branche protégée "${branch}" : passez par une pull request.`,
      );
      continue;
    }
    const check = checkBranchName(branch);
    if (!check.valid) errors.push(check.reason);
  }
  return errors;
}
