import valueParser from "postcss-value-parser";
import stylelint from "stylelint";
import type { Rule, RuleBase } from "stylelint";

export const ruleName = "local/use-motion-token-for-easing";

type ValueNode = ReturnType<typeof valueParser>["nodes"][number];

type CustomPropertyAliases = Map<string, Array<string>>;

const easingKeywords = new Set([
  "ease",
  "ease-in",
  "ease-out",
  "ease-in-out",
  "linear",
  "step-start",
  "step-end",
]);

const easingFunctions = new Set(["cubic-bezier", "frames", "linear", "steps"]);
const globalKeywords = new Set(["inherit", "initial", "revert", "revert-layer", "unset"]);

const motionToken =
  /^--md-sys-motion-(?:easing-[a-z\d-]+|spring-(?:fast|default|slow)-(?:spatial|effects))$/i;

const customPropertyPattern = /^--/;

const messages = {
  rejected: (easing: string) => `Use a motion token for easing curves instead of "${easing}".`,
};

function containsLiteralNonTokenEasing(nodes: Array<ValueNode>): boolean {
  return nodes.some((node) => {
    if (node.type === "word") return easingKeywords.has(node.value.toLowerCase());

    if (node.type !== "function") return false;

    return (
      easingFunctions.has(node.value.toLowerCase()) ||
      (node.value.toLowerCase() !== "var" && containsLiteralNonTokenEasing(node.nodes))
    );
  });
}

const resolvesToMotionToken = (
  node: ValueNode,
  aliases: CustomPropertyAliases,
  seen = new Set<string>(),
): boolean => {
  if (node.type !== "function" || node.value.toLowerCase() !== "var") return false;
  const name = node.nodes.find((part) => part.type === "word")?.value;

  if (name === undefined) return false;

  if (motionToken.test(name)) return true;

  const definitions = aliases.get(name);

  if (!definitions || seen.has(name)) return false;
  const nextSeen = new Set(seen).add(name);

  return definitions.every((value) => {
    const significantNodes = valueParser(value).nodes.filter(
      (part) => part.type !== "space" && part.type !== "comment",
    );

    const [significantNode] = significantNodes;

    return (
      significantNodes.length === 1 &&
      significantNode !== undefined &&
      resolvesToMotionToken(significantNode, aliases, nextSeen)
    );
  });
};

function containsNonTokenEasingAlias(
  node: ValueNode,
  aliases: CustomPropertyAliases,
  seen = new Set<string>(),
): boolean {
  if (node.type !== "function" || node.value.toLowerCase() !== "var") return false;
  const name = node.nodes.find((part) => part.type === "word")?.value;

  if (name === undefined || motionToken.test(name) || seen.has(name)) return false;

  const definitions = aliases.get(name);

  if (!definitions) return false;
  const nextSeen = new Set(seen).add(name);

  return definitions.some((value) => {
    const nodes = valueParser(value).nodes;

    return (
      containsLiteralNonTokenEasing(nodes) ||
      nodes.some((part) => containsNonTokenEasingAlias(part, aliases, nextSeen))
    );
  });
}

function findNonTokenEasing(
  nodes: Array<ValueNode>,
  requireMotionToken: boolean,
  aliases: CustomPropertyAliases,
): ValueNode | undefined {
  for (const node of nodes) {
    if (node.type === "word") {
      const value = node.value.toLowerCase();

      if (easingKeywords.has(value)) return node;

      if (requireMotionToken && !globalKeywords.has(value)) return node;
      continue;
    }

    if (node.type !== "function") continue;
    const name = node.value.toLowerCase();

    if (easingFunctions.has(name)) return node;

    if (name === "var") {
      if (requireMotionToken && !resolvesToMotionToken(node, aliases)) return node;

      if (!requireMotionToken && containsNonTokenEasingAlias(node, aliases)) return node;

      const fallbackStart = node.nodes.findIndex(
        (part) => part.type === "div" && part.value === ",",
      );

      if (fallbackStart !== -1) {
        const fallbackEasing = findNonTokenEasing(
          node.nodes.slice(fallbackStart + 1),
          false,
          aliases,
        );

        if (fallbackEasing) return fallbackEasing;
      }

      continue;
    }

    const nestedEasing = findNonTokenEasing(node.nodes, requireMotionToken, aliases);

    if (nestedEasing) return nestedEasing;
  }

  return undefined;
}

const ruleFunction: RuleBase<boolean> = (primary) => (root, result) => {
  if (
    !stylelint.utils.validateOptions(result, ruleName, {
      actual: primary,
      possible: [true],
    })
  )
    return;

  const aliases: CustomPropertyAliases = new Map();
  root.walkDecls(customPropertyPattern, (decl) => {
    const definitions = aliases.get(decl.prop) ?? [];
    definitions.push(decl.value);
    aliases.set(decl.prop, definitions);
  });

  root.walkDecls((decl) => {
    const property = decl.prop.toLowerCase();

    const isTimingFunction =
      property === "animation-timing-function" || property === "transition-timing-function";

    if (!isTimingFunction && property !== "animation" && property !== "transition") return;

    const easing = findNonTokenEasing(valueParser(decl.value).nodes, isTimingFunction, aliases);

    if (!easing) return;

    stylelint.utils.report({
      ruleName,
      result,
      node: decl,
      message: messages.rejected(valueParser.stringify(easing)),
    });
  });
};

export const rule: Rule<boolean> = Object.assign(ruleFunction, {
  ruleName,
  messages,
});
