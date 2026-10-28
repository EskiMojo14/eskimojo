# Dependency patches

- [Material Color Utilities 0.4.0](@material__material-color-utilities@0.4.0.patch):
  Add missing `.js` extensions to relative imports in the 2025 color
  specification and color-scheme modules. Node.js ESM cannot resolve these
  extensionless imports, preventing the theme generator from loading the
  package. No upstream issue or pull request is recorded for this patch.
  Remove when the published package includes the extensions, after verifying
  `vp run theme:generate` and the theme generator tests without the patch.

- [MDX Content Mapper 0.0.2](mdx-content-mapper@0.0.2.patch):
  Guard image-resource metadata assignments while processing Markdown labels,
  destinations, and titles. Standard Markdown links emit these tokens without
  creating an image resource; the original unconditional `nonNull(resource)`
  assertions crash MDX type-checking. The guards preserve metadata collection
  for images while leaving ordinary links alone. No upstream issue or pull
  request is recorded for this patch. Remove when the published mapper handles
  these tokens without an image resource, after verifying `vp run typecheck`
  on MDX containing both links and images without the patch.

- [Storybook Vitest addon 10.6.4](@storybook__addon-vitest@10.6.4.patch):
  Decode URL-encoded paths before the test-registration guard compares them
  with Vitest's filesystem paths. Without this, stories under TanStack route
  directories containing braces register no tests. Backports the decoding
  change from [the upstream fix](https://github.com/storybookjs/storybook/commit/9334c097996c6c1cd1960d0fd1aebd5cf4ec112f).
  Unlike upstream, malformed encodings throw rather than silently returning an
  undecoded path. Remove when the installed addon includes the upstream fix,
  after verifying the gigs and music Storybook suites run their tests.
