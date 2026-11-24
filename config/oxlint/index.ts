import { definePlugin } from "vite-plus/lint/plugins";

import { noInlineCopy } from "./no-inline-copy.ts";

export default definePlugin({
  meta: { name: "eskimojo" },
  rules: { "no-inline-copy": noInlineCopy },
});
