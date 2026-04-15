# Nuxt Oxlint

[![npm version][npm-version-src]][npm-version-href]
[![npm downloads][npm-downloads-src]][npm-downloads-href]
[![License][license-src]][license-href]
[![Nuxt][nuxt-src]][nuxt-href]

> Integrate [Oxlint](https://oxc.rs/docs/guide/usage/linter.html) into your Nuxt project — and see lint output directly in the dev server terminal on every save.

Heavily inspired by [`@nuxt/eslint`](https://eslint.nuxt.com), but built for **Oxlint**: a Rust-powered linter built on the Oxc compiler stack, that is orders of magnitude faster than ESLint.

- [✨ &nbsp;Release Notes](/CHANGELOG.md)
<!-- - [🏀 Online playground](https://stackblitz.com/github/BaptisteCrouzet/nuxt-oxlint?file=playground%2Fapp.vue) -->

## Features

- ⚡ &nbsp;**Fast** — Oxlint is written in Rust and runs in milliseconds even on large codebases (50 to 100 times faster than ESLint ([`see benchmarks`](https://github.com/oxc-project/bench-linter))
- 🖥 &nbsp;**Dev server output** — lint results appear directly in the terminal at every file save, without leaving your editor
- 🔧 &nbsp;**Fully configurable** — exposes all `vite-plugin-oxlint` options (config file, rules, format, auto-fix…)
- 🚫 &nbsp;**Zero runtime overhead** — dev-only, nothing shipped to the browser
- 

## How it works

`nuxt-oxlint` wraps [`vite-plugin-oxlint`](https://github.com/52-entertainment/vite-plugin-oxlint) and registers it inside Nuxt's Vite pipeline via `addVitePlugin`. On every file change detected by the Vite watcher, Oxlint is spawned on the modified file and its output is printed in the dev server terminal.

## Requirements

- Nuxt ≥ 4 (Vite builder)
- [`oxlint`](https://www.npmjs.com/package/oxlint) installed in your project as a dev dependency

## Quick Setup

```bash
# 1. Install the module and the oxlint binary
pnpm add -D nuxt-oxlint oxlint

# 2. Add it to your nuxt.config.ts
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-oxlint'],
  oxlint: {
    checker: true, // enable with defaults
  },
})
```

That's it — start the dev server and oxlint will run on every save.

## Configuration

All options live under the `oxlint` key in `nuxt.config.ts`.

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['nuxt-oxlint'],

  oxlint: {
    // Set to `true` to enable with defaults, or pass an options object.
    checker: {
      // Path to an oxlint config file (default: oxlintrc.json), it can also be oxlint.config.ts or vite.config.ts, where you placed it
      // See : https://oxc.rs/docs/guide/usage/linter/config.html
      configFile: '.oxlintrc.json',

      // Directory to lint (default: project root as '.')
      path: 'app',

      // Run oxlint when the dev server starts (default: true)
      lintOnStart: true,

      // Suppress warnings, only report errors (default: false)
      // Same as running : oxlint --quiet
      quiet: false,

      // Fail the dev build on lint errors (default: false)
      failOnError: false,

      // Fail the dev build on lint warnings (default: false)
      failOnWarning: false,

      // Attempt an auto-fix when the rule get triggered, if an autofix exists
      fix: false

      // Rules to enable / disable / warn
      // See : https://oxc.rs/docs/guide/usage/linter/rules.html
      deny: ['correctness'],
      allow: ['debugger'],
      warn: ['suspicious'],

      // Output format: default | stylish | github | gitlab | json | unix | ...
      // See : https://oxc.rs/docs/guide/usage/linter/output-formats.html
      format: 'default',

      // For your glob patterns or files to ignore
      // ignorePattern: 'path/to/dummy/files/beeing/never/linted.ts'

      // Path to the oxlint binary (useful in monorepos)
      // oxlintPath: '/path/to/node_modules/.bin/oxlint',

      // CLI flags additionnaly passed to oxlint
      // See : https://oxc.rs/docs/guide/usage/linter/cli.html
      // params: '--report-unused-disable-directives --type-aware'
    },
  },
})
```

### Available options

All options from [`vite-plugin-oxlint`](https://github.com/52-entertainment/vite-plugin-oxlint#options) are supported:

| Option | Type | Default | Description |
|---|---|---|---|
| `configFile` | `string` | `oxlintrc.json` | Path to the oxlint config file |
| `path` | `string` | `.` | Directory where oxlint runs |
| `ignorePattern` | `string \| string[]` | — | Glob patterns to ignore |
| `allow` | `string[]` | — | Rules/categories to turn off |
| `deny` | `string[]` | — | Rules/categories to turn on |
| `warn` | `string[]` | — | Rules/categories to warn |
| `oxlintPath` | `string` | — | Explicit path to the oxlint binary |
| `format` | `string` | `default` | Output format |
| `quiet` | `boolean` | `false` | Only report errors |
| `fix` | `boolean` | `false` | Auto-fix issues |
| `failOnError` | `boolean` | `false` | Fail build on errors |
| `failOnWarning` | `boolean` | `false` | Fail build on warnings |
| `lintOnStart` | `boolean` | `true` | Lint all files on dev server start |
| `params` | `string` | — | Extra raw CLI flags |

## Migrating from `@nuxt/eslint`

### 1. Swap the packages

```bash
pnpm remove @nuxt/eslint
pnpm add -D nuxt-oxlint oxlint
```

### 2. Update `nuxt.config.ts`

```diff
  export default defineNuxtConfig({
    modules: [
-     '@nuxt/eslint',
+     'nuxt-oxlint',
    ],
-   eslint: {
-     checker: true,
-   },
+   oxlint: {
+     checker: true,
+   },
  })
```

### 3. (Optional) Keep ESLint for rules not yet covered by Oxlint

Oxlint covers [~715 rules](https://oxc.rs/docs/guide/usage/linter/rules.html) out of the box, including popular plugins.
If you still rely on ESLint plugins that Oxlint doesn't support yet, you can run both in parallel:

```bash
pnpm add -D @nuxt/eslint eslint-plugin-oxlint
```

```ts
// nuxt.config.ts
export default defineNuxtConfig({
  modules: ['@nuxt/eslint', 'nuxt-oxlint'],
  eslint: { checker: true },
  oxlint: { checker: true },
})
```

Then add [`eslint-plugin-oxlint`](https://github.com/oxc-project/eslint-plugin-oxlint) to your ESLint config to automatically turn off rules already handled by Oxlint — avoiding double reports:

```js
// eslint.config.mjs
import oxlint from 'eslint-plugin-oxlint'

export default [
  // … your other rules
  ...oxlint.buildFromOxlintConfigFile('.oxlintrc.json'),
]
```

## Contribution

<details>
  <summary>Local development</summary>

  ```bash
  # Install dependencies
  pnpm install

  # Generate type stubs
  pnpm dev:prepare

  # Develop with the playground
  pnpm dev

  # Build the module
  pnpm prepack

  # Run ESLint
  pnpm lint

  # Run Vitest
  pnpm test
  pnpm test:watch
  ```

</details>

<details>
  <summary>Contributing</summary>

  * Conventional commits are required
  * This is not an official Nuxt module
  * Be kind

</details>

<!-- Badges -->
[npm-version-src]: https://img.shields.io/npm/v/nuxt-oxlint/latest.svg?style=flat&colorA=020420&colorB=00DC82
[npm-version-href]: https://npmjs.com/package/nuxt-oxlint

[npm-downloads-src]: https://img.shields.io/npm/dm/nuxt-oxlint.svg?style=flat&colorA=020420&colorB=00DC82
[npm-downloads-href]: https://npmjs.com/package/nuxt-oxlint

[license-src]: https://img.shields.io/npm/l/nuxt-oxlint.svg?style=flat&colorA=020420&colorB=00DC82
[license-href]: https://npmjs.com/package/nuxt-oxlint

[nuxt-src]: https://img.shields.io/badge/Nuxt-020420?logo=nuxt.js
[nuxt-href]: https://nuxt.com
