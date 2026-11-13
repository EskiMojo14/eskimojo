import { expect, test } from "vite-plus/test";

import { isChristmas } from "./christmas";

test("uses Christmas artwork throughout December in UTC", () => {
  expect(isChristmas(false, new Date("2026-11-30T23:59:59Z"))).toBe(false);
  expect(isChristmas(false, new Date("2026-12-01T00:00:00Z"))).toBe(true);
  expect(isChristmas(false, new Date("2026-12-31T23:59:59Z"))).toBe(true);
  expect(isChristmas(false, new Date("2027-01-01T00:00:00Z"))).toBe(false);
});

test("allows the URL override outside December", () => {
  expect(isChristmas(true, new Date("2026-07-01T00:00:00Z"))).toBe(true);
  expect(isChristmas(undefined, new Date("2026-07-01T00:00:00Z"))).toBe(false);
});
