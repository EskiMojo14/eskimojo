import stylelint from "stylelint";
import type { Rule, RuleBase } from "stylelint";

export const ruleName = "local/bem-modifiers-before-elements";

const messages = {
  rejected: "Place BEM modifiers before elements in the same scope.",
};

const ruleFunction: RuleBase<boolean> = (primary) => (root, result) => {
  if (
    !stylelint.utils.validateOptions(result, ruleName, {
      actual: primary,
      possible: [true],
    })
  )
    return;

  root.walk((container) => {
    if ((container.type !== "rule" && container.type !== "atrule") || !container.nodes) return;

    let seenElement = false;

    for (const child of container.nodes) {
      if (child.type !== "rule") continue;

      let outOfOrder = false;

      for (const selector of child.selectors) {
        const trimmed = selector.trimStart();

        if (trimmed.startsWith("&__")) seenElement = true;

        if (seenElement && trimmed.startsWith("&--")) outOfOrder = true;
      }

      if (outOfOrder) {
        stylelint.utils.report({
          ruleName,
          result,
          node: child,
          message: messages.rejected,
        });
      }
    }
  });
};

export const rule: Rule<boolean> = Object.assign(ruleFunction, {
  ruleName,
  messages,
});
