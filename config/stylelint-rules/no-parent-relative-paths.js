import valueParser from "postcss-value-parser";
import stylelint from "stylelint";

export const ruleName = "local/no-parent-relative-paths";

/** @type {import("stylelint").Rule} */
export const rule = (primary) => (root, result) => {
  if (
    !stylelint.utils.validateOptions(result, ruleName, {
      actual: primary,
      possible: [true],
    })
  )
    return;

  root.walk((node) => {
    const isImport = node.type === "atrule" && node.name.toLowerCase() === "import";
    if (node.type !== "decl" && !isImport) return;

    const value = node.type === "decl" ? node.value : node.params;
    const parsed = valueParser(value);
    const importPath = isImport
      ? parsed.nodes.find((part) => part.type !== "space" && part.type !== "comment")
      : undefined;

    parsed.walk((part) => {
      const isUrl = part.type === "function" && part.value.toLowerCase() === "url";
      if (!isUrl && (part !== importPath || part.type !== "string")) return true;

      const path = isUrl
        ? valueParser
            .stringify(part.nodes)
            .trim()
            .replace(/^(["'])(.*)\1$/, "$2")
        : part.value;
      if (/^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(path) || !path.split("/").includes(".."))
        return false;

      stylelint.utils.report({
        ruleName,
        result,
        node,
        message: `Use a #/ import or a root-absolute URL instead of parent-relative path "${path}".`,
      });
      return false;
    });
  });
};
