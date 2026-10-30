import { defineConfig } from 'vitest/config';

/**
 * Test projects (docs/engineering/TESTING_STRATEGY.md).
 * - unit: pure modules, run in Node.
 * - browser: component tests in real Chromium, Firefox and WebKit. Added with the first package,
 *   using `@vitest/browser-playwright` and the `*.browser.test.ts` naming convention.
 */
export default defineConfig({
  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['tools/**/*.test.ts', 'packages/*/src/**/*.test.ts'],
          exclude: ['**/node_modules/**', '**/*.browser.test.ts'],
          environment: 'node',
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['tools/lib/**/*.ts'],
      exclude: ['**/*.test.ts'],
      reporter: ['text', 'html', 'json-summary'],
      thresholds: {
        lines: 85,
        functions: 85,
        statements: 85,
        branches: 75,
      },
    },
  },
});
