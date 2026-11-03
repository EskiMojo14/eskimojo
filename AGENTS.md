<!--VITE PLUS START-->

# Using Vite+, the Unified Toolchain for the Web

This project is using Vite+, a unified toolchain built on top of Vite, Rolldown, Vitest, tsdown, Oxlint, Oxfmt, and Vite Task. Vite+ wraps runtime management, package management, and frontend tooling in a single global CLI called `vp`. Vite+ is distinct from Vite, and it invokes Vite through `vp dev` and `vp build`. Run `vp help` to print a list of commands and `vp <command> --help` for information about a specific command.

Docs are local at `node_modules/vite-plus/docs` or online at https://viteplus.dev/guide/.

## Built-in Commands vs Scripts

`vp <name>` runs a built-in command. `vp run <name>` runs a `package.json` script or a `vite.config.ts` task. Scripts cannot overwrite built-ins, so `vp dev` and `vp run dev` may do different things. Check `package.json` and `vite.config.ts` first, and run `vp run <name>` when the project defines a script or task with that name.

## Running Scripts

Run TypeScript and JavaScript files with `vpx <file>`, for example `vpx ./scripts/seed.ts --dry-run`. It handles enums, decorators, JSX, and tsconfig `paths`, so do not add `tsx` or `ts-node` to run scripts. `vpx --watch <file>` reruns the file when a file it uses changes, in place of `tsx watch`. `vp node <file>` runs plain Node.js.

## Tool Versions

Run `vp toolchain` to show versions and relationships in the active Vite+
release. Add a tool name to select part of the graph. For example, run
`vp toolchain vite`. Use `--global` to ignore the local `vite-plus` package. Use
`vp why <package>` to show the package-manager dependency graph.

## Review Checklist

- [ ] Run `vp install` after pulling remote changes and before getting started.
- [ ] Run `vp check` and `vp test` to format, lint, type check and test changes.
- [ ] Check if there are `vite.config.ts` tasks or `package.json` scripts necessary for validation, run via `vp run <script>`.
- [ ] If setup, runtime, or package-manager behavior looks wrong, run `vp env doctor` and include its output when asking for help.

<!--VITE PLUS END-->

## Coding standards

Before writing or reviewing code, read [CODING_STANDARDS.md](./CODING_STANDARDS.md) and apply every rule that touches the change.

## Continuous integration

Pre-commit runs non-overlapping staged tasks concurrently: JS/TS checks,
CSS lint followed by formatting, and formatting for other files. The full
type check runs for staged `.ts`, `.tsx`, and `.mdx` files (including deletions),
or changes to `tsconfig.json`, `package.json`, `pnpm-lock.yaml`, or
`pnpm-workspace.yaml`. Keep build/test-only imports inside
`lazyPlugins` callbacks so formatting and linting do not load them.

[CI](.github/workflows/ci.yml) runs on pull requests, pushes to `main`, and
manual dispatches. It uses [.node-version](.node-version) for Node.js, the
workspace catalog for Vite+, and `devEngines.packageManager` in
[package.json](package.json) for pnpm, with a frozen lockfile install.
`setup-vp` caches package-manager dependencies. Chromium downloads are cached
by runner OS, architecture, and lockfile, and saved before tests so a test
failure does not discard the cache. Linux browser system dependencies are
installed on every run because they are not part of the browser cache.
E2E tests run against the production build: CI starts `vp run preview` on port
4173 as a `background` step, waits for it to respond, points the tests at it
with `E2E_BASE_URL`, and stops it with a `cancel` step.

To reproduce its checks locally, run `vp run check`, `vp run build`,
`vp run preview --port 4173`, and, in another terminal,
`E2E_BASE_URL=http://localhost:4173 vp test run`. Without `E2E_BASE_URL`, E2E
tests use the dev server on port 3000. Install the test browser first with
`vp exec playwright install --with-deps chromium` on a fresh machine.
When changing workflows, validate them with Actionlint and Zizmor. Actionlint
1.7.12 does not yet recognise the `background`, `wait`, `wait-all`, `cancel`, or
`parallel` step keys ([rhysd/actionlint#693](https://github.com/rhysd/actionlint/issues/693)),
so ignore its syntax errors for those keys.

Vitest excludes the Netlify plugin so its Vite servers do not start platform
emulation or race to install Deno. Keep Netlify enabled for normal dev and
production builds.

## Storybook MCP

For UI work, use the `storybook` MCP server when it is available and Storybook is running. Use its docs tools to discover documented components and their APIs before creating or changing UI, and its development and testing tools to preview and validate story changes.

## Writing tests

Permanent tests should assert on observable behaviour and outcomes, not implementation details. Unless specifically stated, avoid asserting on computed styles or class names. This restriction does not apply to "probe" tests, which are written temporarily to verify some work and deleted once the verification is complete.
