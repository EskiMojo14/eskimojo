# Coding standards

Use these standards for application code, styles, tests, and project scripts.
Prefer the existing repository patterns and automated tooling over introducing
new conventions.

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
- Write code embedded in strings, such as CSS, HTML, or SQL in tests and
  fixtures, as a tagged template named for its language so editors can
  highlight it. When the code needs no processing, alias `String.raw`, for
  example `const css = String.raw;` then `` css`a { color: red; }` ``.

## Component state and logic

- Prefer `useLocalSlice` over coordinating multiple `useState` calls or writing
  a manual `useReducer` when component logic involves related state fields,
  multi-field updates, or several meaningful state transitions.
- Import `useLocalSlice` from `#/utils/use-local-slice`, not directly from the
  package. The project wrapper uses Mutative for immutable updates.
- Keep related state transitions together in named reducers that describe the
  interaction or intent. Keep reducers synchronous and free of side effects;
  perform network requests, DOM operations, and other effects outside them.
- Keep `useState` for simple, independent values such as a visibility toggle or
  selected tab. Do not introduce a slice solely because a component has more
  than one state value, or convert existing simple state without a clarity benefit.
- Keep state local to the component or its owning hook. Continue using TanStack
  Query for server state and the router for URL state rather than copying either
  into a local slice.

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

- The root `tsconfig.json` is a solution referencing separate application/Node,
  Browser/Storybook, E2E, and type-test projects under `config/`. Shared compiler
  options live in `config/tsconfig.base.json`; run `vp run typecheck` to check all
  projects. Keep browser and E2E setup imports within their own project so
  assertion augmentations do not leak across environments.
- The PostCSS ambient declaration imports build-tool types that transitively
  load Vitest Browser Mode augmentations. Keep it excluded from E2E and
  type-test projects. Compile-time checks in `test/browser/assertion-types.test-d.ts`
  and `test/e2e/assertion-types.test-d.ts` guard the assertion boundary through
  their environment's TypeScript project. The Vitest type-test project discovers
  only `src/**/*.test-d.ts` so it does not merge these environment-specific checks.
- Put tests and stories beside the file they cover:
  - `foo.node.test.ts` for Node-side tests (test React/DOM behavior in the browser);
  - `foo.browser.test.ts` or `foo.browser.test.tsx` for browser tests;
  - `foo.e2e.test.ts` for Node-side Playwright E2E tests;
  - `foo.test-d.ts` for complex TypeScript type behavior;
  - `foo.stories.tsx` for Storybook stories;
  - `foo.doc.mdx` for Storybook documentation. Plain `.mdx` files are application
    content and are not indexed by Storybook.
- Add focused tests for non-trivial logic and behavior. Use stories to document
  and exercise UI states; a story is not a substitute for a logic test.
- Cover meaningful edge cases and user-visible behavior without coupling tests
  to implementation details.
- Test observable behavior and outcomes. Unless explicitly requested, do not
  assert on computed styles or class names.
- Register test cleanup with `onTestFinished` immediately after acquiring the
  resource, or use `using` / `await using` when the resource supports disposal.
  Never leave cleanup after assertions where a failure could skip it.
- Run `vp test` for Node, E2E, Chromium browser, type, and Storybook tests. Select
  a project with `--project node`, `--project browser`, `--project types`, or
  `--project storybook`, or select E2E tests with `--project e2e`. Use
  `vp run coverage` for V8 text, HTML, and LCOV reports.
- Configure E2E Playwright launch and context options through the `e2e` project's
  `provide.e2e` in `vite.config.ts`; fixtures read them with `inject("e2e")`.
- E2E tests need a running server. They use the dev server (`vp run dev`, port 3000) by default; set `E2E_BASE_URL` to test another server, such as
  `vp run preview --port 4173` in CI.
- Browser, E2E, and Storybook tests run headless by default. Set `HEADLESS=false`
  to show the browser, e.g. `HEADLESS=false vp test run --project e2e`.
- Import test APIs from `vite-plus/test` and browser APIs from
  `vite-plus/test/browser`. Shared setup registers `mix-n-matchers` and
  `expect.ref` for polling React refs.
- In `.e2e.test.ts` files, import `expect`, `test`, and `it` from `#test/e2e`
  instead of `vite-plus/test` so Playwright fixtures and assertions are available.
- Use `page.renderWithProviders` in browser tests for isolated QueryClient and
  memory-router providers. Test helpers are available through `#test/`.
- Mock network requests with `network` from `virtual:msw` and handlers from
  `msw`. Setup enables mocking and resets handlers after each test.
