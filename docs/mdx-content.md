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

## Type-checking

MDX checking is enabled through `mdx-content-mapper` in [tsconfig.json](../tsconfig.json), so run the
project's TypeScript check with:

```sh
pnpm typecheck
```

The current TypeScript dependency is pinned to `7.1.0-beta`, which satisfies
`mdx-content-mapper`'s requirement for TypeScript 7.1 or newer.
