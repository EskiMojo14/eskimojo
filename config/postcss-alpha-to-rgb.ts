import type { PluginCreator } from "postcss";
import valueParser from "postcss-value-parser";

const alphaFunction = /\balpha\(/i;

// alpha(from X / A) is equivalent to rgb(from X r g b / A) for sRGB colours,
// which is all the theme tokens use. Unlike @csstools/postcss-alpha-function,
// this also rewrites var() and currentColor origins.
const toRelativeRgb = (value: string) => {
  const parsed = valueParser(value);
  parsed.walk((node) => {
    if (node.type !== "function" || node.value.toLowerCase() !== "alpha") return;

    const fromIndex = node.nodes.findIndex((child) => child.type !== "space");
    const from = node.nodes[fromIndex];
    if (from?.type !== "word" || from.value.toLowerCase() !== "from") return;

    const originIndex = node.nodes.findIndex(
      (child, index) => index > fromIndex && child.type !== "space",
    );
    if (originIndex === -1) return;

    node.value = "rgb";
    node.nodes.splice(originIndex + 1, 0, {
      type: "word",
      value: " r g b",
      sourceIndex: 0,
      sourceEndIndex: 0,
    });
  });
  return valueParser.stringify(parsed.nodes);
};

/** Rewrites relative alpha() to the more widely supported rgb(from … r g b / A). */
export const postcssAlphaToRgb: PluginCreator<void> = () => ({
  postcssPlugin: "local-alpha-to-rgb",
  Declaration(decl) {
    if (alphaFunction.test(decl.value)) decl.value = toRelativeRgb(decl.value);
  },
});
postcssAlphaToRgb.postcss = true;
