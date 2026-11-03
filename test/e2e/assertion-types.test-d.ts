import { expectTypeOf } from "vite-plus/test";

import { expect, test } from "#test/e2e";

test("E2E assertions do not expose Browser Mode extensions", () => {
  expectTypeOf(expect).toHaveProperty("page");
  expectTypeOf(expect).toHaveProperty("locator");
  expectTypeOf(expect).not.toHaveProperty("element");
  expectTypeOf(expect(null)).not.toHaveProperty("toBeInTheDocument");
});
