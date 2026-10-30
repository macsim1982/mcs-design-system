/**
 * Reads workspace packages from disk (used by the release and changeset scripts).
 */
import { existsSync, readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

export interface WorkspacePackage {
  readonly name: string;
  readonly version: string;
  readonly private: boolean;
  readonly dir: string;
}

interface Manifest {
  readonly name?: unknown;
  readonly version?: unknown;
  readonly private?: unknown;
}

/** Lists `packages/*` that have a valid package.json (published and private). */
export function readWorkspacePackages(rootDir: string): WorkspacePackage[] {
  const packagesDir = join(rootDir, 'packages');
  if (!existsSync(packagesDir)) return [];
  return readdirSync(packagesDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => join(packagesDir, entry.name))
    .filter((dir) => existsSync(join(dir, 'package.json')))
    .map((dir) => {
      const manifest = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8')) as Manifest;
      if (typeof manifest.name !== 'string' || typeof manifest.version !== 'string') {
        throw new Error(`${dir}/package.json : "name" et "version" sont obligatoires.`);
      }
      return {
        name: manifest.name,
        version: manifest.version,
        private: manifest.private === true,
        dir,
      };
    });
}

/** Component names, from the folders of packages/web/src/components. */
export function readComponentNames(rootDir: string): string[] {
  const dir = join(rootDir, 'packages', 'web', 'src', 'components');
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .toSorted();
}
