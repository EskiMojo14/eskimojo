import type { Locator } from "playwright";
import { expect } from "vite-plus/test";

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
  async toBeVisible(locator: Locator) {
    const visible = await locator.isVisible();
    return {
      pass: visible,
      actual: visible,
      expected: !this.isNot,
      message: () => `Expected ${locator.toString()} ${this.isNot ? "not " : ""}to be visible`,
    };
  },
  async toHaveTextContent(
    locator: Locator,
    expected?: string | number,
    options?: { normalizeWhitespace: boolean },
  ) {
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
    locator: Locator,
    expected: string | number | RegExp,
    options?: { normalizeWhitespace: boolean },
  ) {
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
  async toHaveAttribute(locator: Locator, name: string, expected?: unknown) {
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

declare module "vitest" {
  interface ExpectStatic {
    locator(locator: Locator, options?: ExpectPollOptions): ReturnType<typeof expect.poll<Locator>>;
  }

  interface Matchers<R, T> {
    toBeVisible(): Promise<void>;
    toHaveTextContent(
      text?: string | number,
      options?: { normalizeWhitespace: boolean },
    ): Promise<void>;
    toMatchTextContent(
      text: string | number | RegExp,
      options?: { normalizeWhitespace: boolean },
    ): Promise<void>;
    toHaveAttribute(name: string, value?: unknown): Promise<void>;
  }
}

export { expect };
