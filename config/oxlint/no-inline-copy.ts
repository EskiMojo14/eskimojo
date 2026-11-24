import { defineRule, type ESTree } from "vite-plus/lint/plugins";

const copyAttributes = new Set([
  "alt",
  "aria-description",
  "aria-label",
  "ariaDescription",
  "ariaLabel",
  "description",
  "label",
  "placeholder",
  "title",
  "tooltip",
]);

const copyPattern = /[\p{L}\p{N}]/u;

function hasCopy(value: string) {
  return copyPattern.test(value);
}

function containsInlineCopy(expression: ESTree.JSXExpression): boolean {
  switch (expression.type) {
    case "Literal":
      return typeof expression.value === "string" && hasCopy(expression.value);
    case "TemplateLiteral":
      return expression.quasis.some((part) => hasCopy(part.value.cooked ?? part.value.raw));
    case "ConditionalExpression":
      return containsInlineCopy(expression.consequent) || containsInlineCopy(expression.alternate);
    case "LogicalExpression":
      return containsInlineCopy(expression.left) || containsInlineCopy(expression.right);
    case "BinaryExpression":
      return (
        expression.operator === "+" &&
        (containsInlineCopy(expression.left) || containsInlineCopy(expression.right))
      );
    case "TSAsExpression":
    case "TSSatisfiesExpression":
    case "TSNonNullExpression":
      return containsInlineCopy(expression.expression);
    default:
      return false;
  }
}

function isSymbolContent(node: ESTree.JSXText | ESTree.JSXExpressionContainer) {
  const parent = node.parent;

  if (parent.type !== "JSXElement") return false;

  const name = parent.openingElement.name;

  return name.type === "JSXIdentifier" && name.name === "MdSymbol";
}

export const noInlineCopy = defineRule({
  meta: {
    type: "suggestion",
    docs: { description: "Keep application UI copy in a copy module." },
    messages: { inlineCopy: "Move this UI copy to a copy module." },
  },
  create(context) {
    return {
      JSXText(node) {
        if (!isSymbolContent(node) && hasCopy(node.value)) {
          context.report({ node, messageId: "inlineCopy" });
        }
      },
      JSXAttribute(node) {
        if (node.name.type !== "JSXIdentifier" || !copyAttributes.has(node.name.name)) return;

        const value = node.value;

        if (!value) return;

        if (
          (value.type === "Literal" && hasCopy(value.value)) ||
          (value.type === "JSXExpressionContainer" && containsInlineCopy(value.expression))
        ) {
          context.report({ node: value, messageId: "inlineCopy" });
        }
      },
      JSXExpressionContainer(node) {
        if (
          (node.parent.type === "JSXElement" || node.parent.type === "JSXFragment") &&
          !isSymbolContent(node) &&
          containsInlineCopy(node.expression)
        ) {
          context.report({ node, messageId: "inlineCopy" });
        }
      },
    };
  },
});
