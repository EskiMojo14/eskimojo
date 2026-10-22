const colorToken = String.raw`var\(--md-sys-color-[a-z-]+\)`;
const colorMixArg = String.raw`(?:${colorToken}|transparent|currentcolor)(?:\s+\d+(?:\.\d+)?%)?`;
const colorMix = String.raw`/^color-mix\(\s*in\s+[a-z0-9-]+(?:\s+(?:shorter|longer|increasing|decreasing)\s+hue)?\s*,\s*${colorMixArg}\s*,\s*${colorMixArg}\s*\)$/i`;

// Relative colors, e.g. color(from var(--md-sys-color-primary) srgb r g b / 50%).
const relativeColor = String.raw`/^(?:color|rgba?|hsla?|hwb|lab|lch|oklab|oklch)\(\s*from\s+${colorToken}\s[^;]*\)$/i`;

const globalKeywords = ["inherit", "initial", "unset", "revert", "revert-layer"];
const colorValues = [
  ...globalKeywords,
  "transparent",
  "/^currentcolor$/i",
  "none",
  "/^url\\(/",
  colorMix,
  relativeColor,
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
  ignoreFiles: ["**/*.gen.*"],
  plugins: ["stylelint-declaration-strict-value"],
  rules: {
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
          'Use a design token for "${property}", not "${value}": var(--typo-*) for fonts, var(--md-sys-color-*) or color-mix() of them for colours, var(--md-sys-shape-corner-*) for radii. See Foundations in Storybook.',
      },
    ],
  },
  overrides: [
    {
      // These define the tokens, so they need literal values.
      files: [
        "src/shared/styles/typography.css",
        "src/shared/styles/shape.css",
        "src/shared/styles/theme/**/*.css",
      ],
      rules: { "scale-unlimited/declaration-strict-value": null },
    },
  ],
};
