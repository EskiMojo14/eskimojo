import type { StorybookConfig } from "@storybook/tanstack-react";
import remarkGfm from "remark-gfm";

import { symbolsUrl } from "../src/shared/lib/symbols.ts";

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  staticDirs: ["../src/public"],
  addons: [
    "@chromatic-com/storybook",
    "@storybook/addon-vitest",
    "@storybook/addon-a11y",
    {
      name: "@storybook/addon-docs",
      options: { mdxPluginOptions: { mdxCompileOptions: { remarkPlugins: [remarkGfm] } } },
    },
    "@storybook/addon-mcp",
  ],
  framework: "@storybook/tanstack-react",
  previewHead: (head) =>
    `${head}<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin="anonymous"><link rel="stylesheet" href="${symbolsUrl}" crossorigin="anonymous">`,
};
export default config;
