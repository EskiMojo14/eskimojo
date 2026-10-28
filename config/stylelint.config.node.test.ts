import stylelint from "stylelint";
import { expect, test } from "vite-plus/test";

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
  "a { color: alpha(from var(--md-sys-color-primary) / var(--md-sys-state-disabled-content-opacity)); }",
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
