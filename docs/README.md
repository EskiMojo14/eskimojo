# Website design documents

These documents capture the agreed direction for the replacement personal
website so it can be implemented without relying on chat history.

- [Website design brief](./website-design.md) — purpose, audience, visual
  direction, navigation, and accessibility expectations.
- [Content and behavior specification](./content-and-behavior.md) — page
  content, portfolio scope, Last.fm behavior, and the Gigs archive.
- [Launch and migration notes](./launch-and-migration.md) — hosting, domain
  status, and the relationship between the new site and the Neocities archive.

Items explicitly marked **Open** still need a decision or user-provided
content. These documents record the design; they do not indicate that the
features have been implemented.

## Implementation notes

- [Material Symbols](./material-symbols.md) — icon component usage, accessibility,
  font loading, and production symbol extraction.
- MDX content can be authored in `.mdx` files and imported as React components.
  The Gigs page uses this for its shared intro in
  [`src/routes/gigs/-intro.mdx`](../src/routes/gigs/-intro.mdx). GitHub Flavored
  Markdown syntax is enabled. Run `vp run typecheck:mdx` to type-check MDX with
  `mdx-content-mapper`; that package currently requires TypeScript 7.1 or newer.
  TypeScript `7.1.0-beta` is pinned in the project dependencies.
  YAML frontmatter between opening `---` delimiters is exported as a
  `frontmatter` object, not rendered as page content. Import it alongside the
  component: `import GigsIntro, { frontmatter } from "./-intro.mdx"`, then access
  metadata such as `frontmatter.title`. The compiler, Storybook, and content
  mapper use the same frontmatter plugins.
