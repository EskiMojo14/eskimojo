# Material Symbols

The icon-font approach is adapted from
[Schema Benchmarks](https://github.com/open-circle/schema-benchmarks).
The component is in [symbol/index.tsx](../src/shared/components/symbol/index.tsx)
and the build plugin is in [vite/symbols.ts](../vite/symbols.ts).

## Usage

Import `MdSymbol` from `#/shared/components/symbol`:

```tsx
import { MdSymbol } from "#/shared/components/symbol";

<MdSymbol>search</MdSymbol>
<MdSymbol fill size={32} aria-label="Favourite">favorite</MdSymbol>
```

Icons are decorative by default. Label an informative icon with `aria-label` or
`aria-labelledby`; it will be exposed as an image to assistive technology. Label
an icon-only button on the button itself.

Use `fill`, `weight`, `grade`, `opticalSize`, `size`, and `flipRtl` props, or the
corresponding `--icon-fill`, `--icon-weight`, `--icon-grade`,
`--icon-optical-size`, and `--icon-size` CSS variables. CSS sizes are unitless
pixel values. Explicit `style` values override convenience props. Set `flipRtl`
only for directional symbols that should mirror in an RTL context.

The default grade follows the nearest light/dark theme, or the system preference
when there is no explicit theme. Variation transitions respect reduced motion.
Examples are available in Storybook under **Components/MdSymbol**.
The global **Direction** toolbar sets the preview's text direction to LTR or RTL.
The **RightToLeft** story defaults to RTL through that global.

## Brand SVGs

Use SVG React components for brand marks rather than wrapping them in
`MdSymbol`, which accepts Material Symbols ligature names. The Vite configuration
loads `vite-plugin-svgr`; import a source SVG with the `?react` suffix:

```tsx
import GitHubIcon from "./icons/github.svg?react";

<GitHubIcon aria-hidden="true" />;
```

Keep route-specific icons alongside their consuming component, as with the
homepage's [social icons](../src/routes/_home/-components/social-link/icons).
Size them and set `fill: currentColor` in the component's stylesheet. Decorative
brand marks should not repeat the containing link's accessible name.

## Font loading and production subsets

The app and Storybook load Material Symbols Sharp from Google Fonts, so rendering
requires access to `fonts.googleapis.com` and `fonts.gstatic.com`. Development
loads the full font.

Production builds extract literal `<MdSymbol>` children, including both branches
of ternaries such as `<MdSymbol>{paused ? "play_arrow" : "pause"}</MdSymbol>`,
and request only those symbols, deduplicated and alphabetically sorted.
Nested ternaries are supported too. The plugin updates JavaScript
chunks for TanStack Start and the preview HTML for Storybook.

For dynamic children such as `<MdSymbol>{icon}</MdSymbol>`, register every
possible name in [vite/known-symbols.ts](../vite/known-symbols.ts), usually by
importing a constants file and mapping over its icons. The plugin loads that
module at build time with Vite's `runnerImport`, rather than having
[vite.config.ts](../vite.config.ts) import it, because Vite restarts the dev
server whenever a file the config imports changes. The plugin warns when it
encounters unresolved children or ternary branches, with a source location for
each use; it collects literal branches
without evaluating the condition or resolving variables. Keep the
component's imported name as `MdSymbol` so the extractor can recognize it.
Registered names are trimmed before deduplication; blank registrations fail the build.

If no symbols are found or registered, the font URL is left unchanged.
