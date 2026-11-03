import type { Locator, Page } from "playwright";
import { expect, type MatcherState } from "vite-plus/test";

function hasMethods(value: unknown, methods: Array<string>) {
  return (
    typeof value === "object" &&
    value !== null &&
    methods.every((method) => method in value && typeof Reflect.get(value, method) === "function")
  );
}

function assertPage(
  value: unknown,
  matcher: string,
  utils: MatcherState["utils"],
): asserts value is Page {
  if (!hasMethods(value, ["title", "url", "context", "goto"])) {
    throw new TypeError(
      `${matcher} requires a Playwright Page, received ${utils.printReceived(value)}`,
    );
  }
}

function assertLocator(
  value: unknown,
  matcher: string,
  utils: MatcherState["utils"],
): asserts value is Locator {
  if (!hasMethods(value, ["evaluateAll", "isVisible", "page", "locator"])) {
    throw new TypeError(
      `${matcher} requires a Playwright Locator, received ${utils.printReceived(value)}`,
    );
  }
}

async function getTextContent(locator: Locator, options = { normalizeWhitespace: true }) {
  const actual = await locator.evaluateAll((elements) =>
    elements.map((element) => element.textContent ?? ""),
  );
  if (actual.length > 1) {
    throw new Error(
      `Expected ${locator.toString()} to resolve to at most one element, got ${actual.length}`,
    );
  }
  const text = actual[0];
  return text === undefined
    ? undefined
    : options.normalizeWhitespace
      ? text.replace(/\s+/g, " ").trim()
      : text.replace(/\u00a0/g, " ");
}

expect.extend({
  async toHaveTitle(page: unknown, expected: string | RegExp) {
    assertPage(page, "toHaveTitle", this.utils);
    const actual = await page.title();
    return {
      pass: typeof expected === "string" ? actual === expected : new RegExp(expected).test(actual),
      actual,
      expected,
      message: () =>
        `Expected page ${this.isNot ? "not " : ""}to have title ${this.utils.printExpected(expected)}, received ${this.utils.printReceived(actual)}`,
    };
  },
  toHaveURL(page: unknown, expected: string | RegExp | ((url: URL) => boolean)) {
    assertPage(page, "toHaveURL", this.utils);
    const actual = page.url();
    return {
      pass:
        typeof expected === "function"
          ? expected(new URL(actual))
          : typeof expected === "string"
            ? actual === expected
            : new RegExp(expected).test(actual),
      actual,
      expected,
      message: () =>
        `Expected page ${this.isNot ? "not " : ""}to have URL ${this.utils.printExpected(expected)}, received ${this.utils.printReceived(actual)}`,
    };
  },
  async toBeVisible(locator: unknown) {
    assertLocator(locator, "toBeVisible", this.utils);
    const visible = await locator.isVisible();
    return {
      pass: visible,
      actual: visible,
      expected: !this.isNot,
      message: () => `Expected ${locator.toString()} ${this.isNot ? "not " : ""}to be visible`,
    };
  },
  async toHaveTextContent(
    locator: unknown,
    expected?: string | number,
    options?: { normalizeWhitespace: boolean },
  ) {
    assertLocator(locator, "toHaveTextContent", this.utils);
    const actual = await getTextContent(locator, options);
    return {
      pass:
        actual !== undefined &&
        (expected === undefined ? actual.length > 0 : actual === String(expected)),
      actual,
      expected,
      message: () =>
        `Expected ${locator.toString()} ${this.isNot ? "not " : ""}to have text content ${this.utils.printExpected(expected)}, received ${this.utils.printReceived(actual)}`,
    };
  },
  async toMatchTextContent(
    locator: unknown,
    expected: string | number | RegExp,
    options?: { normalizeWhitespace: boolean },
  ) {
    assertLocator(locator, "toMatchTextContent", this.utils);
    const actual = await getTextContent(locator, options);
    return {
      pass:
        actual !== undefined &&
        (expected instanceof RegExp
          ? new RegExp(expected).test(actual)
          : actual.includes(String(expected))),
      actual,
      expected,
      message: () =>
        `Expected ${locator.toString()} ${this.isNot ? "not " : ""}to match text content ${this.utils.printExpected(expected)}, received ${this.utils.printReceived(actual)}`,
    };
  },
  async toHaveAttribute(locator: unknown, name: string, expected?: unknown) {
    assertLocator(locator, "toHaveAttribute", this.utils);
    const actual = await locator.evaluateAll(
      (elements, attribute) => elements.map((element) => element.getAttribute(attribute)),
      name,
    );
    if (actual.length > 1) {
      throw new Error(
        `Expected ${locator.toString()} to resolve to at most one element, got ${actual.length}`,
      );
    }
    const value = actual[0];
    return {
      pass:
        typeof value === "string" &&
        (expected === undefined || this.equals(value, expected, this.customTesters)),
      actual: value,
      expected,
      message: () =>
        `Expected ${locator.toString()} ${this.isNot ? "not " : ""}to have attribute ${name}${expected === undefined ? "" : ` matching ${this.utils.printExpected(expected)}`}, received ${this.utils.printReceived(value)}`,
    };
  },
});

