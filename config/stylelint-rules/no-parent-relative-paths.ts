import valueParser from "postcss-value-parser";
import stylelint from "stylelint";
import type { Rule, RuleBase } from "stylelint";

export const ruleName = "local/no-parent-relative-paths";

const absoluteUrlPattern = /^(?:[a-z][a-z\d+.-]*:|\/\/)/i;
const quotedStringPattern = /^(["'])(.*)\1$/;

const messages = {
  rejected: (path: string) =>
    `Use a #/ import or a root-absolute URL instead of parent-relative path "${path}".`,
};

const ruleFunction: RuleBase<boolean> = (primary) => (root, result) => {
  if (
    !stylelint.utils.validateOptions(result, ruleName, {
      actual: primary,
      possible: [true],
    })
  )
    return;

  root.walk((node) => {
    let value: string;
    let isImport = false;

    if (node.type === "decl") {
      value = node.value;
    } else if (node.type === "atrule" && node.name.toLowerCase() === "import") {
      value = node.params;
      isImport = true;
    } else return;

    const parsed = valueParser(value);

    const importPath = isImport
      ? parsed.nodes.find((part) => part.type !== "space" && part.type !== "comment")
      : undefined;

    const reportIfRelative = (path: string) => {
      if (absoluteUrlPattern.test(path) || !path.split("/").includes("..")) return;

      stylelint.utils.report({
        ruleName,
        result,
        node,
        message: messages.rejected(path),
      });
    };

    parsed.walk((part) => {
      if (part.type === "function" && part.value.toLowerCase() === "url") {
        const path = valueParser.stringify(part.nodes).trim().replace(quotedStringPattern, "$2");
        reportIfRelative(path);

        return false;
      }

      if (part !== importPath || part.type !== "string") return true;
      reportIfRelative(part.value);

      return false;
    });
  });
};

export const rule: Rule<boolean> = Object.assign(ruleFunction, {
  ruleName,
  messages,
});
