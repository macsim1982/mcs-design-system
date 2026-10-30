/**
 * Decides which conditional quality gates run (docs/engineering/GIT_WORKFLOW.md, section 11).
 * Pull requests run what their changes require; every other event runs everything that exists.
 */

export interface ScopeInput {
  /** Files changed by the pull request, or undefined for a full run (push, release, manual). */
  readonly changedFiles: readonly string[] | undefined;
  /** Files tracked in the repository (`git ls-files`). */
  readonly trackedFiles: readonly string[];
}

export interface Scope {
  /** At least one workspace package exists. */
  readonly packages: boolean;
  /** Component tests in real browsers (and accessibility checks). */
  readonly browser: boolean;
  /** Visual regression tests. */
  readonly visual: boolean;
  /** publint, attw and size budgets. */
  readonly packageChecks: boolean;
}

const PACKAGE_MANIFEST = /^packages\/[^/]+\/package\.json$/u;
const BROWSER_TEST = /\.browser\.test\.tsx?$/u;
const SHARED_INPUTS =
  /^(?:pnpm-lock\.yaml|package\.json|vitest\.config\.ts|playwright\.config\.ts|\.github\/)/u;
const VISUAL_INPUTS = /(?:\.css|\.fixtures\.ts|\.visual\.test\.ts|\.tokens\.json)$/u;

export function computeScope({ changedFiles, trackedFiles }: ScopeInput): Scope {
  const packages = trackedFiles.some((file) => PACKAGE_MANIFEST.test(file));
  const hasBrowserTests = trackedFiles.some((file) => BROWSER_TEST.test(file));
  const hasVisualTests = trackedFiles.some((file) => file.endsWith('.visual.test.ts'));

  const changed = (predicate: (file: string) => boolean): boolean =>
    changedFiles === undefined || changedFiles.some(predicate);
  const sharedChanged = changed((file) => SHARED_INPUTS.test(file));
  const codeChanged = changed((file) => file.startsWith('packages/') || file.startsWith('apps/'));

  return {
    packages,
    browser: hasBrowserTests && (codeChanged || sharedChanged),
    visual:
      hasVisualTests &&
      (sharedChanged ||
        changed((file) => VISUAL_INPUTS.test(file) || file.startsWith('packages/tokens/'))),
    packageChecks: packages && (sharedChanged || changed((file) => file.startsWith('packages/'))),
  };
}

/** Formats a scope for $GITHUB_OUTPUT (`key=value` lines). */
export function toGithubOutput(scope: Scope): string {
  return Object.entries(scope)
    .map(([key, value]) => `${key}=${String(value)}`)
    .join('\n');
}
