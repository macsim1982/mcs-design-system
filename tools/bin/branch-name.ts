/**
 * Validates a branch name: `node tools/bin/branch-name.ts [name]` (defaults to the current branch).
 */
import { execFileSync } from 'node:child_process';

import { checkBranchName } from '../lib/branch.ts';

// `git branch --show-current` also works before the first commit (unborn branch).
const name =
  process.argv[2] ?? execFileSync('git', ['branch', '--show-current'], { encoding: 'utf8' }).trim();
const result = checkBranchName(name);
if (result.valid) {
  console.log(`Branche "${name}" valide (${result.kind}).`);
} else {
  console.error(result.reason);
  process.exitCode = 1;
}
