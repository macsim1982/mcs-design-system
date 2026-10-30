/**
 * Conventional Commits, enforced on every commit (commit-msg hook) and on every PR title (pr.yml).
 * Rules and rationale: docs/engineering/GIT_WORKFLOW.md, section 7.
 */
export default {
  extends: ['@commitlint/config-conventional'],
  rules: {
    'type-enum': [
      2,
      'always',
      [
        'feat',
        'fix',
        'docs',
        'style',
        'refactor',
        'perf',
        'test',
        'build',
        'ci',
        'chore',
        'revert',
      ],
    ],
    'scope-case': [2, 'always', 'kebab-case'],
    'header-max-length': [2, 'always', 100],
    // URLs and stack traces may exceed the limit: warn instead of failing.
    'body-max-line-length': [1, 'always', 100],
    'footer-max-line-length': [1, 'always', 100],
  },
  helpUrl: 'docs/engineering/GIT_WORKFLOW.md (section 7, « Messages de commit »)',
};
