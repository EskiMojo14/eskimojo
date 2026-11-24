import path from "node:path";
import { fileURLToPath } from "node:url";

import eslintPluginE18e from "@e18e/eslint-plugin";
import eslintPluginQuery from "@tanstack/eslint-plugin-query";
import eslintPluginRouter from "@tanstack/eslint-plugin-router";
import { defineConfig, lazyPlugins } from "vite-plus";
import { playwright } from "vite-plus/test/browser-playwright";

import { promiseAllKeyed } from "#/utils/index.ts";

import { cssConfig } from "./config/css.config.ts";
import fmtConfig from "./config/fmt.config.ts";

const dirname =
  typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

const clientImportSpecifiers = [/^sharp(?:\/|$)/, /^@material\/material-color-utilities(?:\/|$)/];
const mdxContentInclude = /\.mdx\?content$/;
const viteReactInclude = [/\.(js|jsx|ts|tsx|mdx)$/, mdxContentInclude];

// Allow type-aware linting to execute the content mapper configured in tsconfig.json.
process.env.TSRS_LINT_RUN_EXTERNAL_CODE ??= "1";

// Set HEADLESS=false to watch browser and Storybook tests run.
const headless = process.env.HEADLESS !== "false";

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const config = defineConfig({
  staged: {
    "*.{js,jsx,mjs,cjs,ts,tsx,mts,cts}": "vp check --fix",
    "*.css": ["vpr lint:css --fix", "vp fmt"],
    "*.pcss": "vpr lint:css --fix",
    "!(*.{js,jsx,mjs,cjs,ts,tsx,mts,cts,css,pcss})": "vp fmt --no-error-on-unmatched-pattern",
  },
  fmt: fmtConfig,
  lint: {
    plugins: ["eslint", "typescript", "unicorn", "oxc", "react", "jsx-a11y", "import"],
    jsPlugins: [
      { name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.ts" },
      { name: "landmines", specifier: "@interfere/landmines" },
      { name: "vite-plus", specifier: "vite-plus/oxlint-plugin" },
      { name: "e18e", specifier: "@e18e/eslint-plugin" },
      { name: "@tanstack/router", specifier: "@tanstack/eslint-plugin-router" },
      { name: "@tanstack/query", specifier: "@tanstack/eslint-plugin-query" },
      { name: "no-relative", specifier: "eslint-plugin-no-relative-import-paths" },
    ],
    rules: {
      "oxc/no-accumulating-spread": "error",
      "anti-slop/no-array-filter-map": "error",
      "anti-slop/no-reduce-accumulator-copy": "error",
      "anti-slop/no-chained-type-assertions": "error",
      "anti-slop/no-conditional-empty-object-spread": "error",
      "anti-slop/no-known-value-widening": "error",
      "anti-slop/no-module-mocking": "error",
      "anti-slop/no-object-parameters": "error",
      "anti-slop/no-reflect-apply": "error",
      "anti-slop/no-reflect-get": "error",
      // Keep runtime checks for actual values; replacing them with `in` is not equivalent.
      "anti-slop/no-runtime-typeof": "off",
      // The project uses "shape" as domain vocabulary, not a vague type name.
      "anti-slop/no-shape-in-symbol-names": "off",
      "anti-slop/no-unknown-parameters": "error",
      "anti-slop/no-unknown-returns": "error",
      "anti-slop/no-unknown-type-aliases": "error",
      "anti-slop/no-unsafe-dictionary-type": "error",
      "anti-slop/no-widen-then-assert": "error",
      "anti-slop/require-readable-spacing": "error",
      "anti-slop/require-safety-comment-for-type-assertion": "error",
      "landmines/no-fixed-sleep": "error",
      "landmines/no-unsignaled-poll": "error",
      "landmines/test-file-names": "error",
      ...eslintPluginE18e.configs.recommended.rules,
      "vite-plus/prefer-vite-plus-imports": "error",
      "import/first": "error",
      "import/no-unassigned-import": "off",
      "typescript/array-type": ["error", { default: "generic" }],
      "typescript/consistent-type-imports": "error",
      "typescript/no-deprecated": "error",
      "react/react-in-jsx-scope": "off",
      "react/rules-of-hooks": "error",
      "jsx-a11y/label-has-associated-control": [
        "warn",
        { controlComponents: ["Checkbox", "Radio", "Switch"] },
      ],
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
    ignorePatterns: [
      ".agent/**",
      ".agents/**",
      ".claude/**",
      ".codex/**",
      ".continue/**",
      ".cursor/**",
      ".gemini/**",
      ".opencode/**",
      ".pi/**",
      ".roo/**",
      ".windsurf/**",
      "**/*.gen.*",
      "tools/oxlint/anti-slop/**",
    ],
    settings: {
      vitest: { typecheck: true },
    },
    overrides: [
      {
        files: ["vite/symbols.ts", "vite/server-fn-registry.ts"],
        // These modules validate compiler-generated ASTs before reading version-sensitive fields.
        rules: {
          "anti-slop/no-unknown-parameters": "off",
          "anti-slop/no-unknown-returns": "off",
          "anti-slop/no-unsafe-dictionary-type": "off",
        },
      },
      {
        files: ["**/*.e2e.{test,model}.ts"],
        rules: {
          "no-restricted-imports": [
            "error",
            {
              paths: [
                {
                  name: "vite-plus/test",
                  importNames: ["expect", "test", "it"],
                  message: 'Import expect, test, and it from "#test/e2e" in E2E tests.',
                },
              ],
            },
          ],
        },
      },
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
        files: ["**/*.{browser,node,e2e}.test.{ts,tsx}", "**/*.stories.tsx"],
        // Keep performance micro-optimizations from obscuring test and story intent.
        rules: {
          "e18e/prefer-array-from-map": "off",
          "e18e/prefer-static-regex": "off",
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
        files: ["src/**/*.{browser,node,e2e}.test.{ts,tsx}", "src/**/*.stories.tsx"],
        rules: { "import/no-unassigned-import": "off" },
      },
    ],
  },
  resolve: {
    alias: {
      "#": fileURLToPath(new URL("./src", import.meta.url)),
      "#test": fileURLToPath(new URL("./test", import.meta.url)),
    },
    tsconfigPaths: true,
  },
  css: cssConfig,
  plugins: lazyPlugins(async () => {
    const {
      contentCollections: { default: contentCollections },
      mdx: { default: mdx },
      mdxContent: { mdxContentAttributes },
      netlify: { default: netlify },
      devtools: { devtools },
      tanstackStart: { tanstackStart },
      viteReact: { default: viteReact },
      msw: { msw },
      rehypePrism: { default: rehypePrism },
      prismTokens: { prismTokens },
      remarkFrontmatter: { default: remarkFrontmatter },
      remarkGfm: { default: remarkGfm },
      remarkMdxFrontmatter: { default: remarkMdxFrontmatter },
      materialSymbols: { default: materialSymbols },
      serverFnRegistry: { default: serverFnRegistry },
      svgr: { default: svgr },
    } = await promiseAllKeyed({
      contentCollections: import("@content-collections/vite"),
      mdx: import("@mdx-js/rollup"),
      mdxContent: import("./vite/mdx-content.ts"),
      netlify: import("@netlify/vite-plugin-tanstack-start"),
      devtools: import("@tanstack/devtools-vite"),
      tanstackStart: import("@tanstack/react-start/plugin/vite"),
      viteReact: import("@vitejs/plugin-react"),
      msw: import("msw/vite"),
      rehypePrism: import("rehype-prism-plus"),
      prismTokens: import("./vite/prism-tokens.ts"),
      remarkFrontmatter: import("remark-frontmatter"),
      remarkGfm: import("remark-gfm"),
      remarkMdxFrontmatter: import("remark-mdx-frontmatter"),
      materialSymbols: import("./vite/symbols.ts"),
      serverFnRegistry: import("./vite/server-fn-registry.ts"),
      svgr: import("vite-plugin-svgr"),
    });

    const applicationMdx = mdx({
      remarkPlugins: [remarkGfm, remarkFrontmatter, remarkMdxFrontmatter],
      rehypePlugins: [rehypePrism, prismTokens],
    });

    return [
      devtools(),
      mdxContentAttributes(),
      contentCollections({ configPath: "config/content-collections.ts" }),
      process.env.VITEST !== "true" && process.env.STORYBOOK !== "true" && netlify(),
      process.env.STORYBOOK !== "true" &&
        tanstackStart({
          importProtection: {
            behavior: "error",
            client: {
              specifiers: clientImportSpecifiers,
            },
          },
        }),
      process.env.VITEST !== "true" &&
        process.env.STORYBOOK !== "true" &&
        serverFnRegistry({ output: new URL("./test/e2e/server-fns.gen.ts", import.meta.url) }),
      {
        enforce: "pre",
        ...applicationMdx,
        transform: {
          // Storybook owns docs MDX; ?content selects the application's compiler.
          filter: process.env.STORYBOOK === "true" ? { id: mdxContentInclude } : undefined,
          handler: applicationMdx.transform,
        },
      },
      viteReact({ include: viteReactInclude }),
      svgr(),
      materialSymbols({
        knownSymbolsModule: path.join(dirname, "vite/known-symbols.ts"),
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
          retry: process.env.CI ? 2 : 0,
          include: ["**/*.browser.test.ts", "**/*.browser.test.tsx"],
          setupFiles: ["./test/common/setup.ts", "./test/browser/setup.ts"],
          browser: {
            enabled: true,
            headless,
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
            tsconfig: "./config/tsconfig.type-tests.json",
            include: ["src/**/*.test-d.ts"],
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
            headless,
            provider: playwright({ launchOptions: { channel: "chromium" } }),
            instances: [{ browser: "chromium" }],
          },
        },
      },
    ],
  },
});

export default config;
