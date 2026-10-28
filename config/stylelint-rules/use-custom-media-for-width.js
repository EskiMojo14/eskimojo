import valueParser from "postcss-value-parser";
import stylelint from "stylelint";

export const ruleName = "local/use-custom-media-for-width";

const isWidthFeature = (value) => /^(?:(?:min|max)-)?(?:device-)?width$/i.test(value);

/** @type {import("stylelint").Rule} */
export const rule = (primary) => (root, result) => {
  if (
    !stylelint.utils.validateOptions(result, ruleName, {
      actual: primary,
      possible: [true],
    })
  )
    return;

  root.walkAtRules("media", (atRule) => {
    let hasWidthFeature = false;
    valueParser(atRule.params).walk((node) => {
      if (node.type !== "function" || node.value !== "") return;

      const feature = node.nodes.find((child) => child.type === "word");
      if (feature && isWidthFeature(feature.value)) hasWidthFeature = true;
    });

    if (!hasWidthFeature) return;

    stylelint.utils.report({
      ruleName,
      result,
      node: atRule,
      message: "Use a named custom media query instead of a viewport width feature.",
    });
  });
};
