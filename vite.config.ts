import path from "node:path";
import { fileURLToPath } from "node:url";

import postcssGlobalData from "@csstools/postcss-global-data";
import eslintPluginQuery from "@tanstack/eslint-plugin-query";
import eslintPluginRouter from "@tanstack/eslint-plugin-router";
import { configs as eslintDependConfigs } from "eslint-plugin-depend";
import { Features } from "lightningcss";
import postcssCustomMedia from "postcss-custom-media";
import postcssExtendRule from "postcss-extend-rule";
import { defineConfig, lazyPlugins } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";

import { promiseAllKeyed } from "#/utils/index.ts";

import fmtConfig from "./config/fmt.config.ts";

const dirname =
  typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const config = defineConfig({
  staged: {
    "*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}": "vp check --fix",
    "*.css": ["vpr lint:css --fix", "vp fmt"],
    "!(*.{js,jsx,mjs,cjs,ts,tsx,mts,cts,css})": "vp fmt --no-error-on-unmatched-pattern",
  },
  fmt: fmtConfig,
  lint: {
    plugins: ["eslint", "typescript", "unicorn", "oxc", "react", "jsx-a11y", "import"],
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
      "import/first": "error",
      "import/no-unassigned-import": "off",
      "typescript/array-type": ["error", { default: "generic" }],
      "typescript/consistent-type-imports": "error",
      "typescript/no-deprecated": "error",
      "react/react-in-jsx-scope": "off",
      "react/rules-of-hooks": "error",
      "jsx-a11y/label-has-associated-control": "warn",
    },
    options: {
      typeAware: true,
      typeCheck: false,
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
          "import/no-unassigned-import": "error",
          "react/only-export-components": [
            "error",
            {
              allowConstantExport: true,
              allowExportNames: ["Route"],
              customHOCs: ["createLink", "createPrefProvider", "withTooltip"],
            },
          ],
          ...eslintPluginRouter.configs.recommended.rules,
          ...eslintPluginQuery.configs.recommended.rules,
          "@tanstack/query/exhaustive-deps": "off",
          "@tanstack/query/prefer-query-options": "error",
          "no-relative/no-relative-import-paths": [
            "error",
            { allowSameFolder: true, rootDir: "src", prefix: "#" },
          ],
        },
      },
      {
        files: ["src/**/*.{browser,node}.test.{ts,tsx}", "src/**/*.stories.tsx"],
        rules: { "import/no-unassigned-import": "off" },
      },
    ],
  },
  resolve: {
    alias: { "#": fileURLToPath(new URL("./src", import.meta.url)) },
    tsconfigPaths: true,
  },
  css: {
    postcss: {
      plugins: [
        postcssGlobalData({
          files: [path.join(dirname, "src/shared/styles/breakpoints.css")],
        }),
        postcssCustomMedia(),
        postcssExtendRule({ onUnusedExtend: "throw" }),
      ],
    },
    // Theme tokens rely on native light-dark() resolving where they're used, so that
    // nested [data-theme] sections work. The downlevelled fallback resolves at :root.
    lightningcss: { exclude: Features.LightDark },
  },
  plugins: lazyPlugins(async () => {
    const {
      contentCollections: { default: contentCollections },
      mdx: { default: mdx },
      netlify: { default: netlify },
      devtools: { devtools },
      tanstackStart: { tanstackStart },
      viteReact: { default: viteReact },
      msw: { msw },
      rehypePrism: { default: rehypePrism },
      remarkFrontmatter: { default: remarkFrontmatter },
      remarkGfm: { default: remarkGfm },
      remarkMdxFrontmatter: { default: remarkMdxFrontmatter },
      gigs: { gigBreakdownLabels },
      music: { musicBreakdownLabels },
      sidebar: { links },
      prefs: { themeLabels, contrastLabels, paletteLabels },
      materialSymbols: { default: materialSymbols },
    } = await promiseAllKeyed({
      contentCollections: import("@content-collections/vite"),
      mdx: import("@mdx-js/rollup"),
      netlify: import("@netlify/vite-plugin-tanstack-start"),
      devtools: import("@tanstack/devtools-vite"),
      tanstackStart: import("@tanstack/react-start/plugin/vite"),
      viteReact: import("@vitejs/plugin-react"),
      msw: import("msw/vite"),
      rehypePrism: import("rehype-prism-plus"),
      remarkFrontmatter: import("remark-frontmatter"),
      remarkGfm: import("remark-gfm"),
      remarkMdxFrontmatter: import("remark-mdx-frontmatter"),
      gigs: import("#/routes/gigs.{-$breakdown}/-constants"),
      music: import("#/routes/music.{-$breakdown}/-constants.ts"),
      sidebar: import("#/shared/components/sidebar/groups"),
      prefs: import("#/shared/constants/prefs"),
      materialSymbols: import("./vite/symbols.ts"),
    });
    return [
      devtools(),
      contentCollections(),
      process.env.VITEST !== "true" && process.env.STORYBOOK !== "true" && netlify(),
      process.env.STORYBOOK !== "true" && tanstackStart(),
      process.env.STORYBOOK !== "true" && {
        enforce: "pre",
        ...mdx({
          remarkPlugins: [remarkGfm, remarkFrontmatter, remarkMdxFrontmatter],
          rehypePlugins: [rehypePrism],
        }),
      },
      viteReact({ include: /\.(js|jsx|ts|tsx|mdx)$/ }),
      materialSymbols({
        knownSymbols: [
          ...[
            themeLabels,
            contrastLabels,
            paletteLabels,
            gigBreakdownLabels,
            musicBreakdownLabels,
          ].flatMap((labels) => Object.values(labels).map(({ icon }) => icon)),
          ...links.flatMap((group) => group.children.map(({ icon }) => icon)),
        ],
      }),
      msw(),
    ];
  }),
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
        plugins: lazyPlugins(async () => {
          const { storybookTest } = await import("@storybook/addon-vitest/vitest-plugin");
          return [
            // The plugin will run tests for the stories defined in your Storybook config
            // See options at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon#storybooktest
            storybookTest({
              configDir: path.join(dirname, ".storybook"),
            }),
          ];
        }),
        test: {
          name: "storybook",
          browser: {
            enabled: true,
            headless: true,
            provider: playwright({ launchOptions: { channel: "chromium" } }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});
export default config;
