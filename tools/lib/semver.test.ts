import { describe, expect, it } from 'vitest';

import { chooseDistTag, compareSemver, parseSemver, requiredBreakingBump } from './semver.ts';

describe('semver', () => {
  it('parses versions with pre-release and build metadata', () => {
    expect(parseSemver('1.4.0-beta.2+build.5')).toEqual({
      major: 1,
      minor: 4,
      patch: 0,
      prerelease: ['beta', '2'],
    });
    expect(parseSemver('1.4')).toBeUndefined();
  });

  it.each([
    ['1.0.0', '1.0.1', -1],
    ['1.10.0', '1.9.0', 1],
    ['2.0.0', '2.0.0', 0],
    ['1.0.0-beta.2', '1.0.0', -1],
    ['1.0.0-beta.10', '1.0.0-beta.2', 1],
    ['1.0.0-alpha', '1.0.0-alpha.1', -1],
    ['1.0.0-1', '1.0.0-alpha', -1],
  ])('compares %s with %s', (a, b, expected) => {
    expect(compareSemver(a, b)).toBe(expected);
  });

  it('throws on invalid versions', () => {
    expect(() => compareSemver('next', '1.0.0')).toThrow('invalide');
  });

  it('requires minor for breaking changes before 1.0 and major after', () => {
    expect(requiredBreakingBump('0.4.2')).toBe('minor');
    expect(requiredBreakingBump('1.4.2')).toBe('major');
    expect(requiredBreakingBump(undefined)).toBe('major');
  });

  describe('chooseDistTag', () => {
    it('uses latest for the first release and for newer versions', () => {
      expect(chooseDistTag('1.0.0', undefined)).toBe('latest');
      expect(chooseDistTag('1.5.0', '1.4.3')).toBe('latest');
    });

    it('never moves latest back to an older line', () => {
      expect(chooseDistTag('1.4.4', '1.5.0')).toBe('maint-1.4');
    });

    it('uses the pre-release identifier', () => {
      expect(chooseDistTag('2.0.0-rc.1', '1.5.0')).toBe('rc');
      expect(chooseDistTag('2.0.0-0', '1.5.0')).toBe('next');
    });

    it('throws on invalid versions', () => {
      expect(() => chooseDistTag('latest', undefined)).toThrow('invalide');
    });
  });
});
