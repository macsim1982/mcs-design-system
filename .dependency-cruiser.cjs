/**
 * Architecture as code: the dependency rules of docs/architecture/ARCHITECTURE.md (section 4.3).
 * Each rule names the architecture rule it enforces (R1…R10).
 * @type {import('dependency-cruiser').IConfiguration}
 */
const ADAPTERS = '^packages/(react|vue|svelte|angular)/';
const CONTRACTS =
  '^packages/web/src/(contracts\\.ts|components/[^/]+/[^/]+\\.contract\\.ts|internal/contract\\.ts)$';
const TEST_OR_FIXTURE = '\\.(test|browser\\.test|visual\\.test|e2e\\.test|test-d|fixtures)\\.tsx?$';

module.exports = {
  forbidden: [
    {
      name: 'no-circular',
      comment: 'R1 — no cycle, between packages or modules.',
      severity: 'error',
      from: {},
      to: { circular: true },
    },
    {
      name: 'tokens-are-a-leaf',
      comment: 'R2 — @mcs-ds/tokens depends on nothing.',
      severity: 'error',
      from: { path: '^packages/tokens/src/' },
      to: { pathNot: '^packages/tokens/src/' },
    },
    {
      name: 'contracts-are-a-leaf',
      comment: 'R2 — contracts are data and types: they only import other contracts.',
      severity: 'error',
      from: { path: CONTRACTS },
      to: { pathNot: CONTRACTS },
    },
    {
      name: 'elements-stay-framework-free',
      comment: 'R5 — no framework (nor rendering library) in @mcs-ds/web or @mcs-ds/tokens.',
      severity: 'error',
      from: { path: '^packages/(web|tokens)/' },
      to: { path: 'node_modules/(react|react-dom|vue|svelte|@angular|lit|@lit)/' },
    },
    {
      name: 'behaviors-do-not-import-css',
      comment:
        "R5 — loading styles is the application's job, never a side effect of behavior code.",
      severity: 'error',
      from: { path: '^packages/web/src/.+\\.ts$' },
      to: { path: '\\.css$' },
    },
    {
      name: 'internal-is-private',
      comment: 'R6 — internal helpers are only importable from inside @mcs-ds/web.',
      severity: 'error',
      from: { pathNot: '^packages/web/src/' },
      to: { path: '^packages/web/src/internal/' },
    },
    {
      name: 'nothing-depends-on-adapters',
      comment: 'R7 — no package depends on an adapter (apps may).',
      severity: 'error',
      from: { pathNot: `${ADAPTERS}|^apps/` },
      to: { path: ADAPTERS },
    },
    {
      name: 'adapters-are-independent',
      comment: 'R7 — an adapter never depends on another adapter.',
      severity: 'error',
      from: { path: ADAPTERS },
      to: { path: ADAPTERS, pathNot: '^packages/$1/' },
    },
    {
      name: 'adapters-use-public-entry-points',
      comment: 'R8 — adapters import @mcs-ds/web through its package exports, never its sources.',
      severity: 'error',
      from: { path: ADAPTERS },
      to: { path: '^packages/web/src/' },
    },
    {
      name: 'no-undeclared-deps-in-published-code',
      comment: 'R9 — published code only imports dependencies declared in its own package.json.',
      severity: 'error',
      from: { path: '^packages/[^/]+/src/', pathNot: TEST_OR_FIXTURE },
      to: { dependencyTypes: ['npm-no-pkg', 'npm-unknown', 'npm-dev'] },
    },
    {
      name: 'production-code-ignores-tooling',
      comment: 'R10 — production code never depends on tools, tests or fixtures.',
      severity: 'error',
      from: { path: '^packages/[^/]+/src/', pathNot: TEST_OR_FIXTURE },
      to: { path: [`^tools/`, TEST_OR_FIXTURE] },
    },
    {
      name: 'no-unresolvable',
      comment: 'Every import must resolve.',
      severity: 'error',
      from: {},
      to: { couldNotResolve: true },
    },
  ],
  options: {
    doNotFollow: { path: 'node_modules' },
    exclude: { path: '(^|/)(dist|coverage|templates)/' },
    tsPreCompilationDeps: true,
    tsConfig: { fileName: 'tsconfig.json' },
    combinedDependencies: false,
    enhancedResolveOptions: {
      exportsFields: ['exports'],
      conditionNames: ['import', 'require', 'node', 'default', 'types'],
      extensions: ['.ts', '.tsx', '.js', '.mjs', '.cjs', '.d.ts'],
    },
    reporterOptions: {
      text: { highlightFocused: true },
    },
  },
};
