# Anti-slop provenance

Source: [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop), commit
`13909c9e07590f5a85d93c62712259fe14a883f7`, as recorded in `skills-lock.json`.
The copied assets came from that pinned skill bundle.

Installed plugin entry points:

- `index.ts` — generic anti-slop rules
- `effect/index.ts` — optional Effect rules (not registered; `effect` is not a
  direct project dependency)

The generic plugin is registered from `vite.config.ts`. The vendored source and its nested ESLint Stylistic license/provenance were
copied from the skill bundle. Local deviations are:

- `shared/dictionary-types.ts` narrows the indexed intersection member for the
  repository's `noUncheckedIndexedAccess` setting.
- `rules/no-unknown-parameters.ts` allows explicitly named error values, which
  remain `unknown` at rejection boundaries.
- `vite.config.ts` disables the shape-name and runtime-`typeof` heuristics by
  project choice, and exempts compiler-AST parsers from rules that conflict
  with their version-tolerant input contracts.
