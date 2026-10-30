import { describe, expect, it } from 'vitest';

import { isBreakingChangeset, lintChangeset, parseChangeset, parseSummary } from './changesets.ts';

const STABLE = new Map([['@mcs-ds/web', '1.3.0']]);
const PRE_STABLE = new Map([['@mcs-ds/web', '0.4.0']]);

const changeset = (front: string, body: string) =>
  parseChangeset('brave-cats', `---\n${front}\n---\n\n${body}\n`);

describe('changesets', () => {
  describe('parseChangeset', () => {
    it('reads releases with any quoting style', () => {
      const parsed = changeset(
        `'@mcs-ds/web': minor\n"@mcs-ds/react": patch`,
        'feat(button): add loading state',
      );
      expect(parsed.releases).toEqual([
        { name: '@mcs-ds/web', type: 'minor' },
        { name: '@mcs-ds/react', type: 'patch' },
      ]);
      expect(parsed.summary).toBe('feat(button): add loading state');
    });

    it('reads an empty changeset', () => {
      expect(parseChangeset('empty', '---\n---\n').releases).toEqual([]);
    });

    it('throws on a missing front matter', () => {
      expect(() => parseChangeset('broken', 'feat: x')).toThrow('front matter');
    });

    it('throws on an invalid bump', () => {
      expect(() => changeset(`'@mcs-ds/web': huge`, 'feat: x')).toThrow('invalide');
    });
  });

  describe('parseSummary', () => {
    it('collects labelled lines and their continuations', () => {
      const parsed = parseSummary(
        [
          'feat(button): add loading state',
          '',
          'API: new `loading` prop',
          'on <Button>.',
          'tokens: added a hook',
        ].join('\n'),
      );
      expect(parsed.labels.get('API')).toEqual(['new `loading` prop on <Button>.']);
      expect(parsed.labels.get('Tokens')).toEqual(['added a hook']);
    });
  });

  describe('lintChangeset', () => {
    it('accepts a valid feature', () => {
      expect(
        lintChangeset(changeset(`'@mcs-ds/web': minor`, 'feat(button): add loading state'), STABLE),
      ).toEqual([]);
    });

    it('accepts an empty changeset', () => {
      expect(lintChangeset(parseChangeset('empty', '---\n---\n'), STABLE)).toEqual([]);
    });

    it('rejects an invalid header, type, scope and description', () => {
      expect(
        lintChangeset(changeset(`'@mcs-ds/web': patch`, 'Fixed the dialog'), STABLE),
      ).toHaveLength(1);
      const errors = lintChangeset(
        changeset(`'@mcs-ds/web': patch`, 'chore(Dialog): Fix focus.'),
        STABLE,
      );
      expect(errors).toHaveLength(4);
    });

    it('requires "!" for a major bump and a migration note', () => {
      const errors = lintChangeset(
        changeset(`'@mcs-ds/web': major`, 'feat(button): rename variant'),
        STABLE,
      );
      expect(errors).toEqual([
        expect.stringContaining('n\'a pas de "!"'),
        expect.stringContaining('Migration'),
      ]);
    });

    it('requires a major bump for a breaking change after 1.0', () => {
      const errors = lintChangeset(
        changeset(
          `'@mcs-ds/web': minor`,
          'feat(button)!: rename variant\n\nMigration: use tertiary.',
        ),
        STABLE,
      );
      expect(errors).toEqual([expect.stringContaining('attendu : major')]);
    });

    it('accepts a minor bump for a breaking change before 1.0', () => {
      const body = 'feat(button)!: rename variant\n\nMigration: replace ghost with tertiary.';
      expect(lintChangeset(changeset(`'@mcs-ds/web': minor`, body), PRE_STABLE)).toEqual([]);
    });
  });

  describe('isBreakingChangeset', () => {
    it('detects breaking changes from the bump or the header', () => {
      expect(isBreakingChangeset(changeset(`'@mcs-ds/web': major`, 'feat: x'))).toBe(true);
      expect(isBreakingChangeset(changeset(`'@mcs-ds/web': minor`, 'feat!: x'))).toBe(true);
      expect(isBreakingChangeset(changeset(`'@mcs-ds/web': minor`, 'feat: x'))).toBe(false);
    });
  });
});
