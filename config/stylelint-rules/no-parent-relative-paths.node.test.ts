import stylelint from "stylelint";
import { expect, test } from "vite-plus/test";

import { ruleName } from "./no-parent-relative-paths.js";

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