expect.locator = (locator, options) => expect.poll(() => locator, options);
expect.page = (page, options) => expect.poll(() => page, options);

declare module "vitest" {
  interface ExpectStatic {
    /**
     * `expect.locator(locator)` retries assertions against a Playwright locator
     * using the `expect.poll` timeout options.
     * You can set the default timeout via the `expect.poll.timeout` config option.
     * @see https://vitest.dev/api/expect#poll
     * @example
     * await expect.locator(home.socialLink("GitHub")).toBeVisible();
     */
    locator(locator: Locator, options?: ExpectPollOptions): Assertion<Promise<void>, Locator>;
    /**
     * `expect.page(page)` retries assertions against a Playwright page
     * using the `expect.poll` timeout options.
     * You can set the default timeout via the `expect.poll.timeout` config option.
     * @see https://vitest.dev/api/expect#poll
     * @example
     * await expect.page(page).toHaveTitle("Home | eskimojo");
     */
    page(page: Page, options?: ExpectPollOptions): Assertion<Promise<void>, Page>;
  }

  interface Matchers<R, T> {
    /**
     * Asserts that a Playwright page's title equals a string or matches a regular
     * expression. Use `expect.page()` to retry until the title matches.
     * @example
     * await expect.page(page).toHaveTitle(/Home/);
     */
    toHaveTitle(expected: string | RegExp): Promise<void>;
    /**
     * Asserts that a Playwright page's full URL equals a string, matches a regular
     * expression, or satisfies a predicate receiving a `URL` object.
     * Use `expect.page()` to retry until the URL matches.
     * @example
     * await expect.page(page).toHaveURL((url) => url.pathname === "/projects");
     */
    toHaveURL(expected: string | RegExp | ((url: URL) => boolean)): R;
    /**
     * Asserts that a Playwright locator resolves to a visible element.
     * Use `expect.locator()` to retry until the element is visible.
     * @example
     * await expect.locator(home.socialLink("GitHub")).toBeVisible();
     */
    toBeVisible(): Promise<void>;
    /**
     * Asserts that a Playwright locator's text content exactly equals the expected
     * string or number. Omitting the expected value checks for nonempty content.
     * Whitespace is collapsed and trimmed by default; set `normalizeWhitespace`
     * to `false` to preserve it. Nonbreaking spaces are still converted to spaces.
     * Use `expect.locator()` to retry; multiple matching elements are an error.
     * @example
     * await expect.locator(header.heading).toHaveTextContent("Projects");
     */
    toHaveTextContent(
      text?: string | number,
      options?: { normalizeWhitespace: boolean },
    ): Promise<void>;
    /**
     * Asserts that a Playwright locator's text content contains the expected
     * string or number, or matches a regular expression.
     * Whitespace is collapsed and trimmed by default; set `normalizeWhitespace`
     * to `false` to preserve it. Nonbreaking spaces are still converted to spaces.
     * Use `expect.locator()` to retry; multiple matching elements are an error.
     * @example
     * await expect.locator(header.heading).toMatchTextContent(/Projects/i);
     */
    toMatchTextContent(
      text: string | number | RegExp,
      options?: { normalizeWhitespace: boolean },
    ): Promise<void>;
    /**
     * Asserts that a Playwright locator's element has the named attribute.
     * When an expected value is supplied, compares the attribute's string value
     * using Vitest equality, including asymmetric matchers.
     * Use `expect.locator()` to retry; multiple matching elements are an error.
     * @example
     * await expect.locator(tab.tabLink).toHaveAttribute("aria-selected", "true");
     */
    toHaveAttribute(name: string, value?: unknown): Promise<void>;
  }
}

export { expect };
