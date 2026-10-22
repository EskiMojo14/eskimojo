import { defineConfig, lazyPlugins } from "vite-plus";
import { devtools } from "@tanstack/devtools-vite";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import netlify from "@netlify/vite-plugin-tanstack-start";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { storybookTest } from "@storybook/addon-vitest/vitest-plugin";
import { playwright } from "vite-plus/test/browser-playwright";
import postcssExtendRule from "postcss-extend-rule";
import { Features } from "lightningcss";
import fmtConfig from "./fmt.config.ts";
const dirname =
  typeof __dirname !== "undefined" ? __dirname : path.dirname(fileURLToPath(import.meta.url));

// More info at: https://storybook.js.org/docs/next/writing-tests/integrations/vitest-addon
const config = defineConfig({
  staged: {
    "*": "vp check --fix",
  },
  fmt: fmtConfig,
  lint: {
    jsPlugins: [{ name: "vite-plus", specifier: "vite-plus/oxlint-plugin" }],
    rules: { "vite-plus/prefer-vite-plus-imports": "error" },
    options: { typeAware: true, typeCheck: true },
    categories: {
      correctness: "error",
      suspicious: "warn",
    },
    ignorePatterns: ["**/*.gen.*"],
  },
  resolve: {
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
  plugins: lazyPlugins(() => [devtools(), netlify(), tanstackStart(), viteReact()]),
  test: {
    projects: [
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
