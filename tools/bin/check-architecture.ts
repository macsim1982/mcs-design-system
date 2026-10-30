/**
 * Runs the architecture rules (.dependency-cruiser.cjs) on every source root that exists, so that
 * packages and apps are covered as soon as they are created.
 */
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const roots = ['tools', 'packages', 'apps'].filter((root) => existsSync(root));
const result = spawnSync(
  'pnpm',
  ['exec', 'depcruise', '--config', '.dependency-cruiser.cjs', ...roots],
  {
    stdio: 'inherit',
  },
);
process.exitCode = result.status ?? 1;
