import { expectTypeOf, test } from "vite-plus/test";

import { gigBreakdownSchema } from "#/routes/gigs.{-$breakdown}/-constants";
import { musicBreakdownSchema, type Period } from "#/routes/music.{-$breakdown}/-constants";
import { type ProjectKind } from "#/routes/projects/-schema";

import { defineDetailGroup, defineFilterGroup, defineTabGroup } from "./factories";

test("tab groups preserve the route's parsed parameter values", () => {
  const group = defineTabGroup({
    route: "/music/{-$breakdown}",
    parameter: "breakdown",
    order: musicBreakdownSchema.options,
    defaultTab: musicBreakdownSchema.fallback,
  });
  expectTypeOf(group.order).toEqualTypeOf<Array<"top-music" | "recent">>();
});

test("tab groups reject parameters absent from their route", () => {
  const group = defineTabGroup({
    route: "/music/{-$breakdown}",
    // @ts-expect-error Music has no slug path parameter.
    parameter: "slug",
    order: musicBreakdownSchema.options,
    defaultTab: musicBreakdownSchema.fallback,
  });
  expectTypeOf(group.route).toEqualTypeOf<"/music/{-$breakdown}">();
});

test("tab groups reject schema options and defaults from another route", () => {
  const group = defineTabGroup({
    route: "/music/{-$breakdown}",
    parameter: "breakdown",
    // @ts-expect-error Gigs options are not valid parsed Music params.
    order: gigBreakdownSchema.options,
    // @ts-expect-error The Gigs fallback is not a valid Music tab.
    defaultTab: gigBreakdownSchema.fallback,
  });
  expectTypeOf(group.parameter).toEqualTypeOf<"breakdown">();
});

test("detail groups accept a registered descendant route", () => {
  const group = defineDetailGroup({
    listRoute: "/projects",
    detailRoute: "/projects/$slug",
    type: "project",
  });
  expectTypeOf(group.detailRoute).toEqualTypeOf<"/projects/$slug">();
});

test("detail groups reject unrelated registered routes", () => {
  const group = defineDetailGroup({
    listRoute: "/projects",
    // @ts-expect-error Music is not a descendant of Projects.
    detailRoute: "/music/{-$breakdown}",
    type: "project",
  });
  expectTypeOf(group.listRoute).toEqualTypeOf<"/projects">();
});

test("detail groups reject unregistered descendant routes", () => {
  const group = defineDetailGroup({
    listRoute: "/projects",
    // @ts-expect-error This descendant route is not registered.
    detailRoute: "/projects/$slug/missing",
    type: "project",
  });
  expectTypeOf(group.listRoute).toEqualTypeOf<"/projects">();
});

test("filter callbacks infer the route's optional search output", () => {
  defineFilterGroup({
    route: "/projects",
    parameter: "type",
    types: (from, to) => {
      expectTypeOf(from).toEqualTypeOf<ProjectKind | undefined>();
      expectTypeOf(to).toEqualTypeOf<ProjectKind | undefined>();
      return [];
    },
  });
});

test("filter callbacks preserve the route's optional period search type", () => {
  defineFilterGroup({
    route: "/music/{-$breakdown}",
    parameter: "period",
    types: (from, to) => {
      expectTypeOf(from).toEqualTypeOf<Period | undefined>();
      expectTypeOf(to).toEqualTypeOf<Period | undefined>();
      return [];
    },
  });
});

test("filter callbacks receive defined values when a default is provided", () => {
  defineFilterGroup({
    route: "/music/{-$breakdown}",
    parameter: "period",
    defaultValue: "overall",
    types: (from, to) => {
      expectTypeOf(from).toEqualTypeOf<Period>();
      expectTypeOf(to).toEqualTypeOf<Period>();
      return [];
    },
  });
});

test("an explicitly undefined default preserves optional callback values", () => {
  defineFilterGroup({
    route: "/projects",
    parameter: "type",
    defaultValue: undefined,
    types: (from, to) => {
      expectTypeOf(from).toEqualTypeOf<ProjectKind | undefined>();
      expectTypeOf(to).toEqualTypeOf<ProjectKind | undefined>();
      return [];
    },
  });
});

test("filter defaults must belong to the selected route parameter", () => {
  defineFilterGroup({
    route: "/music/{-$breakdown}",
    parameter: "period",
    // @ts-expect-error A project kind is not a valid Music period default.
    defaultValue: "project",
    types: () => [],
  });
});

test("defaults do not narrow callbacks to only the fallback literal", () => {
  defineFilterGroup({
    route: "/music/{-$breakdown}",
    parameter: "period",
    // @ts-expect-error The narrow callback prevents the defaulted overload from matching.
    defaultValue: "overall",
    // @ts-expect-error Other validated periods can still reach the callback.
    types: (from: "overall", to: "overall") => [from, to],
  });
});

test("callback annotations cannot widen or replace the route's search output", () => {
  const group = defineFilterGroup({
    route: "/projects",
    parameter: "type",
    // @ts-expect-error The route's search validator does not produce numbers.
    types: (from: number, to: number) => [String(from + to)],
  });

  expectTypeOf(group.getTypes).returns.toEqualTypeOf<Array<string> | undefined>();
});

test("filter parameters must belong to the selected route", () => {
  const group = defineFilterGroup({
    route: "/projects",
    // @ts-expect-error The projects route has no period search parameter.
    parameter: "period",
    types: () => [],
  });
  expectTypeOf(group.getTypes).returns.toEqualTypeOf<Array<string> | undefined>();
});

test("filter routes must exist in the application's route tree", () => {
  const group = defineFilterGroup({
    // @ts-expect-error This pattern is not a registered route.
    route: "/missing",
    // @ts-expect-error An unregistered route has no known search parameters.
    parameter: "period",
    types: () => [],
  });
  expectTypeOf(group.getTypes).returns.toEqualTypeOf<Array<string> | undefined>();
});
