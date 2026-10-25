# Coding standards

Use these standards for application code, styles, tests, and project scripts.
Prefer the existing repository patterns and automated tooling over introducing
new conventions. These standards also draw on the
[schema-benchmarks](https://github.com/open-circle/schema-benchmarks)
contributor guidance.

## TypeScript and React

- Keep TypeScript strict and resolve type errors rather than suppressing them.
  Avoid `any` and type assertions when a more precise type or guard will work.
- Use `.tsx` for React components and `.ts` for modules without JSX.
- Name React components and component types in `PascalCase`; use `camelCase` for
  functions, variables, and hooks. Prefix hooks with `use`.
- Use named exports for reusable components and utilities. Keep the TanStack
  Router-required `Route` export in route files.
- Prefer explicit, narrow props and data types. Use `import type` for
  type-only imports.
- Use the `#/` alias for imports from `src/`; keep relative imports for files
  colocated in the same local module.
- Linting rejects parent-relative imports within `src/`, while allowing `./`
  imports. Use `#/` instead of paths such as `../../shared/lib/query`.
- Preserve existing public interfaces and user-visible behavior unless the
  change explicitly requires otherwise.

## TanStack Query options

- Define query and mutation options in named options-creator functions using
  `queryOptions` and `mutationOptions` from `@tanstack/react-query`.
- Pass the creator's result to hooks and QueryClient APIs, for example
  `useQuery(getFoo(arg))` or `useMutation(updateFoo(arg))`. Never construct
  query or mutation options ad hoc at the call site.
- Spreading a creator's result to override or add options is allowed, for
  example `useQuery({ ...getFoo(arg), enabled: true })`.

## Source organization

- Keep relocatable tool configuration and its tests in `config/`, and ambient
  type declarations in `types/`. Keep `vite.config.ts`, `tsconfig.json`,
  `tsr.config.json`, and `netlify.toml` at the root for tool and editor discovery.
  The CSS lint script selects `config/stylelint.config.js` with `--config`;
  VS Code uses the same file through `stylelint.configFile`.
- Keep route definitions in `src/routes`, following TanStack Router's
  file-based routing conventions.
- Put route-specific components, hooks, data, styles, tests, and stories in
  pathless route directories and files alongside the route they support.
- Put code in `src/shared` only when it is genuinely shared across routes.
  Keep shared utilities in `src/shared/lib` and global design styles in
  `src/shared/styles`.
- Keep changes in the route or module that owns the behavior. Follow nearby
  implementations before introducing a new abstraction.
- Do not edit generated files such as `*.gen.*` or `src/routeTree.gen.ts`
  directly. Update their source or generator instead.

## Tests and stories

- Put tests and stories beside the file they cover:
  - `foo.node.test.ts` for Node-side tests (test React/DOM behavior in the browser);
  - `foo.browser.test.ts` or `foo.browser.test.tsx` for browser tests;
  - `foo.test-d.ts` for complex TypeScript type behavior;
  - `foo.stories.tsx` for Storybook stories.
- Add focused tests for non-trivial logic and behavior. Use stories to document
  and exercise UI states; a story is not a substitute for a logic test.
- Cover meaningful edge cases and user-visible behavior without coupling tests
  to implementation details.
- Test observable behavior and outcomes. Unless explicitly requested, do not
  assert on computed styles or class names.
- Register test cleanup with `onTestFinished` immediately after acquiring the
  resource, or use `using` / `await using` when the resource supports disposal.
  Never leave cleanup after assertions where a failure could skip it.
- Run `vp test` for Node, Chromium browser, type, and Storybook tests. Select
  a project with `--project node`, `--project browser`, `--project types`, or
  `--project storybook`. Use `vp run coverage` for V8 text, HTML, and LCOV reports.
- Import test APIs from `vite-plus/test` and browser APIs from
  `vite-plus/test/browser`. Shared setup registers `mix-n-matchers` and
  `expect.ref` for polling React refs.
- Use `page.renderWithProviders` in browser tests for isolated QueryClient and
  memory-router providers. Test helpers are available through `#test/`.
- Mock network requests with `network` from `virtual:msw` and handlers from
  `msw`. Setup enables mocking and resets handlers after each test.

## Errors and external data

- Validate external or user-provided data at the boundary before relying on
  its shape.
- Make failures explicit. Do not silently swallow errors or return fallback
  values that make a failed operation look successful.
- When an operation produces multiple independent errors, preserve them in an
  `AggregateError` instead of reporting only the first.
- Regenerate generated files and derived data with their owning scripts. Avoid
  hand-editing generated output or committing incidental generated data unless
  the change or existing workflow requires it.

## CSS and design tokens

- Use `#/` for CSS `@import` paths into `src/` that would otherwise traverse a
  parent directory. For asset `url(...)` references, use root-absolute paths
  instead of parent-relative paths: Vite treats leading `#` URLs as fragments,
  not aliases. Stylelint rejects parent-relative paths in both. Same-folder `./`
  paths, package imports, public-root paths, and external URLs remain allowed.
- Load stylesheets through `<link rel="stylesheet">` URLs in the document head,
  or through CSS `@import` chains rooted in a head-linked stylesheet. In
  JavaScript/TypeScript, import CSS only as a URL (for example,
  `import stylesUrl from "./index.css?url"`) and register it in the route's
  head links. Never use side-effect CSS imports such as `import "./index.css"`;
  they cause a flash of unstyled content (FOUC) with TanStack SSR. Direct CSS
  imports are allowed in browser tests and Storybook (including story and
  preview styles), where SSR FOUC is not a concern.
- Use BEM-like class names: a component block such as `.music-list`, an element
  such as `.music-list__item`, and a modifier such as
  `.music-list--compact`.
- Use native CSS nesting for related states, descendants, pseudo-elements, and
  conditional rules where it improves readability. Preserve selector specificity
  and cascade order. Keep independent BEM classes standalone; native nesting does
  not support Sass-style class-name concatenation such as `&__item`.
  Leave token rules containing `@extend` flat and keep their media blocks separate;
  `postcss-extend-rule` cannot resolve multiple extends inside a shared wrapper.
- Use the design tokens defined in `src/shared/styles` for typography, color,
  shape, and motion. Avoid hard-coded font, color, and corner-radius values in
  component styles; Stylelint checks these declarations.
- Always use spring tokens and their matching duration tokens for motion unless
  a non-spring easing is unavoidable; document the reason for any exception.
  Use spatial springs for movement/size and non-overshooting effects springs
  for color/opacity. Discrete display/overlay transitions should share the
  visible animation's spring duration.
- Keep literal token definitions in the foundation styles that define them.
  Generated styles are excluded from linting and should be changed through
  their source or generator.
- Keep component styles close to their component. Reserve global styles for
  resets, design tokens, and genuinely site-wide behavior.

## Accessibility and behavior

- Target current evergreen Chrome/Edge, Firefox, and Safari. Require native
  Popover and CSS anchor positioning; do not add legacy-browser polyfills for
  these APIs. A modern API not yet implemented across those browsers may use
  a feature-detected fallback, such as `interestfor` for tooltip interactions.

- Use semantic HTML and provide accessible names for interactive controls.
- Ensure interactive controls work with a keyboard and expose their state to
  assistive technology.
- Do not rely on color or motion alone to communicate meaning. Respect reduced
  motion and provide accessible text alternatives for visualizations.
- Keep theme and contrast choices legible and consistent with the site's
  system-preference and manual-selection behavior.

## Formatting, linting, and validation

- Use the repository's Oxfmt configuration through Vite+; imports are sorted
  automatically. Do not introduce a separate formatter configuration.
- Resolve TypeScript and lint diagnostics rather than disabling checks without
  a specific justification. Keep any necessary lint-disable directive narrow
  and ensure it is still needed.
- Use the TanStack Router and Query recommended lint rules for application
  code, with Query's exhaustive-deps rule disabled to match schema-benchmarks.
  The dependency plugin also checks for packages with native or simpler
  alternatives.
- Run `vpr check` and `vp test` for code changes. `vpr check` runs formatting,
  type-aware linting, Stylelint, and the separate TypeScript compiler check; use
  `vpr check:fix` to apply formatting and lint fixes before type checking.
  Run `vp run lint` for just JavaScript/TypeScript and CSS linting; run `vp run build` when changes
  could affect production compilation or routing.
- Use `vp run <script>` for project scripts declared in `package.json`;
  `vp <command>` may invoke a Vite+ built-in instead.
- The pre-commit hook formats and lints staged filenames, running Stylelint
  after formatting to avoid concurrent edits to CSS files. It then runs
  `vpr typecheck` once for the project, without filenames, so TypeScript loads
  `tsconfig.json`.
