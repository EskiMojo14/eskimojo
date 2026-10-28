import { statSync } from "node:fs";
import { posix, resolve } from "node:path";

import { defineCollection, defineConfig } from "@content-collections/core";
import * as v from "valibot";

import { projectKindSchema } from "#/routes/projects/-schema.ts";

export const publicImageSchema = v.config(
  v.pipe(
    v.string(),
    v.regex(
      /^\/(?!\/)[^?#\\\0]+\.(png|svg|jpe?g|webp)$/i,
      "Expected a root-relative PNG, SVG, JPEG, or WebP image URL",
    ),
    v.check(
      (src) => !src.split("/").some((segment) => segment === "." || segment === ".."),
      "Image URLs must not contain dot path segments",
    ),
    v.check(
      (src) =>
        statSync(resolve("public", src.slice(1)), { throwIfNoEntry: false })?.isFile() ?? false,
      "Image must reference an existing file in public/",
    ),
  ),
  { abortPipeEarly: true },
);

const projects = defineCollection({
  name: "projects",
  directory: "../src/routes/projects/-content",
  include: "**/*.mdx",
  parser: "frontmatter-only",
  schema: v.object({
    title: v.pipe(v.string(), v.nonEmpty()),
    summary: v.pipe(v.string(), v.nonEmpty()),
    order: v.pipe(v.number(), v.integer(), v.minValue(0)),
    logo: v.optional(
      v.object({
        light: publicImageSchema,
        dark: v.optional(publicImageSchema),
        social: v.optional(publicImageSchema),
      }),
    ),
    links: v.array(
      v.object({
        label: v.pipe(v.string(), v.nonEmpty()),
        href: v.pipe(v.string(), v.url()),
      }),
    ),
  }),
  transform: ({ _meta: meta, ...document }) => ({
    ...document,
    kind: v.parse(projectKindSchema, posix.dirname(meta.path)),
    filePath: meta.filePath,
    slug: v.parse(
      v.pipe(v.string(), v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)),
      posix.basename(meta.path),
    ),
  }),
});

export default defineConfig({ content: [projects] });
