import type { OxfmtConfig } from "vite-plus/fmt";

// Shared by vite.config.ts (for `vp fmt`) and scripts/write-formatted.ts, so generated files
// are formatted with the same options as everything else.
const config: OxfmtConfig = {
  // Generated files are formatted by the script that writes them.
  ignorePatterns: ["**/*.gen.*"],
};

export default config;
