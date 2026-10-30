/**
 * Pull request checks (run by .github/workflows/pr.yml):
 *   node tools/bin/check-pr.ts body        required template sections are filled in
 *   node tools/bin/check-pr.ts approvals   breaking changes need two approvals
 * Reads the pull request from the GitHub event payload, never from interpolated strings.
 */
import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';

import { parseChangeset } from '../lib/changesets.ts';
import {
  checkPullRequestBody,
  countApprovals,
  isBotPullRequest,
  isBreakingChange,
  requiredApprovals,
} from '../lib/pull-request.ts';
import type { Review } from '../lib/pull-request.ts';

interface PullRequestEvent {
  readonly pull_request: {
    readonly number: number;
    readonly title: string;
    readonly body: string | null;
    readonly user: { readonly login: string };
    readonly head: { readonly ref: string };
    readonly base: { readonly ref: string };
  };
}

interface ApiReview {
  readonly user: { readonly login: string } | null;
  readonly state: string;
  readonly submitted_at: string | null;
}

const env = (name: string): string => {
  const value = process.env[name];
  if (value === undefined || value === '')
    throw new Error(`Variable d'environnement manquante : ${name}.`);
  return value;
};

const event = JSON.parse(readFileSync(env('GITHUB_EVENT_PATH'), 'utf8')) as PullRequestEvent;
const pr = event.pull_request;

function addedChangesets() {
  return execFileSync(
    'git',
    [
      'diff',
      '--name-only',
      '--diff-filter=AM',
      `origin/${pr.base.ref}...HEAD`,
      '--',
      '.changeset/*.md',
    ],
    {
      encoding: 'utf8',
    },
  )
    .split('\n')
    .filter((file) => file !== '' && !file.endsWith('README.md'))
    .map((file) => parseChangeset(basename(file, '.md'), readFileSync(file, 'utf8')));
}

async function fetchReviews(): Promise<Review[]> {
  const url = `https://api.github.com/repos/${env('GITHUB_REPOSITORY')}/pulls/${String(pr.number)}/reviews?per_page=100`;
  const response = await fetch(url, {
    headers: {
      authorization: `Bearer ${env('GITHUB_TOKEN')}`,
      accept: 'application/vnd.github+json',
    },
  });
  if (!response.ok)
    throw new Error(`API GitHub : ${String(response.status)} ${response.statusText}`);
  const reviews = (await response.json()) as ApiReview[];
  return reviews.map((review) => ({
    user: review.user?.login ?? 'unknown',
    state: review.state,
    submittedAt: review.submitted_at ?? '',
  }));
}

async function main(command: string | undefined): Promise<string[]> {
  if (command === 'body') {
    return isBotPullRequest(pr.user.login, pr.head.ref) ? [] : checkPullRequestBody(pr.body ?? '');
  }
  if (command === 'approvals') {
    const required = requiredApprovals(process.env['BREAKING_CHANGE_APPROVALS']);
    if (required === 0 || !isBreakingChange(pr.title, addedChangesets())) return [];
    const approvals = countApprovals(await fetchReviews());
    return approvals >= required
      ? []
      : [
          `Breaking change : ${String(required)} approbations requises, ${String(approvals)} obtenue(s).`,
        ];
  }
  throw new Error('Commande attendue : body | approvals.');
}

const errors = await main(process.argv[2]);
for (const error of errors) console.error(`✖ ${error}`);
if (errors.length > 0) process.exitCode = 1;
