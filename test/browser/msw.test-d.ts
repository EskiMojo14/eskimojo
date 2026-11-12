import { expectTypeOf } from "vite-plus/test";

import { getTopTracksFn, type TopTrack } from "#/routes/music.{-$breakdown}/-query";
import type { Theme } from "#/shared/constants/prefs";
import { getThemeFn, setThemeFn } from "#/shared/lib/prefs";

import { mockServerFn } from "./msw";

mockServerFn(setThemeFn, (data) => {
  expectTypeOf(data).toEqualTypeOf<Theme>();
});

mockServerFn(getThemeFn, (data) => {
  expectTypeOf(data).toEqualTypeOf<undefined>();
  return "dark";
});

mockServerFn(getThemeFn, async () => "light");

const tracks: Array<TopTrack> = [];
mockServerFn(getTopTracksFn, async () => ({ toptracks: { track: tracks } }));

// @ts-expect-error The input is a theme, not a number.
mockServerFn(setThemeFn, (_data: number) => {});

// @ts-expect-error A number is not a valid theme result.
mockServerFn(getThemeFn, () => 123);

// @ts-expect-error An arbitrary string is not a valid theme result.
mockServerFn(getThemeFn, () => "not-a-theme");