- In E2E tests, use the per-test `network` fixture from `#test/e2e` with MSW
  handlers instead of `virtual:msw`. It intercepts browser requests, not app-server
  SSR requests or Node-side `fetch`. E2E contexts block service workers so they
  cannot bypass Playwright routing.

### E2E patterns

- E2E contexts record Playwright traces and retain them with full-page screenshots
  of open pages under `test-results/e2e/` when a test attempt fails. Passing
  attempts discard their traces. The fixture logs the artifact directory, and CI
  uploads failure artifacts for seven days. Open a trace with
  `vp exec playwright show-trace <path-to-trace.zip>`. These are debugging
  artifacts, not visual regression snapshots; they may contain page and network
  data, so do not commit them or use production credentials in tests.
- Use page object models (POMs) for application E2E tests rather than constructing
  locators directly in test bodies. Keep selectors, locator composition, and
  reusable interactions in the model; keep scenario-specific assertions in tests.
  Tests for the E2E helpers themselves may use raw pages and locators.
- Colocate models in `*.e2e.model.ts` files beside their route or component.
  Use the shared `PageObjectModel`, `ComponentObjectModel`, and `TabObjectModel`
  bases from `#test/e2e` as appropriate instead of duplicating their behavior.
- Import `createTest` and `expect` from `#test/e2e`, register models with
  `const test = createTest({ home: HomePage })`, and consume the resulting
  per-test model fixtures rather than constructing models in individual tests.
- Navigate through the model's `goto()` and use model methods for reusable
  interactions such as selecting tabs. Put shared scenario setup in
  `test.beforeEach`; use the `fontsLoaded` fixture when a test depends on fonts.
- Prefer role and accessible-name locators inside models, scoped to the relevant
  component or landmark. Expose meaningful names such as `socialLink(name)`
  rather than leaking selector strings into tests.
- Use the Playwright `expect` re-exported by `#test/e2e` for E2E assertions:
  `await expect(model.socialLink("GitHub")).toBeVisible()` and
  `await expect(page).toHaveTitle(/Home/)`. Vitest still owns the test runner and
  fixtures. Playwright's web assertions retry with a default five-second timeout;
  pass `{ timeout }` to individual matchers or use `expect.configure({ timeout })`
  for a configured instance. Vitest's `expect.poll` configuration does not apply.
  Use `toHaveText` for exact text and `toContainText` for partial text.
  Await assertions and interactions; avoid fixed sleeps or duplicate polling.
  Linting rejects `.soft`, `toHaveScreenshot`, `toMatchSnapshot`, and
  `toMatchAriaSnapshot` in E2E tests, models, and helpers because they depend on
  the Playwright Test runner. Do not enable soft assertions through
  `expect.configure({ soft: true })` either; Vitest cannot track their failures.

#### Tabbed pages

- The page owns the tablist and named tab models, while each tab owns its content
  locators and interactions.
- Expose a `tabs` locator for the relevant `tablist` on the parent page. Extend
  `TabObjectModel<ParentPage>` for each tab and provide its route `url` and
  accessible `tabName`. Construct child tabs with the same Playwright page and
  parent model, for example `artists = new ArtistsTab(this.page, this)`.
- Register the parent page with `createTest`, not each child tab independently.
  Tests should read as a flow through that page:
  `await music.goto(); await music.artists.select();`.
- Use the inherited `select()` rather than clicking tab links directly in tests.
  It verifies the destination URL, `aria-selected="true"` on the selected tab,
  and visibility of its associated panel. Keep content-specific assertions in
  the scenario after selection.
- Scope tab-specific content locators to `this.tabPanel` so similarly named
  controls in other panels cannot match. Keep controls shared across tabs on the
  parent page, and extract genuinely shared tab behavior into a page-specific
  tab base class rather than duplicating it in sibling tabs.
- Use `@lazy` getters for locators or grouped handles that depend on subclass
  fields or the parent model, such as a tab's accessible name. For different
  desktop and mobile presentations, expose named groups on the tab model instead
  of branching on selectors in tests.
- Test tab navigation through `select()` when the interaction is the behavior
  under test. Add separate direct-entry or reload scenarios when verifying that
  a tab's URL restores the correct selection and content; navigating directly to
  a URL is not a substitute for testing the tab interaction.

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
- Link exactly one route-level stylesheet per route (for example `index.css`
  next to the route file, or `$slug.css` for `$slug.tsx`). Pull route component
  styles into it with `@import` instead of linking each component stylesheet
  individually in the route's head.
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
  code, with Query's exhaustive-deps rule disabled.
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
