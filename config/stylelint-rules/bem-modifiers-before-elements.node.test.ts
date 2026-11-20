import stylelint from "stylelint";
import { expect, test } from "vite-plus/test";

import { code } from "#/utils";

import { ruleName } from "./bem-modifiers-before-elements.ts";

test("reports each block modifier following an element without autofixing", async () => {
  const css = code.css`
    .block {
      &__element {}
      &:hover {}
      &--compact {}
      &--large {}
    }
  `;

  const { results, code: output } = await stylelint.lint({
    code: css,
    codeFilename: "src/bem-fixture.css",
    configFile: "./config/stylelint.config.ts",
    fix: true,
  });

  expect(results[0]?.warnings).toEqual([
    expect.objectContaining({ rule: ruleName, line: 5, severity: "error" }),
    expect.objectContaining({ rule: ruleName, line: 6, severity: "error" }),
  ]);
  expect(output).toBe(css);
});

test("checks selectors in a group, including commas inside pseudo-classes", async () => {
  const { results } = await stylelint.lint({
    code: code.css`
      .block {
        &--one, &__item:is(.a, .b) {}
        &__other, &--two {}
      }
    `,
    codeFilename: "src/bem-fixture.css",
    configFile: "./config/stylelint.config.ts",
  });

  expect(results[0]?.warnings).toEqual([expect.objectContaining({ rule: ruleName, line: 4 })]);
});

test("allows ordered modifiers, element modifiers, and separate conditional scopes", async () => {
  const { results } = await stylelint.lint({
    code: code.css`
      .block {
        &--compact, &--large {}
        &__element {
          &--selected {}
          @media (prefers-reduced-motion: reduce) {
            &--quiet {}
          }
        }
        &:has(&__element) {}
        @media (prefers-reduced-motion: reduce) {
          &--quiet {}
          &__element {}
        }
      }
      .block--flat {}
    `,
    codeFilename: "src/bem-fixture.css",
    configFile: "./config/stylelint.config.ts",
  });

  expect(results[0]?.warnings).toEqual([]);
});

test("enforces ordering within a conditional scope independently", async () => {
  const { results } = await stylelint.lint({
    code: code.css`
      .block {
        @media (prefers-reduced-motion: reduce) {
          &__element {}
          &--quiet {}
        }
      }
    `,
    codeFilename: "src/bem-fixture.css",
    configFile: "./config/stylelint.config.ts",
  });

  expect(results[0]?.warnings).toEqual([expect.objectContaining({ rule: ruleName, line: 5 })]);
});

test("checks grouped selectors that start with comments", async () => {
  const { results } = await stylelint.lint({
    code: code.css`
      .block {
        &__item, /* modifier */ &--compact {}
      }
    `,
    codeFilename: "src/bem-fixture.css",
    configFile: "./config/stylelint.config.ts",
  });

  expect(results[0]?.warnings).toEqual([expect.objectContaining({ rule: ruleName, line: 3 })]);
});
