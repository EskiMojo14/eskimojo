import { fileURLToPath } from "node:url";

import postcssGlobalData from "@csstools/postcss-global-data";
import { Features } from "lightningcss";
import postcssAdvancedVariables from "postcss-advanced-variables";
import postcssCalc from "postcss-calc";
import postcssCustomMedia from "postcss-custom-media";
import postcssExtendRule from "postcss-extend-rule";
import type { CSSOptions } from "vite-plus";

export const cssConfig = {
  postcss: {
    plugins: [
      postcssAdvancedVariables(),
      postcssCalc({ selectors: true, precision: false }),
      postcssGlobalData({
        files: [fileURLToPath(new URL("../src/shared/styles/breakpoints.css", import.meta.url))],
      }),
      postcssCustomMedia(),
      postcssExtendRule({ onUnusedExtend: "throw" }),
    ],
  },
  // Resolve light-dark() where tokens are used, not at :root.
  lightningcss: { exclude: Features.LightDark },
} satisfies CSSOptions;
