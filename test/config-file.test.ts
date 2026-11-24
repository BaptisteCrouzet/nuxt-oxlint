import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { findConfigFile } from '../src/config-file';

describe('findConfigFile', () => {
  let cwd: string;

  const touch = async (relativePath: string) => {
    const filePath = join(cwd, relativePath);
    await mkdir(join(filePath, '..'), { recursive: true });
    await writeFile(filePath, '{}');
    return filePath;
  };

  beforeEach(async () => {
    cwd = await mkdtemp(join(tmpdir(), 'nuxt-oxlint-'));
  });

  afterEach(async () => {
    await rm(cwd, { recursive: true, force: true });
  });

  it('returns null when there is no config file', async () => {
    expect(await findConfigFile({ cwd })).toBeNull();
  });

  it.each(['.oxlintrc.json', '.oxlintrc.jsonc', 'oxlint.config.ts'])('finds a discovered %s', async (fileName) => {
    const filePath = await touch(fileName);
    expect(await findConfigFile({ cwd })).toBe(filePath);
  });

  it.each(['.oxlintrc', '.oxlintrc.js', 'oxlint.config.js'])('ignores %s, which oxlint does not discover', async (fileName) => {
    await touch(fileName);
    expect(await findConfigFile({ cwd })).toBeNull();
  });

  it('prefers the legacy oxlintrc.json, which the plugin passes explicitly', async () => {
    await touch('.oxlintrc.json');
    const legacy = await touch('oxlintrc.json');
    expect(await findConfigFile({ cwd })).toBe(legacy);
  });

  it('uses an explicit configFile relative to cwd over discovered files', async () => {
    await touch('.oxlintrc.json');
    const custom = await touch('config/custom.json');
    expect(await findConfigFile({ cwd, configFile: 'config/custom.json' })).toBe(custom);
  });

  it('accepts an absolute configFile', async () => {
    const custom = await touch('custom.json');
    expect(await findConfigFile({ cwd, configFile: custom })).toBe(custom);
  });

  it('falls back to discovery when the explicit configFile is missing, skipping the legacy file', async () => {
    await touch('oxlintrc.json');
    const discovered = await touch('.oxlintrc.json');
    expect(await findConfigFile({ cwd, configFile: 'missing.json' })).toBe(discovered);
  });

  it('discovers config files in the `path` directory oxlint runs in', async () => {
    await touch('.oxlintrc.json');
    const nested = await touch('app/.oxlintrc.json');
    expect(await findConfigFile({ cwd, path: 'app' })).toBe(nested);
  });
});
