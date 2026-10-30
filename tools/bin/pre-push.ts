/**
 * pre-push hook: refuses direct pushes to protected branches, hand-made version tags and invalid
 * branch names. Git writes the pushed refs on standard input.
 */
import { readFileSync } from 'node:fs';

import { checkPushedRefs, parsePushedRefs } from '../lib/branch.ts';

const errors = checkPushedRefs(parsePushedRefs(readFileSync(0, 'utf8')));
for (const error of errors) console.error(`✖ ${error}`);
if (errors.length > 0) {
  console.error('Règles : docs/engineering/GIT_WORKFLOW.md (sections 2 et 4).');
  process.exitCode = 1;
}
