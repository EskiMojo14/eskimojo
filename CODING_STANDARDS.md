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

## Source organization

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
  - `foo.node.test.ts` or `foo.node.test.tsx` for Node-side tests;
  - `foo.browser.test.ts` or `foo.browser.test.tsx` for browser tests;
  - `foo.test-d.ts` for complex TypeScript type behavior;
  - `foo.stories.tsx` for Storybook stories.
- Add focused tests for non-trivial logic and behavior. Use stories to document
  and exercise UI states; a story is not a substitute for a logic test.
- Cover meaningful edge cases and user-visible behavior without coupling tests
  to implementation details.

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

- Use BEM-like class names: a component block such as `.music-list`, an element
  such as `.music-list__item`, and a modifier such as
  `.music-list--compact`.
- Use the design tokens defined in `src/shared/styles` for typography, color,
  shape, and motion. Avoid hard-coded font, color, and corner-radius values in
  component styles; Stylelint checks these declarations.
- Keep literal token definitions in the foundation styles that define them.
  Generated styles are excluded from linting and should be changed through
  their source or generator.
- Keep component styles close to their component. Reserve global styles for
  resets, design tokens, and genuinely site-wide behavior.

## Accessibility and behavior

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
- Run `vp check` and `vp test` for code changes. Run `vp run lint` to include
  both JavaScript/TypeScript and CSS linting; run `vp run build` when changes
  could affect production compilation or routing.
- Use `vp run <script>` for project scripts declared in `package.json`;
  `vp <command>` may invoke a Vite+ built-in instead.
