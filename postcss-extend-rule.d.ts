declare module "postcss-extend-rule" {
  import type { CSSOptions } from "vite-plus";

  type Handling = "remove" | "ignore" | "warn" | "throw";
  type PostCSSPlugin = NonNullable<Exclude<CSSOptions["postcss"], string>["plugins"]>[number];

  export default function postcssExtendRule(options?: {
    name?: string;
    onFunctionalSelector?: Handling;
    onRecursiveExtend?: Handling;
    onUnusedExtend?: Handling;
  }): PostCSSPlugin;
}
