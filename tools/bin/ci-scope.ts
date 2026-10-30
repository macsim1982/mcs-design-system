/**
 * Prints the conditional CI scope as GitHub outputs: `node tools/bin/ci-scope.ts [base-ref]`.
 * With a base ref (pull requests), only changed files count; without, everything runs.
 */
import { execFileSync } from 'node:child_process';

import { computeScope, toGithubOutput } from '../lib/ci-scope.ts';

const git = (...args: string[]): string[] =>
  execFileSync('git', args, { encoding: 'utf8' })
    .split('\n')
    .filter((line) => line !== '');

const baseRef = process.argv[2];
const scope = computeScope({
  changedFiles:
    baseRef === undefined || baseRef === ''
      ? undefined
      : git('diff', '--name-only', `${baseRef}...HEAD`),
  trackedFiles: git('ls-files'),
});
console.log(toGithubOutput(scope));
