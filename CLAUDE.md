# CLAUDE.md

Guidance for AI agents working in this repository.

## What this is

`@baptistecrouzet/nuxt-oxlint` is a Nuxt 4 module that wires [oxlint](https://oxc.rs) into the Vite dev server through `vite-plugin-oxlint`. It is a **dev-time, build-time only** module: nothing ships to the client runtime.

Published to both npm and GitHub Packages under the `@baptistecrouzet` scope.

## Layout

| Path | Role |
| --- | --- |
| `src/module.ts` | The whole module: options, config-file lookup, Vite plugin registration |
| `src/runtime/plugin.ts` | Intentionally empty — there is no runtime plugin |
| `playground/` | Nuxt app for manual testing, consumes the module by name |
| `test/basic.test.ts` | Vitest + `@nuxt/test-utils` e2e test |
| `test/fixtures/basic/` | Minimal Nuxt app, imports `src/module` directly |
| `app/`, `nuxt.config.ts` | Root Nuxt shell, not part of the published package |
| `docs/screenshots/` | README assets |
| `.oxlintrc.json`, `.oxfmtrc.json` | Lint and format config — see below |

Only `dist/` is published (`files` in `package.json`).

## Toolchain

- **pnpm** is the package manager. Do not use npm or yarn for installs, even though the publish scripts call `npm publish` directly.
- Node 20 in CI, Node 22 locally — both fine.
- Build: `@nuxt/module-builder`. Lint: **oxlint** (`.oxlintrc.json`). Format: **oxfmt** (`.oxfmtrc.json`). The repo dogfoods the toolchain it integrates.

## Commands

```bash
pnpm dev:prepare   # stub build + prepare playground — run this first after a fresh clone
pnpm dev           # dev:prepare + nuxt dev playground
pnpm lint          # oxlint
pnpm lint:fix      # oxlint --fix
pnpm format        # oxfmt — rewrites files in place
pnpm format:check  # oxfmt --check — what CI runs
pnpm test          # vitest run
pnpm test:types    # vue-tsc --noEmit (root + playground)
pnpm prepack       # real build into dist/
```

`pnpm dev:prepare` is a prerequisite for `pnpm test` on a cold checkout — CI runs it explicitly before the test job.

Before pushing, run at minimum `pnpm lint`, `pnpm format:check` and `pnpm test`.

## Module contract

Config key is `oxlint` in `nuxt.config.ts`. Options (`ModuleOptions` in `src/module.ts`):

- `checker: boolean | CheckerOptions` — `false` by default. `true` uses defaults, an object is forwarded verbatim to `vite-plugin-oxlint`.
- `displayConfigfileOnStart: boolean` — `false` by default. Logs the resolved oxlint config path at dev-server start.

`setup()` returns early unless `options.checker` is truthy **and** `nuxt.options.dev` is true, and warns out when the builder is not `@nuxt/vite-builder`. Keep that guard: enabling the plugin in production builds or under a non-Vite builder is a bug, not a feature.

`CheckerOptions` is derived from `vite-plugin-oxlint`'s own parameter type — do not hand-copy its option list.

## Lint and format config

`.oxlintrc.json` mirrors the plugin coverage the previous `@nuxt/eslint-config` setup had: `typescript`, `unicorn`, `oxc`, `import`, `jsdoc`, `vue`, `vitest`, at the `correctness` category. Two deliberate exceptions keep existing code passing:

- `jsdoc/check-tag-names` allows the TSDoc `@remarks` tag used in `src/module.ts`.
- `unicorn/no-empty-file` is off for `src/runtime/plugin.ts`, which is empty on purpose.

Do not widen the rule set to get a cleanup in — an added category is its own change.

## Conventions

- **Commits**: conventional commits in English, with a gitmoji after the type/scope. Scope is usually the file or area touched.
  ```
  feat(module): :sparkles: Add option to skip the Vite builder check
  fix(module.ts): :bug: Resolve config file lookup race
  docs(README): :memo: Document the checker option
  chore(release): v1.1.6
  ```
- **Code style**: oxfmt owns formatting — do not hand-format. Defaults apply except `singleQuote: true` and `sortPackageJson: false`; that means semicolons, 2-space indent, 100-column width and trailing commas. Markdown is excluded and stays hand-written. Run `pnpm format` rather than adjusting whitespace by hand.
- **Comments**: JSDoc on exported options and helpers. No inline narration of obvious code.
- **Scope**: change what the task requires. No opportunistic refactors, no reformatting passes.

## Releasing

`pnpm release` chains format:check → lint → test → prepack → `changelogen --release` → publish to npm and GitHub Packages → `git push --follow-tags`. It requires being logged in to both registries (`pnpm publish:check-auth`). Do not run it unless explicitly asked.

## Gotchas

- The default branch is `master`, but `.github/workflows/ci.yml` triggers on `main` — CI will not run on PRs targeting `master` until that is fixed.
- `findConfigFile` in `src/module.ts` resolves its promise from parallel `access()` callbacks; the `resolve(null)` at the end wins the race. Touching this function means fixing that logic, so verify the behaviour you expect with a test.
- `playground/package.json` depends on `nuxt-oxlint@latest` from the registry, while `test/fixtures/basic` imports `src/module` directly. Source changes show up in tests immediately, in the playground only after `pnpm dev:prepare`.
