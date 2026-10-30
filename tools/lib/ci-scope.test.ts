import { describe, expect, it } from 'vitest';

import { computeScope, toGithubOutput } from './ci-scope.ts';

const withPackages = [
  'package.json',
  'packages/web/package.json',
  'packages/web/src/components/tabs/tabs.css',
  'packages/web/src/components/tabs/tabs.browser.test.ts',
  'packages/web/src/components/tabs/tabs.visual.test.ts',
];

describe('ci scope', () => {
  it('runs nothing conditional while no package exists', () => {
    expect(
      computeScope({ changedFiles: undefined, trackedFiles: ['package.json', 'tools/x.ts'] }),
    ).toEqual({
      packages: false,
      browser: false,
      visual: false,
      packageChecks: false,
    });
  });

  it('runs everything that exists on full runs', () => {
    expect(computeScope({ changedFiles: undefined, trackedFiles: withPackages })).toEqual({
      packages: true,
      browser: true,
      visual: true,
      packageChecks: true,
    });
  });

  it('skips browser and visual tests for documentation-only changes', () => {
    const scope = computeScope({
      changedFiles: ['docs/architecture/TOKENS.md'],
      trackedFiles: withPackages,
    });
    expect(scope).toEqual({ packages: true, browser: false, visual: false, packageChecks: false });
  });

  it('runs visual tests when CSS changes', () => {
    const scope = computeScope({
      changedFiles: ['packages/web/src/components/tabs/tabs.css'],
      trackedFiles: withPackages,
    });
    expect(scope.visual).toBe(true);
    expect(scope.browser).toBe(true);
  });

  it('runs everything when shared inputs change', () => {
    const scope = computeScope({ changedFiles: ['pnpm-lock.yaml'], trackedFiles: withPackages });
    expect(scope).toEqual({ packages: true, browser: true, visual: true, packageChecks: true });
  });

  it('formats GitHub outputs', () => {
    expect(
      toGithubOutput({ packages: true, browser: false, visual: false, packageChecks: true }),
    ).toBe('packages=true\nbrowser=false\nvisual=false\npackageChecks=true');
  });
});
