import { defineCollection, defineConfig } from "@content-collections/core";
import * as v from "valibot";

const projects = defineCollection({
  name: "projects",
  directory: "src/routes/projects/-content",
  include: "*.mdx",
  parser: "frontmatter-only",
  schema: v.object({
    title: v.pipe(v.string(), v.nonEmpty()),
    summary: v.pipe(v.string(), v.nonEmpty()),
    order: v.pipe(v.number(), v.integer(), v.minValue(0)),
    links: v.array(
      v.object({
        label: v.pipe(v.string(), v.nonEmpty()),
        href: v.pipe(v.string(), v.url()),
      }),
    ),
  }),
  transform: ({ _meta: meta, ...document }) => ({
    ...document,
    filePath: meta.filePath,
    slug: v.parse(v.pipe(v.string(), v.regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)), meta.path),
  }),
});

export default defineConfig({ content: [projects] });
