/**
 * Version step of a release (run by changesets/action to build the "Version Packages" PR):
 * generates the release notes and the CHANGELOG section, then runs `changeset version`.
 *   node tools/bin/release-version.ts [--dry-run]
 * Process: docs/engineering/RELEASE_PROCESS.md, sections 6 and 7.
 */
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  parsePrNumber,
  prependChangelog,
  releaseVersion,
  renderChangelogSection,
  renderReleaseNotes,
} from '../lib/release-notes.ts';
import type { PlannedChangeset, ReleasePlan } from '../lib/release-notes.ts';
import { readComponentNames } from '../lib/workspace.ts';

const root = process.cwd();
const dryRun = process.argv.includes('--dry-run');
const run = (command: string, args: string[]): void => {
  execFileSync(command, args, { stdio: 'inherit' });
};

function readPlan(): ReleasePlan {
  const directory = mkdtempSync(join(tmpdir(), 'mcs-release-'));
  try {
    const statusFile = join(directory, 'status.json');
    run('pnpm', ['exec', 'changeset', 'status', `--output=${statusFile}`]);
    return JSON.parse(readFileSync(statusFile, 'utf8')) as ReleasePlan;
  } finally {
    rmSync(directory, { recursive: true, force: true });
  }
}

/** Commit that added the changeset, and the pull request number from its squash subject. */
function withCommit(changeset: PlannedChangeset): PlannedChangeset {
  const line = execFileSync(
    'git',
    ['log', '--diff-filter=A', '--format=%H%x09%s', '-1', '--', `.changeset/${changeset.id}.md`],
    { encoding: 'utf8' },
  ).trim();
  if (line === '') return changeset;
  const [commit, subject = ''] = line.split('\t');
  return { ...changeset, commit, pr: parsePrNumber(subject) };
}

const pending = readdirSync(join(root, '.changeset')).filter(
  (file) => file.endsWith('.md') && file !== 'README.md',
);
if (pending.length === 0) {
  console.log('Aucun changeset en attente : rien à versionner.');
} else {
  const raw = readPlan();
  const plan: ReleasePlan = { ...raw, changesets: raw.changesets.map(withCommit) };
  if (plan.releases.every((release) => release.type === 'none')) {
    console.log('Uniquement des changesets vides : ils sont consommés sans publication.');
    if (!dryRun) run('pnpm', ['exec', 'changeset', 'version']);
  } else {
    const meta = {
      date: new Date().toISOString().slice(0, 10),
      components: readComponentNames(root),
    };
    const notes = renderReleaseNotes(plan, meta);
    const section = renderChangelogSection(plan, meta);
    if (dryRun) {
      console.log(`${notes}\n---\n${section}`);
    } else {
      const notesFile = join('docs', 'releases', `v${releaseVersion(plan)}.md`);
      writeFileSync(notesFile, notes);
      writeFileSync(
        'CHANGELOG.md',
        prependChangelog(readFileSync('CHANGELOG.md', 'utf8'), section),
      );
      run('pnpm', ['exec', 'changeset', 'version']);
      run('pnpm', ['exec', 'prettier', '--write', notesFile, 'CHANGELOG.md']);
      console.log(`Note de release générée : ${notesFile}. Relisez-la et complétez-la dans la PR.`);
    }
  }
}
