/**
 * Publish step of a release (run by changesets/action once the "Version Packages" PR is merged).
 * Refuses to publish without release notes, chooses the npm dist-tag, publishes, then creates the
 * system tag and the GitHub release.   node tools/bin/release-publish.ts [--dry-run]
 * Process: docs/engineering/RELEASE_PROCESS.md, sections 6 to 8.
 */
import { execFileSync, spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import { join } from 'node:path';

import { chooseDistTag, compareSemver } from '../lib/semver.ts';
import { readWorkspacePackages } from '../lib/workspace.ts';

const root = process.cwd();
const dryRun = process.argv.includes('--dry-run');

function npmLatest(name: string): string | undefined {
  try {
    const value = execFileSync('npm', ['view', name, 'dist-tags.latest'], {
      encoding: 'utf8',
    }).trim();
    return value === '' ? undefined : value;
  } catch {
    return undefined; // First publication: the package does not exist yet.
  }
}

function publish(): void {
  const packages = readWorkspacePackages(root).filter((pkg) => !pkg.private);
  const [first] = packages;
  if (first === undefined) {
    console.log('Aucun paquet publiable : rien à publier.');
    return;
  }
  const version = packages
    .map((pkg) => pkg.version)
    .reduce((max, current) => (compareSemver(current, max) > 0 ? current : max), first.version);
  const notesFile = join('docs', 'releases', `v${version}.md`);
  if (!existsSync(notesFile)) {
    console.error(`✖ Note de release manquante (${notesFile}) : publication refusée.`);
    process.exitCode = 1;
    return;
  }

  const preMode = existsSync(join('.changeset', 'pre.json'));
  const tag = preMode ? undefined : chooseDistTag(version, npmLatest(first.name));
  console.log(`Version ${version} · dist-tag ${tag ?? '(mode pré-version)'} · note ${notesFile}`);
  if (dryRun) return;

  const result = spawnSync(
    'pnpm',
    ['exec', 'changeset', 'publish', ...(tag === undefined ? [] : ['--tag', tag])],
    {
      encoding: 'utf8',
    },
  );
  process.stdout.write(result.stdout);
  process.stderr.write(result.stderr);
  if (result.status !== 0) {
    process.exitCode = result.status ?? 1;
    return;
  }
  if (!`${result.stdout}${result.stderr}`.includes('New tag:')) {
    console.log('Rien de nouveau publié : toutes les versions sont déjà sur npm.');
    return;
  }

  const systemTag = `v${version}`;
  execFileSync('git', ['tag', '-a', systemTag, '-m', `Release ${version}`], { stdio: 'inherit' });
  execFileSync('git', ['push', 'origin', systemTag], { stdio: 'inherit' });
  const flags = [
    ...(version.includes('-') ? ['--prerelease'] : []),
    ...(tag === 'latest' ? [] : ['--latest=false']),
  ];
  execFileSync(
    'gh',
    [
      'release',
      'create',
      systemTag,
      '--title',
      `Release ${version}`,
      '--notes-file',
      notesFile,
      ...flags,
    ],
    { stdio: 'inherit' },
  );
}

publish();
