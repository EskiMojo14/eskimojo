import type { OxfmtConfig } from "vite-plus/fmt";

// Shared by vite.config.ts (for `vp fmt`) and scripts/write-formatted.ts, so generated files
// are formatted with the same options as everything else.
const config: OxfmtConfig = {
  // Generated files are formatted by the script that writes them.
  // PostCSS templates contain keyframe calculations Oxfmt cannot parse.
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
    "**/skills/**",
    "**/*.pcss",
    "public/mockServiceWorker.js",
    "tools/oxlint/anti-slop/**",
  ],
  sortImports: true,
};

export default config;
