import { defineNuxtModule, addVitePlugin, useLogger } from '@nuxt/kit';
import type oxlintPlugin from 'vite-plugin-oxlint';

import { findConfigFile } from './config-file';

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
  checker?: boolean | CheckerOptions;
  /**
   * Display the path to the oxlint config file in the terminal when the dev server starts.
   * Follows the same lookup as `vite-plugin-oxlint`: `configFile`, a legacy `oxlintrc.json`, then oxlint's own discovery.
   * This can help confirm that the correct config file is being used.
   * @see findConfigFile function for the list of config file names that are checked.
   * @default false
   * @remarks This option only affects the display of the config file path in the terminal. It does not affect whether the checker is enabled or how it functions.
   */
  displayConfigfileOnStart?: boolean;
}

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
      await logConfigFilePath(logger, checkerOptions);
    }

    const vitePluginOxlint = await import('vite-plugin-oxlint').then(
      (m) => ('default' in m ? m.default : m) as typeof import('vite-plugin-oxlint').default,
    );

    addVitePlugin(() => vitePluginOxlint(checkerOptions), { server: false });
  },
});

/**
 * Logs the path to the oxlint config file `vite-plugin-oxlint` will use, or that oxlint defaults apply.
 *
 * @param logger The logger instance to use for logging.
 * @param checkerOptions The checker options forwarded to `vite-plugin-oxlint`.
 */
async function logConfigFilePath(logger: ReturnType<typeof useLogger>, checkerOptions: CheckerOptions): Promise<void> {
  const configFilePath = await findConfigFile({
    cwd: process.cwd(),
    configFile: checkerOptions.configFile,
    path: checkerOptions.path,
  });
  if (configFilePath) {
    logger.info(`Using oxlint config file: ${configFilePath}`);
  } else {
    logger.info('No oxlint config file found.');
    logger.info(`Using oxlint defaults. You can create a config file in the project root to customize the behavior.`);
  }
}
