import { defineNuxtModule, addVitePlugin, useLogger } from '@nuxt/kit';
import type oxlintPlugin from 'vite-plugin-oxlint';

import { promises } from 'node:fs';
import { join } from 'node:path';

export type CheckerOptions = NonNullable<Parameters<typeof oxlintPlugin>[0]>;

export interface ModuleOptions {
  /**
   * Enable the oxlint checker in the Vite dev server.
   * Set to `true` to use defaults, or pass an options object to customize.
   *
   * Requires `oxlint` to be installed in the project.
   * @see https://github.com/52-entertainment/vite-plugin-oxlint for available and default options.
   * @default false
   */
  checker?: boolean | CheckerOptions
  /**
   * Display the path to the oxlint config file in the terminal when the dev server starts.
   * Attempts to find common config file names in the project root directory.
   * This can help confirm that the correct config file is being used.
   * @see findConfigFile function for the list of config file names that are checked.
   * @default false
   * @remarks This option only affects the display of the config file path in the terminal. It does not affect whether the checker is enabled or how it functions.
   */
  displayConfigfileOnStart?: boolean
};

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-oxlint',
    configKey: 'oxlint',
  },
  defaults: {
    checker: false,
    displayConfigfileOnStart: false,
  },
  async setup(options, nuxt) {
    if (!options.checker || !nuxt.options.dev) {
      return;
    }

    const logger = useLogger('nuxt:oxlint');

    if (nuxt.options.builder !== '@nuxt/vite-builder') {
      logger.warn('nuxt-oxlint checker only supports the Vite builder. Checker will not be enabled.');
      return;
    }

    const checkerOptions: CheckerOptions = typeof options.checker === 'object' ? options.checker : {};

    if (options.displayConfigfileOnStart) {
      await logConfigFilePath(logger, checkerOptions.configFile || null, nuxt.options.rootDir);
    }

    const vitePluginOxlint = await import('vite-plugin-oxlint').then(
      m => ('default' in m ? m.default : m) as typeof import('vite-plugin-oxlint').default,
    );

    addVitePlugin(() => vitePluginOxlint(checkerOptions), { server: false });
  },
});

/**
 * Finds the oxlint config file in the project root directory.
 * @param rootDir The root directory of the project.
 * @returns The path to the oxlint config file, or null if not found.
 */
async function findConfigFile(rootDir: string): Promise<string | null> {
  const configFiles = ['.oxlintrc', '.oxlintrc.json', '.oxlintrc.js', 'oxlint.config.js', 'config/oxlint.config.js'];

  return new Promise((resolve) => {
    for (const fileName of configFiles) {
      const filePath = join(rootDir, fileName);
        promises.access(filePath)
          .then(() => {
            resolve(filePath);
          })
          .catch(() => {
            // File does not exist, continue to the next one
          });
    }
    resolve(null);
  });
}

/**
 * Logs the path to the oxlint config file if found, or a warning if not found.
 * 
 * @param logger The logger instance to use for logging.
 * @param filePath The path to the oxlint config file, or null if not found.
 * @param rootDir The root directory of the project (used for logging context).
 */
async function logConfigFilePath(logger: ReturnType<typeof useLogger>, filePath: string | null, rootDir: string): Promise<void> {
  try {
    const configFilePath = await findConfigFile(rootDir);
    if (configFilePath) {
      logger.info(`Using oxlint config file: ${configFilePath}`);
    } else {
      logger.info('No oxlint config file found in the project root.');
      logger.info(`Using oxlint defaults. You can create a config file in the project root to customize the behavior.`);
    }
  } catch (error) {
    logger.error('Error finding oxlint config file:', error);
  }
}
