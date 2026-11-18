import type rehypePrism from "rehype-prism-plus";

const jsLanguages = new Set([
  "language-javascript",
  "language-js",
  "language-jsx",
  "language-typescript",
  "language-ts",
  "language-tsx",
]);

export const prismTokens: typeof rehypePrism = () => (tree) => {
  function visit(node: (typeof tree.children)[number], javascript = false) {
    if (node.type !== "element") return;

    const classes = node.properties.className;
    if (Array.isArray(classes)) {
      const language = classes.find(
        (name) => typeof name === "string" && name.startsWith("language-"),
      );
      if (typeof language === "string") javascript = jsLanguages.has(language);

      const [text] = node.children;
      if (
        javascript &&
        classes.includes("token") &&
        classes.includes("keyword") &&
        node.children.length === 1 &&
        text?.type === "text" &&
        (text.value === "this" || text.value === "super")
      ) {
        classes.push("instance-reserved");
      }
    }

    for (const child of node.children) visit(child, javascript);
  }

  for (const child of tree.children) visit(child);
};
