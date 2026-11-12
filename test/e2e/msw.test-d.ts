import { expectTypeOf } from "vite-plus/test";

import type { Theme } from "#/shared/constants/prefs";

import { mockServerFn } from "./msw";
import { serverFns } from "./server-fns.gen";

const prefs = serverFns["src/shared/lib/prefs.ts"];

mockServerFn(prefs.setThemeFn, (data) => {
  expectTypeOf(data).toEqualTypeOf<Theme>();
});

mockServerFn(prefs.getThemeFn, (data) => {
  expectTypeOf(data).toEqualTypeOf<undefined>();
  return "dark";
});

mockServerFn(prefs.getThemeFn, () => "dark");

// @ts-expect-error The saved theme must be one of the server function's return values.
mockServerFn(prefs.getThemeFn, () => "not-a-theme");
