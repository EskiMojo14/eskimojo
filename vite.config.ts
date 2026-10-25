import path from "node:path";
import { fileURLToPath } from "node:url";

import mdx from "@mdx-js/rollup";
import netlify from "@netlify/vite-plugin-tanstack-start";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { devtools } from "@tanstack/devtools-vite";
import eslintPluginQuery from "@tanstack/eslint-plugin-query";
import eslintPluginRouter from "@tanstack/eslint-plugin-router";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { configs as eslintDependConfigs } from "eslint-plugin-depend";
import { Features } from "lightningcss";
import { msw } from "msw/vite";
import postcssExtendRule from "postcss-extend-rule";
import remarkFrontmatter from "remark-frontmatter";
import remarkGfm from "remark-gfm";
import remarkMdxFrontmatter from "remark-mdx-frontmatter";
import { defineConfig, lazyPlugins } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";

import { gigBreakdownLabels } from "#/routes/gigs.{-$breakdown}/-constants";
import { links } from "#/shared/components/sidebar/groups";
import { themeLabels, contrastLabels, paletteLabels } from "#/shared/constants/prefs";

import fmtConfig from "./config/fmt.config.ts";
import materialSymbols from "./vite/symbols.ts";

const dirname =
  typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const config = defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: fmtConfig,
  lint: {
    plugins: ["eslint", "typescript", "unicorn", "oxc", "react", "jsx-a11y"],
    jsPlugins: [
      { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
      { name: "depend", specifier: "eslint-plugin-depend" },
      { name: "@tanstack/router", specifier: "@tanstack/eslint-plugin-router" },
      { name: "@tanstack/query", specifier: "@tanstack/eslint-plugin-query" },
      { name: "no-relative", specifier: "eslint-plugin-no-relative-import-paths" },
    ],
    rules: {
      ...eslintDependConfigs["flat/recommended"].rules,
      "vite-plus/prefer-vite-plus-imports": "error",
      "typescript/array-type": ["error", { default: "generic" }],
      "typescript/consistent-type-imports": "error",
      "typescript/no-deprecated": "error",
      "react/react-in-jsx-scope": "off",
      "react/rules-of-hooks": "error",
      "jsx-a11y/label-has-associated-control": "warn",
    },
    options: {
      typeAware: true,
      typeCheck: true,
      reportUnusedDisableDirectives: "error",
    },
    categories: {
      correctness: "error",
      suspicious: "warn",
    },
    ignorePatterns: ["**/*.gen.*"],
    settings: {
      vitest: { typecheck: true },
    },
    overrides: [
      {
        files: ["**/*.{browser,node}.test.{ts,tsx}"],
        plugins: ["vitest"],
        rules: {
          "vitest/no-standalone-expect": [
            "error",
            { additionalTestBlockFunctions: ["it", "test"] },
          ],
          "vitest/no-focused-tests": "error",
          "vitest/no-disabled-tests": "warn",
        },
      },
      {
        files: ["src/**/*.{ts,tsx}"],
        rules: {
          ...eslintPluginRouter.configs.recommended.rules,
          ...eslintPluginQuery.configs.recommended.rules,
          "@tanstack/query/exhaustive-deps": "off",
          "no-relative/no-relative-import-paths": [
            "error",
            { allowSameFolder: true, rootDir: "src", prefix: "#" },
          ],
        },
      },
    ],
  },
  resolve: {
    alias: { "#": fileURLToPath(new URL("./src", import.meta.url)) },
    tsconfigPaths: true,
  },
  css: {
    postcss: {
      plugins: [postcssExtendRule({ onUnusedExtend: "throw" })],
    },
    // Theme tokens rely on native light-dark() resolving where they're used, so that
    // nested [data-theme] sections work. The downlevelled fallback resolves at :root.
    lightningcss: { exclude: Features.LightDark },
  },
  plugins: lazyPlugins(() => [
    devtools(),
    netlify(),
    tanstackStart(),
    process.env.STORYBOOK !== "true" && {
      enforce: "pre",
      ...mdx({ remarkPlugins: [remarkGfm, remarkFrontmatter, remarkMdxFrontmatter] }),
    },
    viteReact({ include: /\.(js|jsx|ts|tsx|mdx)$/ }),
    materialSymbols({
      knownSymbols: [
        ...[themeLabels, contrastLabels, paletteLabels, gigBreakdownLabels].flatMap((labels) =>
          Object.values(labels).map(({ icon }) => icon),
        ),
        ...links.flatMap((group) => group.children.map(({ icon }) => icon)),
      ],
    }),
    msw(),
  ]),
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.ts", "src/**/*.tsx"],
      exclude: ["**/*.test.{ts,tsx}", "**/*.test-d.ts", "**/*.stories.tsx", "**/*.gen.*"],
    },
    projects: [
      {
        test: {
          name: "node",
          environment: "node",
          include: ["**/*.node.test.ts"],
          setupFiles: ["./test/common/setup.ts", "./test/node/setup.ts"],
        },
      },
      {
        test: {
          name: "browser",
          retry: 3,
          include: ["**/*.browser.test.ts", "**/*.browser.test.tsx"],
          setupFiles: ["./test/common/setup.ts", "./test/browser/setup.ts"],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({
              launchOptions: { channel: "chromium" },
              contextOptions: { permissions: ["clipboard-read", "clipboard-write"] },
            }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
      {
        test: {
          name: "types",
          typecheck: {
            enabled: true,
            only: true,
            include: ["**/*.test-d.ts"],
          },
        },
      },
      {
        extends: true,
        plugins: [
          // The plugin will run tests for the stories defined in your Storybook config
          // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
          storybookTest({
            configDir: path.join(dirname, ".storybook"),
          }),
        ],
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            instances: [{ browser: "chromium", launchOptions: { channel: "chromium" } }],
          },
        },
      },
    ],
  },
});
export default config;
