import stylelint from "stylelint";
import { expect, test } from "vite-plus/test";

import { code } from "#/utils";

import { ruleName } from "./use-motion-token-for-easing.js";

test.each([
  [
    "transition shorthand",
    code.css`
      a {
        transition: color 150ms ease;
      }
    `,
  ],
  [
    "animation shorthand",
    code.css`
      a {
        animation: pulse 1s cubic-bezier(0.4, 0, 0.2, 1) infinite;
      }
    `,
  ],
  [
    "transition timing function",
    code.css`
      a {
        transition-timing-function: ease-in;
      }
    `,
  ],
  [
    "animation timing function",
    code.css`
      a {
        animation-timing-function: steps(4, end);
      }
    `,
  ],
  [
    "linear timing function",
    code.css`
      a {
        animation: pulse 1s linear infinite;
      }
    `,
  ],
  [
    "custom property alias",
    code.css`
      :root {
        --custom-easing: ease;
      }
      a {
        animation-timing-function: var(--custom-easing);
      }
    `,
  ],
  [
    "custom property alias in shorthand",
    code.css`
      :root {
        --custom-easing: ease;
      }
      a {
        transition: color 150ms var(--custom-easing);
      }
    `,
  ],
])("rejects a non-token easing in %s", async (_scenario, css) => {
  const { results } = await stylelint.lint({
    code: css,
    codeFilename: "src/easing-fixture.css",
    configFile: "./config/stylelint.config.js",
  });

  expect(results[0]?.warnings).toEqual([
    expect.objectContaining({
      rule: ruleName,
      severity: "error",
      text: expect.stringContaining("Use a motion token for easing curves"),
    }),
  ]);
});

test.each([
  code.css`
    a {
      transition: color 150ms var(--md-sys-motion-spring-fast-effects);
    }
  `,
  code.css`
    a {
      animation: pulse 1s var(--md-sys-motion-easing-linear) infinite;
    }
  `,
  code.css`
    a {
      transition-timing-function: var(--md-sys-motion-easing-standard);
    }
  `,
  code.css`
    :root {
      --custom-easing: var(--md-sys-motion-easing-standard);
    }
    a {
      animation-timing-function: var(--custom-easing);
    }
  `,
  code.css`
    :root {
      --custom-easing: var(--md-sys-motion-easing-standard);
    }
    a {
      transition: color 150ms var(--custom-easing);
    }
  `,
  code.css`
    a {
      animation-timing-function: inherit;
    }
  `,
  code.css`
    a {
      --custom-value: ease;
    }
  `,
])("allows motion tokens and values outside easing properties: %s", async (css) => {
  const { results } = await stylelint.lint({
    code: css,
    codeFilename: "src/easing-fixture.css",
    configFile: "./config/stylelint.config.js",
  });

  expect(results[0]?.warnings).toEqual([]);
});
