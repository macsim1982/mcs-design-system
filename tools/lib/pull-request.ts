/**
 * Pull request hygiene checks run by .github/workflows/pr.yml
 * (docs/engineering/GIT_WORKFLOW.md, sections 9 and 10).
 */
import { isBreakingChangeset } from './changesets.ts';
import type { Changeset } from './changesets.ts';
import { parseHeader } from './conventional.ts';

/** Template sections that must contain text (« None » is a valid answer). */
export const REQUIRED_SECTIONS = [
  'Contexte et objectif',
  'Description du changement',
  "Impact sur l'API publique",
  'Tests réalisés',
  'Risques identifiés',
] as const;

export const REQUIRED_APPROVALS_FOR_BREAKING = 2;

/**
 * Approvals required for a breaking change, from the BREAKING_CHANGE_APPROVALS repository variable.
 * 0 is allowed while the project has a single maintainer (GitHub forbids approving one's own PR).
 */
export function requiredApprovals(configured: string | undefined): number {
  if (configured === undefined || configured.trim() === '') return REQUIRED_APPROVALS_FOR_BREAKING;
  const value = Number(configured);
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`BREAKING_CHANGE_APPROVALS invalide : "${configured}" (entier ≥ 0 attendu).`);
  }
  return value;
}

const BOT_BRANCHES = /^(?:renovate|changeset-release)\//u;

export interface Review {
  readonly user: string;
  readonly state: string;
  readonly submittedAt: string;
}

/** Splits a Markdown body into `## heading` sections. */
function sections(body: string): Map<string, string> {
  const result = new Map<string, string>();
  let current: string | undefined;
  for (const line of body.replace(/\r\n/gu, '\n').split('\n')) {
    const heading = /^##\s+(?<title>.+?)\s*$/u.exec(line)?.groups?.['title'];
    if (heading !== undefined) {
      current = heading;
      result.set(current, '');
    } else if (current !== undefined) {
      result.set(current, `${result.get(current) ?? ''}${line}\n`);
    }
  }
  return result;
}

/** Content left once HTML comments and unchecked checkboxes are removed. */
function meaningfulText(content: string): string {
  return content
    .replace(/<!--[\s\S]*?-->/gu, '')
    .split('\n')
    .filter((line) => !/^\s*[-*]\s+\[ \]/u.test(line))
    .join('\n')
    .trim();
}

/** Returns the missing or empty required sections. */
export function checkPullRequestBody(body: string): string[] {
  const found = sections(body);
  return REQUIRED_SECTIONS.flatMap((title) => {
    const content = found.get(title);
    if (content === undefined) return [`Section manquante : « ${title} ».`];
    return meaningfulText(content) === ''
      ? [`Section vide : « ${title} » (répondre « Aucun » si rien ne s'applique).`]
      : [];
  });
}

/** Pull requests opened by GitHub Apps (Renovate, release bot) or on bot branches. */
export function isBotPullRequest(author: string, headRef: string): boolean {
  return author.endsWith('[bot]') || BOT_BRANCHES.test(headRef);
}

/** Breaking when the title says so (`!`) or when any added changeset does. */
export function isBreakingChange(title: string, changesets: readonly Changeset[]): boolean {
  return parseHeader(title)?.breaking === true || changesets.some(isBreakingChangeset);
}

/** Counts reviewers whose latest decisive review is an approval. */
export function countApprovals(reviews: readonly Review[]): number {
  const latest = new Map<string, Review>();
  const decisive = reviews
    .filter((review) => review.state !== 'COMMENTED' && review.state !== 'PENDING')
    .toSorted((a, b) => a.submittedAt.localeCompare(b.submittedAt));
  for (const review of decisive) latest.set(review.user, review);
  return [...latest.values()].filter((review) => review.state === 'APPROVED').length;
}
