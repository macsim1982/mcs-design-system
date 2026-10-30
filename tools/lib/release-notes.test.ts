import { describe, expect, it } from 'vitest';

import {
  CHANGELOG_MARKER,
  parsePrNumber,
  prependChangelog,
  releaseKind,
  releaseVersion,
  renderChangelogSection,
  renderReleaseNotes,
} from './release-notes.ts';
import type { ReleasePlan } from './release-notes.ts';

const plan: ReleasePlan = {
  releases: [
    { name: '@mcs-ds/web', type: 'minor', oldVersion: '1.3.2', newVersion: '1.4.0' },
    { name: '@mcs-ds/tokens', type: 'minor', oldVersion: '1.3.2', newVersion: '1.4.0' },
    { name: '@mcs-ds/react', type: 'minor', oldVersion: '1.3.2', newVersion: '1.4.0' },
    { name: 'workbench', type: 'none', oldVersion: '0.0.0', newVersion: '0.0.0' },
  ],
  changesets: [
    {
      id: 'a',
      summary:
        'feat(button): add loading state\n\nAPI: new `loading` prop on <Button>.\nTokens: added the `--mcs-button-spinner-size` hook.',
      releases: [
        { name: '@mcs-ds/web', type: 'minor' },
        { name: '@mcs-ds/react', type: 'minor' },
      ],
      pr: 123,
      commit: 'a1b2c3d4e5f6',
    },
    {
      id: 'b',
      summary: 'fix(dialog): correct focus restoration',
      releases: [{ name: '@mcs-ds/web', type: 'patch' }],
      pr: 127,
    },
    {
      id: 'c',
      summary: 'perf(tokens): reduce generated CSS size',
      releases: [{ name: '@mcs-ds/tokens', type: 'patch' }],
    },
    { id: 'empty', summary: '', releases: [] },
  ],
};

const meta = { date: '2026-10-30', components: ['button', 'dialog', 'tabs'] };

describe('release notes', () => {
  it('computes the release version and kind', () => {
    expect(releaseVersion(plan)).toBe('1.4.0');
    expect(releaseKind(plan)).toBe('MINOR');
  });

  it('flags pre-releases', () => {
    const pre: ReleasePlan = {
      releases: [
        { name: '@mcs-ds/web', type: 'major', oldVersion: '1.4.0', newVersion: '2.0.0-rc.0' },
      ],
      changesets: [],
    };
    expect(releaseKind(pre)).toBe('MAJOR (pre-release)');
  });

  it('throws when nothing is released', () => {
    expect(() => releaseVersion({ releases: [], changesets: [] })).toThrow('Aucun paquet');
  });

  it('extracts pull request numbers from squash subjects', () => {
    expect(parsePrNumber('feat(button): add loading state (#123)')).toBe(123);
    expect(parsePrNumber('feat(button): add loading state')).toBeUndefined();
  });

  it('renders every mandatory section', () => {
    const notes = renderReleaseNotes(plan, meta);
    for (const heading of [
      '# Release 1.4.0',
      '## Breaking Changes',
      '## Migration',
      '## Features',
      '## Improvements',
      '## Performance',
      '## Fixes',
      '## Tokens',
      '## Components',
      '## Public API',
      '## Known Regressions',
      '## Packages',
    ]) {
      expect(notes).toContain(heading);
    }
    expect(notes).not.toContain('## Deprecations');
  });

  it('renders entries, references and cross-cutting views', () => {
    const notes = renderReleaseNotes(plan, meta);
    expect(notes).toContain('- **Type:** MINOR');
    expect(notes).toContain('- **button:** Add loading state. (#123, a1b2c3d)');
    expect(notes).toContain('- **dialog:** Correct focus restoration. (#127)');
    expect(notes).toContain('- **tokens:** Reduce generated CSS size.');
    expect(notes).toContain('- **button:** added the `--mcs-button-spinner-size` hook.');
    expect(notes).toContain('- **button:** 1 feature');
    expect(notes).toContain('- **dialog:** 1 fix');
    expect(notes).toContain('- **button:** new `loading` prop on <Button>.');
    expect(notes).toContain('No migration required.');
    expect(notes).toContain('| `@mcs-ds/web` | 1.4.0 | minor |');
    expect(notes).not.toContain('workbench');
  });

  it('lists breaking changes with their migration', () => {
    const breaking: ReleasePlan = {
      releases: [{ name: '@mcs-ds/web', type: 'major', oldVersion: '1.4.0', newVersion: '2.0.0' }],
      changesets: [
        {
          id: 'x',
          summary:
            'feat(button)!: rename ghost variant\n\nMigration: replace `ghost` with `tertiary`.',
          releases: [{ name: '@mcs-ds/web', type: 'major' }],
        },
      ],
    };
    const notes = renderReleaseNotes(breaking, meta);
    expect(notes).toContain('## Breaking Changes\n\n- **button:** Rename ghost variant.');
    expect(notes).toContain('## Migration\n\n- **button:** replace `ghost` with `tertiary`.');
  });

  it('renders the technical changelog by package', () => {
    const section = renderChangelogSection(plan, meta);
    expect(section).toContain('## 1.4.0 (2026-10-30)');
    expect(section).toContain(
      '### `@mcs-ds/web` (minor)\n\n- feat(button): add loading state (#123, a1b2c3d)',
    );
    expect(section).toContain('### `@mcs-ds/react` (minor)');
  });

  it('notes version-only bumps of the fixed group', () => {
    const onlyWeb: ReleasePlan = {
      releases: [
        { name: '@mcs-ds/web', type: 'patch', oldVersion: '1.0.0', newVersion: '1.0.1' },
        { name: '@mcs-ds/react', type: 'patch', oldVersion: '1.0.0', newVersion: '1.0.1' },
      ],
      changesets: [
        { id: 'f', summary: 'fix: x', releases: [{ name: '@mcs-ds/web', type: 'patch' }] },
      ],
    };
    expect(renderChangelogSection(onlyWeb, meta)).toContain(
      '- Version bump only (fixed version group).',
    );
  });

  it('prepends sections after the marker, newest first', () => {
    const initial = `# Changelog\n\n${CHANGELOG_MARKER}\n`;
    const once = prependChangelog(initial, '## 1.0.0 (2026-01-01)\n');
    const twice = prependChangelog(once, '## 1.1.0 (2026-02-01)\n');
    expect(twice.indexOf('1.1.0')).toBeLessThan(twice.indexOf('1.0.0'));
    expect(twice.startsWith('# Changelog')).toBe(true);
  });

  it('refuses a changelog without marker', () => {
    expect(() => prependChangelog('# Changelog\n', '## 1.0.0\n')).toThrow('marqueur');
  });
});
