import postcss from "postcss";
import { expect, test } from "vite-plus/test";

import { postcssAlphaToRgb } from "./postcss-alpha-to-rgb.ts";

const css = String.raw;

const normalize = (code: string) => code.replaceAll(/\s+/g, " ").trim();

const process = async (input: string) =>
  normalize((await postcss([postcssAlphaToRgb()]).process(input, { from: undefined })).css);

test("rewrites alpha() with var() origins to rgb(from …)", async () => {
  expect(
    await process(css`
      a {
        box-shadow:
          0 1px 2px alpha(from var(--shadow) / var(--key)),
          0 1px 3px alpha(from var(--shadow) / 15%);
      }
    `),
  ).toBe(
    normalize(css`
      a {
        box-shadow:
          0 1px 2px rgb(from var(--shadow) r g b / var(--key)),
          0 1px 3px rgb(from var(--shadow) r g b / 15%);
      }
    `),
  );
});

test("handles custom properties, currentColor and nested origins", async () => {
  expect(
    await process(css`
      a {
        --layer: alpha(from currentColor / 8%);
        color: alpha(from light-dark(red, blue) / 50%);
      }
    `),
  ).toBe(
    normalize(css`
      a {
        --layer: rgb(from currentColor r g b / 8%);
        color: rgb(from light-dark(red, blue) r g b / 50%);
      }
    `),
  );
});

test("leaves declarations without relative alpha() untouched", async () => {
  const input = css`
    a {
      color: rgb(0 0 0 / 50%);
      --alpha-thing: 1;
    }
  `;
  expect(await process(input)).toBe(normalize(input));
});
