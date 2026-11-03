import { expect, expectTypeOf, test } from "vite-plus/test";

test("browser assertions do not expose E2E extensions", () => {
  expectTypeOf(expect).toHaveProperty("element");
  expectTypeOf(expect).not.toHaveProperty("page");
  expectTypeOf(expect).not.toHaveProperty("locator");
  expectTypeOf(expect(null)).not.toHaveProperty("toHaveTitle");
});
