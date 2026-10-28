# MDX content

Route content can be authored in `.mdx` files and imported as React components.
The Gigs page uses this for its shared introduction in
[the Gigs intro](../src/routes/gigs.{-$breakdown}/-intro.mdx).

## Markdown and frontmatter

GitHub Flavored Markdown syntax is enabled. YAML frontmatter between opening
`---` delimiters is exported as a `frontmatter` object rather than rendered as
page content. For an MDX file with frontmatter, import it alongside the
component:

```tsx
import Intro, { frontmatter } from "./intro.mdx";

const title = frontmatter.title;
```

The MDX compiler, Storybook, and TypeScript content mapper use the same
frontmatter plugins.

Fenced code blocks with a language tag (for example, `ts` or `tsx`) are
highlighted at compile time with `rehype-prism-plus` in both the app and
Storybook MDX. The existing Prism token styles follow the site's theme and
contrast settings; no browser-side highlighting script is needed. Untagged
blocks stay plain, and unsupported language tags fail compilation.
Syntax combines Goat's purple/indigo and Arctic's blue/rose standard accents,
plus Goat's error red. These are generated from the existing theme exports by
`vp run theme:generate`: keywords use Goat's primary, strings use Arctic's
tertiary, functions and types use Arctic's primary, numbers use Goat's tertiary,
and parameters use Goat's error. It adds no separate green/yellow/teal theme
colors.
Light-mode accents retain their source hue and chroma where the gamut allows,
with tones darkened only as needed for at least 6:1 contrast in medium and 7:1
in high mode against both palettes' code backgrounds. Standard accents and
dark-mode accents remain unchanged. Backgrounds, comments, and plain text
follow the active theme and contrast. See the
[theme guide](../src/shared/styles/theme/theme.doc.mdx#syntax-highlighting) for
the Prism token mappings.
The TypeScript content mapper does not run Prism: it supports only selected
transform plugins, and highlighting does not change the MDX types.

## Project entries

Projects live in `src/routes/projects/-content/`, grouped into `project/`,
`package/`, and `contribution/` subfolders. The folder determines their `kind`;
do not include it in frontmatter.
Each file becomes a card
at `/projects/` and a detail page at `/projects/<filename-without-extension>`.
Use lowercase, hyphen-separated filenames, unique across all subfolders.
Only the filename determines the public slug; the type folder is not part
of the URL.

[Content Collections](https://www.content-collections.dev/) discovers these files
and validates their metadata against the Valibot schema in
[content-collections.ts](../content-collections.ts). Its `frontmatter-only`
parser deliberately leaves the MDX body out of the generated collection.

```mdx
---
title: Example project
summary: A short overview for the project card and page metadata.
order: 10
logo:
  light: /projects/example.png
  dark: /projects/example-dark.png
links:
  - label: View source
    href: https://github.com/example/project
---

The longer description goes here.

## What I learned

Markdown, images, and MDX components can tell the rest of the story.
```

Place each entry directly in `project/`, `package/`, or `contribution/` to choose
its overview section: Projects, Packages, or Open-source contributions.
Unknown folders and deeper nesting fail content validation. Empty sections are
omitted. Entries within each section sort by ascending `order`, then title.
`links` can be empty. The initial
seven entries use lorem ipsum summaries and bodies as explicit placeholders. Each TypeScript
utility has its own entry rather than sharing a grouped detail page.

`logo` is optional. Store PNG logos in `public/projects/` and use their
`/projects/<filename>.png` URLs. `light` is required when a logo is supplied;
`dark` is optional and otherwise the same image is used in both themes.
Card logos are decorative beside the project title and follow the site's
selected theme, including its system setting. Entries without logos reserve
no image space.

The detail route loads the body with Vite's lazy MDX imports. Project cards
use the router's intent preloading, warming the selected detail page and MDX
body on hover or focus without eagerly importing every description. Module-level
`lazyRouteComponent` instances share each import between the loader and React,
and are invalidated by HMR. Their `preload()` method resolves the component
before navigation commits, avoiding an extra Suspense frame in the transition.
The title, overview description, and links each share unique View Transition
names between the card and detail page, with matching timing and reduced-motion
support. The full MDX body does not participate in this shared-element motion.
The overview does not duplicate the app
bar's Projects title.

The Vite plugin regenerates metadata during development and builds. Generated
files in `.content-collections/` are ignored by Git. To generate them without
starting Vite, run `vp run content:generate`; `vp run typecheck` also generates
them automatically for a fresh checkout.

## Type-checking

MDX checking is enabled through `mdx-content-mapper` in [tsconfig.json](../tsconfig.json), so run the
project's TypeScript check with:

```sh
pnpm typecheck
```

The current TypeScript dependency is pinned to `7.1.0-beta`, which satisfies
`mdx-content-mapper`'s requirement for TypeScript 7.1 or newer.
