import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { readComponentNames, readWorkspacePackages } from './workspace.ts';

describe('workspace', () => {
  let root: string;

  beforeEach(() => {
    root = mkdtempSync(join(tmpdir(), 'mcs-workspace-'));
  });

  afterEach(() => {
    rmSync(root, { recursive: true, force: true });
  });

  const writePackage = (dir: string, manifest: object) => {
    mkdirSync(join(root, 'packages', dir), { recursive: true });
    writeFileSync(join(root, 'packages', dir, 'package.json'), JSON.stringify(manifest));
  };

  it('returns nothing before the first package exists', () => {
    expect(readWorkspacePackages(root)).toEqual([]);
    expect(readComponentNames(root)).toEqual([]);
  });

  it('reads package names, versions and privacy', () => {
    writePackage('web', { name: '@mcs-ds/web', version: '1.0.0' });
    writePackage('lab', { name: 'lab', version: '0.0.0', private: true });
    mkdirSync(join(root, 'packages', 'empty'));
    const packages = readWorkspacePackages(root).toSorted((a, b) => a.name.localeCompare(b.name));
    expect(
      packages.map(({ name, version, private: isPrivate }) => [name, version, isPrivate]),
    ).toEqual([
      ['@mcs-ds/web', '1.0.0', false],
      ['lab', '0.0.0', true],
    ]);
  });

  it('rejects a manifest without name or version', () => {
    writePackage('broken', { name: '@mcs-ds/broken' });
    expect(() => readWorkspacePackages(root)).toThrow('obligatoires');
  });

  it('lists component folders in order', () => {
    for (const name of ['tabs', 'button']) {
      mkdirSync(join(root, 'packages', 'web', 'src', 'components', name), { recursive: true });
    }
    expect(readComponentNames(root)).toEqual(['button', 'tabs']);
  });
});
