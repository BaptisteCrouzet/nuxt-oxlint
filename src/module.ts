import { defineNuxtModule, addVitePlugin, useLogger } from '@nuxt/kit'
import type oxlintPlugin from 'vite-plugin-oxlint'

export type CheckerOptions = NonNullable<Parameters<typeof oxlintPlugin>[0]>

export interface ModuleOptions {
  /**
   * Enable the oxlint checker in the Vite dev server.
   * Set to `true` to use defaults, or pass an options object to customize.
   *
   * Requires `oxlint` to be installed in the project.
   * @default false
   */
  checker?: boolean | CheckerOptions
}

export default defineNuxtModule<ModuleOptions>({
  meta: {
    name: 'nuxt-oxlint',
    configKey: 'oxlint',
  },
  defaults: {
    checker: false,
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

    const vitePluginOxlint = await import('vite-plugin-oxlint').then(
      m => ('default' in m ? m.default : m) as typeof import('vite-plugin-oxlint').default,
    );

    addVitePlugin(() => vitePluginOxlint(checkerOptions), { server: false });
  },
})
