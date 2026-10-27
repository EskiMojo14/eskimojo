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

## Project entries

Projects live in `src/routes/projects/-content/*.mdx`. Each file becomes a card
at `/projects/` and a detail page at `/projects/<filename-without-extension>`.
Use lowercase, hyphen-separated filenames.

[Content Collections](https://www.content-collections.dev/) discovers these files
and validates their metadata against the Valibot schema in
[content-collections.ts](../content-collections.ts). Its `frontmatter-only`
parser deliberately leaves the MDX body out of the generated collection.

```mdx
---
title: Example project
summary: A short overview for the project card and page metadata.
order: 10
links:
  - label: View source
    href: https://github.com/example/project
---

The longer description goes here.

## What I learned

Markdown, images, and MDX components can tell the rest of the story.
```

Entries sort by ascending `order`, then title. `links` can be empty. The initial
four entries contain draft descriptions, not final launch copy.

The detail route loads the body with Vite's lazy MDX imports. Project cards
use the router's intent preloading, warming the selected detail page and MDX
body on hover or focus without eagerly importing every description. Module-level
`lazyRouteComponent` instances share each import between the loader and React,
and are invalidated by HMR. Their `preload()` method resolves the component
before navigation commits, avoiding an extra Suspense frame in the transition.
The title shares a unique View Transition name between the card and detail
page, with reduced-motion support. The overview does not duplicate the app
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
