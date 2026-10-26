import stylelint from "stylelint";
import { expect, test } from "vite-plus/test";

const ruleName = "local/no-parent-relative-paths";

test.each([
  '@import "../styles.css";',
  "@import '../../styles.css' layer(base);",
  '@import /* path */ "../styles.css" screen;',
  '@IMPORT url("../styles.css");',
  "@import url(../../styles.css);",
  '@import "./../styles.css";',
  '@import "./nested/../styles.css";',
  'a { background-image: url("../image.png"); }',
  "a { background-image: URL( ../../image.png ); }",
  '@font-face { src: url("../font.woff2") format("woff2"); }',
])("rejects parent-relative paths: %s", async (code) => {
  const { results } = await stylelint.lint({
    code,
    codeFilename: "src/path-fixture.css",
    configFile: "./config/stylelint.config.js",
  });

  expect(results[0]?.warnings).toEqual([
    expect.objectContaining({
      rule: ruleName,
      severity: "error",
      text: expect.stringContaining("Use a #/ import or a root-absolute URL"),
    }),
  ]);
});

test.each([
  '@import "#/shared/styles/index.css";',
  '@import url("#/shared/styles/index.css");',
  '@import "./styles.css";',
  '@import "./theme/styles.css";',
  '@import "normalize.css";',
  '@import "/styles.css";',
  '@import "https://example.com/../styles.css";',
  'a { filter: url("#mask"); }',
  'a { background-image: url("./image.png"); }',
  'a { background-image: url("/image.png"); }',
  'a { background-image: url("//example.com/../image.png"); }',
  'a { background-image: url("data:image/svg+xml,../"); }',
  'a { content: "../not-a-path"; }',
  '/* @import "../not-an-import.css"; */ a { content: "url(../not-a-url)"; }',
])("allows non-parent-relative paths and non-URLs: %s", async (code) => {
  const { results } = await stylelint.lint({
    code,
    codeFilename: "src/path-fixture.css",
    configFile: "./config/stylelint.config.js",
  });

  expect(results[0]?.warnings).toEqual([]);
});

test("preserves foundation overrides and generated-file exclusions with an explicit config", async () => {
  const foundation = await stylelint.lint({
    code: "body { color: red; }",
    codeFilename: "src/shared/styles/typography.css",
    configFile: "./config/stylelint.config.js",
  });
  expect(foundation.results[0]?.warnings).toEqual([]);

  const generated = await stylelint.lint({
    code: '@import "../ignored.css";',
    codeFilename: "src/shared/styles/theme/palettes/fixture.gen.css",
    configFile: "./config/stylelint.config.js",
  });
  expect(generated.results[0]?.ignored).toBe(true);
});

test.each([
  "a { color: alpha(from var(--md-sys-color-primary) / 50%); }",
  "a { color: alpha(from currentColor / var(--md-sys-state-hover-state-layer-opacity)); }",
  "a { color: color-mix(in srgb, var(--md-sys-color-primary), var(--md-sys-color-secondary)); }",
])("allows theme colors with alpha() and opaque color-mix(): %s", async (code) => {
  const { results } = await stylelint.lint({
    code,
    codeFilename: "src/color-fixture.css",
    configFile: "./config/stylelint.config.js",
  });

  expect(results[0]?.warnings).toEqual([]);
});

test.each([
  "a { color: color-mix(in srgb, var(--md-sys-color-primary), transparent); }",
  "a { color: rgb(from var(--md-sys-color-primary) r g b / 50%); }",
  "a { color: alpha(from red / 50%); }",
])("rejects transparent mixes, relative colors, and literal alpha colors: %s", async (code) => {
  const { results } = await stylelint.lint({
    code,
    codeFilename: "src/color-fixture.css",
    configFile: "./config/stylelint.config.js",
  });

  expect(results[0]?.warnings).toHaveLength(1);
});
