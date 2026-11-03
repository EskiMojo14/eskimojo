import type { Locator, Page } from "playwright";
import { expectTypeOf } from "vite-plus/test";

import { expect, test } from "#test/e2e";

test("E2E assertions do not expose Browser Mode extensions", () => {
  expectTypeOf(expect).not.toHaveProperty("page");
  expectTypeOf(expect).not.toHaveProperty("locator");
  expectTypeOf(expect).not.toHaveProperty("element");
  expectTypeOf(expect(null)).not.toHaveProperty("toBeInTheDocument");
  expectTypeOf(expect).not.toHaveProperty("ref");
  expectTypeOf<ReturnType<typeof expect<Page>>>().toHaveProperty("toHaveTitle");
  expectTypeOf<ReturnType<typeof expect<Locator>>>().toHaveProperty("toHaveText");
});
