import valueParser from "postcss-value-parser";
import stylelint from "stylelint";

const pathRuleName = "local/no-parent-relative-paths";

/** @type {import("stylelint").Rule} */
const noParentRelativePaths = (primary) => (root, result) => {
  if (
    !stylelint.utils.validateOptions(result, pathRuleName, {
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
        ruleName: pathRuleName,
        result,
        node,
        message: `Use a #/ import or a root-absolute URL instead of parent-relative path "${path}".`,
      });
      return false;
    });
  });
};

const colorToken = String.raw`var\(--md-sys-color-[a-z-]+\)`;
const colorMixArg = String.raw`(?:${colorToken}|currentcolor)(?:\s+\d+(?:\.\d+)?%)?`;
const colorMix = String.raw`/^color-mix\(\s*in\s+[a-z0-9-]+(?:\s+(?:shorter|longer|increasing|decreasing)\s+hue)?\s*,\s*${colorMixArg}\s*,\s*${colorMixArg}\s*\)$/i`;
const alphaColor = String.raw`/^alpha\(\s*from\s+(?:${colorToken}|currentcolor)\s*\/\s*(?:\d+(?:\.\d+)?%?|\.\d+%?|var\(--md-sys-state-[a-z-]+-state-layer-opacity\))\s*\)$/i`;

const globalKeywords = ["inherit", "initial", "unset", "revert", "revert-layer"];
const colorValues = [
  ...globalKeywords,
  "transparent",
  "/^currentcolor$/i",
  "none",
  "/^url\\(/",
  colorMix,
  alphaColor,
];

// The plugin can't expand these shorthands, so it checks each word: allow the non-colour ones.
const lineWords = String.raw`/^(?:[\d.]+[a-z]*|thin|medium|thick|auto|solid|dashed|dotted|double|groove|ridge|inset|outset|wavy)$/`;
const shorthandWords = {
  outline: [lineWords],
  "text-decoration": [
    lineWords,
    "/^(?:underline|overline|line-through|blink|from-font|spelling-error|grammar-error)$/",
  ],
};

const radiusProperties = ["/^border(-[a-z]+)*-radius$/"];

const fontProperties = ["font", "font-family", "font-weight"];
const colorProperties = [
  "/color$/",
  "background",
  "/^border(-(top|right|bottom|left|block|inline)(-(start|end))?)?$/",
  "outline",
  "text-decoration",
  "fill",
  "stroke",
];

/** @type {import("stylelint").Config} */
export default {
  ignoreFiles: ["../**/*.gen.*"],
  plugins: [
    "stylelint-declaration-strict-value",
    stylelint.createPlugin(pathRuleName, noParentRelativePaths),
  ],
  rules: {
    [pathRuleName]: true,
    "scale-unlimited/declaration-strict-value": [
      [...fontProperties, ...colorProperties, ...radiusProperties],
      {
        ignoreFunctions: false,
        expandShorthand: true,
        // Keys must match a property entry exactly, and replace "" rather than adding to it.
        ignoreValues: {
          "": globalKeywords,
          [radiusProperties[0]]: [...globalKeywords, "0"],
          ...Object.fromEntries(
            colorProperties.map((property) => [
              property,
              [...colorValues, ...(shorthandWords[property] ?? [])],
            ]),
          ),
        },
        severity: "warning",
        disableFix: true,
        message:
          'Use a design token for "${property}", not "${value}": var(--typo-*) for fonts, var(--md-sys-color-*) or alpha() or color-mix() of them for colours, var(--md-sys-shape-corner-*) for radii. See Foundations in Storybook.',
      },
    ],
  },
  overrides: [
    {
      // These define the tokens, so they need literal values.
      files: [
        "../src/shared/styles/typography.css",
        "../src/shared/styles/shape.css",
        "../src/shared/styles/theme/**/*.css",
      ],
      rules: { "scale-unlimited/declaration-strict-value": null },
    },
  ],
};
