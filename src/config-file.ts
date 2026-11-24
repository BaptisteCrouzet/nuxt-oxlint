import { access } from 'node:fs/promises';
import { join, resolve } from 'node:path';

/** Config file names oxlint discovers by itself, in the directory it lints. */
export const OXLINT_CONFIG_FILES = ['.oxlintrc.json', '.oxlintrc.jsonc', 'oxlint.config.ts'] as const;

/** Legacy config name that `vite-plugin-oxlint` passes to oxlint explicitly when no `configFile` is set. */
export const LEGACY_CONFIG_FILE = 'oxlintrc.json';

export interface ConfigFileLookupOptions {
  /** Directory `vite-plugin-oxlint` resolves relative paths against (`process.cwd()` at runtime). */
  cwd: string;
  /** The `configFile` checker option. */
  configFile?: string;
  /** The `path` checker option: the directory oxlint runs in, relative to `cwd`. */
  path?: string;
}

/**
 * Resolves the oxlint config file `vite-plugin-oxlint` will end up using, following the same order:
 * the explicit `configFile` (or a legacy `oxlintrc.json` when none is set), then the files oxlint discovers
 * in the directory it lints. An explicit `configFile` that does not exist falls back to discovery, as the plugin does.
 * @param options Where to look and which checker options apply.
 * @returns The absolute path to the config file, or null if none is found.
 */
export async function findConfigFile({ cwd, configFile, path = '' }: ConfigFileLookupOptions): Promise<string | null> {
  const lintDir = resolve(cwd, path);
  const candidates = [
    configFile ? resolve(cwd, configFile) : join(cwd, LEGACY_CONFIG_FILE),
    ...OXLINT_CONFIG_FILES.map((fileName) => join(lintDir, fileName)),
  ];

  for (const filePath of candidates) {
    if (await fileExists(filePath)) {
      return filePath;
    }
  }
  return null;
}

/**
 * Checks whether a file exists.
 * @param filePath The path to check.
 * @returns True if the path is accessible.
 */
async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}
