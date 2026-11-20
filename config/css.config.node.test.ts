import postcss from "postcss";
import { expect, test } from "vite-plus/test";

import { code } from "#/utils";

import { cssConfig } from "./css.config.ts";

test("expands BEM suffixes with variables, states, and conditional rules", async () => {
  const result = await postcss(cssConfig.postcss.plugins).process(
    code.css`
      $count: 2;
      .menu {
        &__item {
          color: red;

          &:hover {
            color: blue;
          }

          &--selected {
            color: green;
          }
        }

        &--compact {
          @media (min-width: 10px) {
            padding: 0;
          }
        }

        @for $i from 1 through $count {
          &__item:nth-child($i) {
            order: $i;
          }
        }
      }
    `,
    { from: undefined },
  );

  const rules: Array<string> = [];
  result.root.walkRules((rule) => {
    rules.push(rule.selector);
  });

  expect(rules).toEqual([
    ".menu__item",
    ".menu__item:hover",
    ".menu__item--selected",
    ".menu--compact",
    ".menu__item:nth-child(1)",
    ".menu__item:nth-child(2)",
  ]);
  expect(result.root.nodes.some((node) => node.type === "atrule" && node.name === "media")).toBe(
    true,
  );
});

test("keeps flat extends working alongside nested BEM rules", async () => {
  const result = await postcss(cssConfig.postcss.plugins).process(
    code.css`
      %token {
        color: red;
      }

      .theme {
        @extend %token;
      }

      .menu {
        &__item {
          color: blue;
        }
      }
    `,
    { from: undefined },
  );

  const rules: Array<string> = [];

  result.root.walkRules((rule) => {
    rules.push(`${rule.selector}: ${rule.first?.toString()}`);
  });
  expect(rules).toEqual([".theme: color: red", ".menu__item: color: blue"]);
});
