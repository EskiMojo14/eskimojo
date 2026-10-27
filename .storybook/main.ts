import type { StorybookConfig } from "@storybook/tanstack-react";
import rehypePrism from "rehype-prism-plus";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";

import { symbolsUrl } from "../src/shared/lib/symbols.ts";

const config: StorybookConfig = {
  stories: ["../src/**/*.doc.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  staticDirs: ["../public"],
  addons: [
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    {
      name: "@storybook/addon-docs",
      options: {
        mdxPluginOptions: {
          mdxCompileOptions: {
            remarkPlugins: [remarkGfm, remarkFrontmatter, remarkMdxFrontmatter],
            rehypePlugins: [rehypePrism],
          },
        },
      },
    },
    "@storybook/addon-mcp",
    "msw-storybook-addon",
  ],
  features: {
    componentsManifest: true,
  },
  framework: "@storybook/tanstack-react",
  previewHead: (head) =>
    `${head}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"><link rel="stylesheet" href="${symbolsUrl}" crossorigin="anonymous">`,
};
export default config;
