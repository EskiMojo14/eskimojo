import { expect, test } from "vite-plus/test";

import { getProgressValue } from "./progress";

test.each([0, -1, NaN, Infinity])("rejects invalid progress maximum %s", (max) => {
  expect(() => getProgressValue(0, max)).toThrow(RangeError);
});

test.each([NaN, Infinity, -Infinity])("rejects non-finite progress value %s", (value) => {
  expect(() => getProgressValue(value, 1)).toThrow(RangeError);
});
