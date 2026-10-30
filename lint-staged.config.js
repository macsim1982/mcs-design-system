/**
 * Checks run by the pre-commit hook, on staged files only (docs/engineering/GIT_WORKFLOW.md, section 8).
 * Linters fix what they can first, then Prettier formats; secretlint never modifies files.
 * @type {import('lint-staged').Configuration}
 */
export default {
  '*.{js,mjs,cjs,ts,mts,cts,tsx}': ['eslint --fix --max-warnings=0', 'prettier --write'],
  '*.css': ['stylelint --fix --max-warnings=0', 'prettier --write'],
  '*.{json,md,yml,yaml,html}': ['prettier --write'],
  '*': ['secretlint'],
};
