# Anti-slop provenance

Source: [dmmulroy/anti-slop](https://github.com/dmmulroy/anti-slop), commit
`13909c9e07590f5a85d93c62712259fe14a883f7`, as recorded in `skills-lock.json`.
The copied assets came from that pinned skill bundle.

Installed plugin entry points:

- `index.ts` — generic anti-slop rules
- `effect/index.ts` — optional Effect rules (not registered; `effect` is not a
  direct project dependency)

The generic plugin is registered from `vite.config.ts`. The vendored source and
its nested ESLint Stylistic license/provenance were copied from the skill bundle
without behavioral rule changes. `shared/dictionary-types.ts` has a local
type-safety adjustment for this repository's `noUncheckedIndexedAccess` setting;
it explicitly narrows the indexed intersection member before returning it.
