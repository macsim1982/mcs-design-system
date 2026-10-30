/**
 * Lints every pending changeset: `node tools/bin/changesets-lint.ts [files…]`.
 * Format: docs/engineering/RELEASE_PROCESS.md, section 4.2.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { basename, join } from 'node:path';

import { lintChangeset, parseChangeset } from '../lib/changesets.ts';
import { readWorkspacePackages } from '../lib/workspace.ts';

const root = process.cwd();
const directory = join(root, '.changeset');
const files =
  process.argv.length > 2
    ? process.argv.slice(2)
    : readdirSync(directory)
        .filter((file) => file.endsWith('.md') && file !== 'README.md')
        .map((file) => join(directory, file));

const versions = new Map(readWorkspacePackages(root).map((pkg) => [pkg.name, pkg.version]));
const errors = files.flatMap((file) => {
  try {
    return lintChangeset(
      parseChangeset(basename(file, '.md'), readFileSync(file, 'utf8')),
      versions,
    );
  } catch (error) {
    return [error instanceof Error ? error.message : String(error)];
  }
});

for (const error of errors) console.error(`✖ ${error}`);
if (errors.length > 0) process.exitCode = 1;
else console.log(`${String(files.length)} changeset(s) conforme(s).`);
