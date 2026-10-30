import { describe, expect, it } from 'vitest';

import { checkBranchName, checkPushedRefs, isProtectedBranch, parsePushedRefs } from './branch.ts';

const SHA = 'a'.repeat(40);
const ZERO = '0'.repeat(40);

describe('branch', () => {
  describe('checkBranchName', () => {
    it.each([
      ['feature/button-loading-state', 'work'],
      ['fix/123-dialog-focus-restoration', 'work'],
      ['hotfix/dialog-crash', 'work'],
      ['chore/update-ci', 'work'],
      ['docs/tokens-guide', 'work'],
      ['release/1.x', 'maintenance'],
      ['release/1.4.x', 'maintenance'],
      ['renovate/eslint-10.x', 'bot'],
      ['changeset-release/main', 'bot'],
      ['main', 'trunk'],
    ])('accepts %s as a %s branch', (name, kind) => {
      expect(checkBranchName(name)).toEqual({ valid: true, kind });
    });

    it.each([
      'develop',
      'feature/Button',
      'feat/button',
      'feature/button_state',
      'feature/',
      'release/next',
    ])('rejects %s', (name) => {
      expect(checkBranchName(name).valid).toBe(false);
    });

    it('rejects names that are too long', () => {
      const result = checkBranchName(`feature/${'a'.repeat(80)}`);
      expect(result.valid).toBe(false);
    });
  });

  describe('isProtectedBranch', () => {
    it('protects main and release branches only', () => {
      expect(isProtectedBranch('main')).toBe(true);
      expect(isProtectedBranch('release/1.x')).toBe(true);
      expect(isProtectedBranch('feature/x')).toBe(false);
    });
  });

  describe('checkPushedRefs', () => {
    it('allows a valid work branch', () => {
      const refs = parsePushedRefs(`refs/heads/feature/x ${SHA} refs/heads/feature/x ${ZERO}\n`);
      expect(checkPushedRefs(refs)).toEqual([]);
    });

    it('refuses a direct push to main', () => {
      const refs = parsePushedRefs(`refs/heads/main ${SHA} refs/heads/main ${SHA}`);
      expect(checkPushedRefs(refs)).toEqual([expect.stringContaining('Push direct interdit')]);
    });

    it('refuses the deletion of a release branch', () => {
      const refs = parsePushedRefs(`(delete) ${ZERO} refs/heads/release/1.x ${SHA}`);
      expect(checkPushedRefs(refs)).toEqual([expect.stringContaining('Suppression interdit')]);
    });

    it('refuses an invalid branch name', () => {
      const refs = parsePushedRefs(`refs/heads/wip ${SHA} refs/heads/wip ${ZERO}`);
      expect(checkPushedRefs(refs)).toHaveLength(1);
    });

    it('refuses version tags pushed by hand but allows other tags', () => {
      const refs = parsePushedRefs(
        [
          `refs/tags/v1.0.0 ${SHA} refs/tags/v1.0.0 ${ZERO}`,
          `refs/tags/spike ${SHA} refs/tags/spike ${ZERO}`,
        ].join('\n'),
      );
      expect(checkPushedRefs(refs)).toEqual([expect.stringContaining('v1.0.0')]);
    });

    it('ignores malformed lines', () => {
      expect(parsePushedRefs('garbage\n\n')).toEqual([]);
    });
  });
});
