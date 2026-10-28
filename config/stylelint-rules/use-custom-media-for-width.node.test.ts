import stylelint from "stylelint";
import { expect, test } from "vite-plus/test";

import { ruleName } from "./use-custom-media-for-width.js";

test.each([
  "@media (max-width: 48rem) {}",
  "@media (width < 600px) {}",
  "@media screen and (min-device-width: 600px) {}",
  "@media (width >= 40rem) and (height > 30rem) {}",
])("rejects viewport width media features: %s", async (code) => {
  const { results } = await stylelint.lint({
    code,
    codeFilename: "src/width-fixture.css",
    configFile: "./config/stylelint.config.js",
  });

  expect(results[0]?.warnings).toEqual([
    expect.objectContaining({
      rule: ruleName,
      severity: "error",
      text: expect.stringContaining("Use a named custom media query"),
    }),
  ]);
});

test.each([
  "@media (--phone) {}",
  "@media (--tablet-small), (--desktop) {}",
  "@media (prefers-reduced-motion: reduce) {}",
  "@container (max-width: 36rem) {}",
  "@media (orientation: landscape) and (color) {}",
])("allows custom media and non-viewport width queries: %s", async (code) => {
  const { results } = await stylelint.lint({
    code,
    codeFilename: "src/width-fixture.css",
    configFile: "./config/stylelint.config.js",
  });

  expect(results[0]?.warnings).toEqual([]);
});
