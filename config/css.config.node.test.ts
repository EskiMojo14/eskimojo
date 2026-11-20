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

test("resolves multiple extends within the same conditional block in order", async () => {
  const result = await postcss(cssConfig.postcss.plugins).process(
    code.css`
      %primary {
        --color: red;
      }

      %secondary {
        --color: blue;
      }

      @media (prefers-contrast: more) {
        .button--primary {
          @extend %primary;
        }

        .button--secondary {
          @extend %secondary;
          --size: large;
        }
      }
    `,
    { from: undefined },
  );

  const media = result.root.nodes.find((node) => node.type === "atrule" && node.name === "media");

  const rules: Array<string> = [];

  if (media?.type === "atrule") {
    media.walkRules((rule) => {
      rule.walkDecls((decl) => {
        rules.push(`${rule.selector}: ${decl.prop}: ${decl.value}`);
      });
    });
  }

  expect(rules).toEqual([
    ".button--primary: --color: red",
    ".button--secondary: --color: blue",
    ".button--secondary: --size: large",
  ]);
});

test("resolves multiple extends within one rule without losing declarations", async () => {
  const result = await postcss(cssConfig.postcss.plugins).process(
    code.css`
      %first {
        --first: 1;
      }

      %second {
        --second: 2;
      }

      .button {
        @extend %first;
        --middle: 3;
        @extend %second;
      }
    `,
    { from: undefined },
  );

  const declarations: Array<string> = [];

  result.root.walkRules(".button", (rule) => {
    rule.walkDecls((decl) => {
      declarations.push(`${decl.prop}: ${decl.value}`);
    });
  });
  expect(declarations).toEqual(["--first: 1", "--middle: 3", "--second: 2"]);
});

test("still reports missing placeholders when several extends share a block", async () => {
  await expect(
    postcss(cssConfig.postcss.plugins).process(
      code.css`
        %first {
          --first: 1;
        }

        @media (prefers-contrast: more) {
          .one {
            @extend %first;
          }

          .two {
            @extend %missing;
          }
        }
      `,
      { from: undefined },
    ),
  ).rejects.toThrow('Unused extend at-rule "%missing"');
});

test("resolves nested BEM extends inside a shared conditional block", async () => {
  const result = await postcss(cssConfig.postcss.plugins).process(
    code.css`
      %primary {
        --color: red;
      }

      %secondary {
        --color: blue;
      }

      .button {
        @supports (display: grid) {
          &--primary {
            @extend %primary;
          }

          &--secondary {
            @extend %secondary;
          }
        }
      }
    `,
    { from: undefined },
  );

  const supports = result.root.nodes.find(
    (node) => node.type === "atrule" && node.name === "supports",
  );

  const rules: Array<string> = [];

  if (supports?.type === "atrule") {
    supports.walkRules((rule) => {
      rule.walkDecls((decl) => {
        rules.push(`${rule.selector}: ${decl.prop}: ${decl.value}`);
      });
    });
  }

  expect(rules).toEqual([".button--primary: --color: red", ".button--secondary: --color: blue"]);
});

test("preserves chained extends and later overrides", async () => {
  const result = await postcss(cssConfig.postcss.plugins).process(
    code.css`
      %base {
        --color: red;
      }

      .button {
        @extend %base;
        --color: blue;
      }

      .link {
        @extend .button;
      }
    `,
    { from: undefined },
  );

  const declarations: Array<string> = [];

  result.root.walkRules(".link", (rule) => {
    rule.walkDecls((decl) => {
      declarations.push(`${decl.prop}: ${decl.value}`);
    });
  });
  expect(declarations).toEqual(["--color: red", "--color: blue"]);
});
