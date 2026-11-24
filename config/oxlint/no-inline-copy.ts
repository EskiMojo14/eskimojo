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

const staticDataFields = new Set(["title", "subtitle"]);
const metadataFields = new Set(["title", "description"]);
const backLinkFields = new Set(["label"]);
const imageFields = new Set(["alt"]);

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
    function checkObject(
      expression: ESTree.Expression,
      fields: ReadonlySet<string>,
      nestedKey?: string,
      nestedFields?: ReadonlySet<string>,
    ) {
      if (expression.type === "ConditionalExpression") {
        checkObject(expression.consequent, fields, nestedKey, nestedFields);
        checkObject(expression.alternate, fields, nestedKey, nestedFields);

        return;
      }

      if (
        expression.type === "TSAsExpression" ||
        expression.type === "TSSatisfiesExpression" ||
        expression.type === "TSNonNullExpression"
      ) {
        checkObject(expression.expression, fields, nestedKey, nestedFields);

        return;
      }

      if (expression.type !== "ObjectExpression") return;

      for (const property of expression.properties) {
        if (property.type !== "Property" || property.computed) continue;

        const key = property.key;

        const name =
          key.type === "Identifier" ? key.name : key.type === "Literal" ? key.value : null;

        if (typeof name !== "string") continue;

        if (fields.has(name) && containsInlineCopy(property.value)) {
          context.report({ node: property.value, messageId: "inlineCopy" });
        } else if (name === nestedKey && nestedFields) {
          checkObject(property.value, nestedFields);
        }
      }
    }

    return {
      CallExpression(node) {
        const callee = node.callee;
        const argument = node.arguments[0];

        if (!argument || argument.type === "SpreadElement") return;

        if (callee.type === "Identifier" && callee.name === "generatePageMetadata") {
          checkObject(argument, metadataFields, "image", imageFields);

          return;
        }

        const factory = callee.type === "CallExpression" ? callee.callee : callee;

        if (
          factory.type !== "Identifier" ||
          ![
            "createFileRoute",
            "createRootRoute",
            "createRootRouteWithContext",
            "createRoute",
          ].includes(factory.name) ||
          argument.type !== "ObjectExpression"
        ) {
          return;
        }

        for (const property of argument.properties) {
          if (
            property.type === "Property" &&
            !property.computed &&
            property.key.type === "Identifier" &&
            property.key.name === "staticData"
          ) {
            checkObject(property.value, staticDataFields, "backLink", backLinkFields);
          }
        }
      },
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
