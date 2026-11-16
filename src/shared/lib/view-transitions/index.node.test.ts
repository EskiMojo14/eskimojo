import { createRootRoute, createRoute, createRouter } from "@tanstack/react-router";
import * as v from "valibot";
import { expect, test } from "vite-plus/test";

import { gigBreakdownSchema } from "#/routes/gigs.{-$breakdown}/-constants";
import {
  musicBreakdownSchema,
  musicTypeSchema,
  periodSchema,
} from "#/routes/music.{-$breakdown}/-constants";
import { projectKindSchema } from "#/routes/projects/-schema";

import { defineFilterGroup } from "./factories";
import { addNavigationTransitions, createNavigationTransitionTypes } from "./index";

const root = createRootRoute();
const router = createRouter({
  routeTree: root.addChildren(
    [
      "/",
      "/projects",
      "/projects/$slug",
      "/music/{-$breakdown}/{-$type}",
      "/gigs/{-$breakdown}",
    ].map((path) =>
      createRoute({
        getParentRoute: () => root,
        path,
        validateSearch:
          path === "/projects"
            ? v.object({ type: v.optional(projectKindSchema) })
            : path === "/music/{-$breakdown}/{-$type}"
              ? v.object({ period: v.optional(periodSchema) })
              : undefined,
        params: {
          parse: (params: Record<string, string>) => ({
            ...params,
            ...(path === "/music/{-$breakdown}/{-$type}"
              ? {
                  breakdown: v.parse(v.optional(musicBreakdownSchema), params.breakdown),
                  type: v.parse(v.optional(musicTypeSchema), params.type),
                }
              : path === "/gigs/{-$breakdown}"
                ? { breakdown: v.parse(v.optional(gigBreakdownSchema), params.breakdown) }
                : {}),
          }),
        },
      }),
    ),
  ),
});
const getNavigationTransitionTypes = createNavigationTransitionTypes(router.matchRoutes);

test("filter callbacks receive effective defaults in both navigation directions", () => {
  const group = defineFilterGroup({
    route: "/music/{-$breakdown}/{-$type}",
    parameter: "period",
    defaultValue: "overall",
    types: (from, to) => [`${from}:${to}`],
  });
  const absent = router.matchRoutes("/music", {}).at(-1);
  const explicitDefault = router.matchRoutes("/music", { period: "overall" }).at(-1);
  const selected = router.matchRoutes("/music", { period: "7day" }).at(-1);
  if (!absent || !explicitDefault || !selected) throw new Error("Expected Music route matches");

  expect(group.getTypes(absent, selected)).toEqual(["overall:7day"]);
  expect(group.getTypes(selected, absent)).toEqual(["7day:overall"]);
  expect(group.getTypes(absent, explicitDefault)).toBeUndefined();
  expect(group.getTypes(explicitDefault, absent)).toBeUndefined();
});

test("filters reuse inherited function validators and their defaults", () => {
  const parent = createRootRoute({
    validateSearch: (search: Record<string, unknown>) => ({
      type: search.type === "project" ? "project" : "package",
    }),
  });
  const inheritedRouter = createRouter({
    routeTree: parent.addChildren([
      createRoute({ getParentRoute: () => parent, path: "/projects" }),
    ]),
  });
  const selectTypes = createNavigationTransitionTypes(inheritedRouter.matchRoutes);
  expect(
    selectTypes({
      fromLocation: location("/projects"),
      toLocation: location("/projects?type=package"),
    }),
  ).toEqual([]);
  expect(
    selectTypes({
      fromLocation: location("/projects?type=invalid"),
      toLocation: location("/projects?type=project"),
    }),
  ).toEqual([]);
});
test("installing navigation transitions preserves the router's existing options", () => {
  const { context, history, routeTree, defaultPreload } = router.options;
  addNavigationTransitions(router);
  expect(router.options.context).toBe(context);
  expect(router.options.history).toBe(history);
  expect(router.options.routeTree).toBe(routeTree);
  expect(router.options.defaultPreload).toBe(defaultPreload);
  const transition = router.options.defaultViewTransition;
  if (typeof transition !== "object" || typeof transition.types !== "function") {
    throw new Error("Expected a navigation transition selector");
  }
  expect(
    transition.types({
      fromLocation: location("/projects"),
      toLocation: location("/projects/example"),
      pathChanged: true,
      hrefChanged: true,
      hashChanged: false,
    }),
  ).toEqual(["project"]);
});

function location(href: string) {
  const url = new URL(href, "https://example.test");
  return {
    href,
    pathname: url.pathname,
    search: Object.fromEntries(url.searchParams),
    searchStr: url.search,
    hash: url.hash.slice(1),
    state: { __TSR_index: 0, __TSR_key: "test", key: "test" },
    publicHref: href,
    external: false,
  };
}

test.each([
  ["/", "/projects", ["page-forward"]],
  ["/music/recent", "/gigs/by-city", ["page-forward"]],
  ["/gigs/by-city", "/projects", ["page-backward"]],
  ["/projects/example", "/music", ["page-forward"]],
  ["/projects/", "/projects/example", ["project"]],
  ["/projects/example/", "/projects?type=package", ["project"]],
  ["/projects/one", "/projects/two", []],
  ["/projects", "/projects/example/nested", []],
  ["/projects/example/nested", "/projects", []],
  ["/projects", "/projects-archive/example", []],
  ["/music/recent/nested/missing", "/music", []],
  ["/unknown", "/music/recent", []],
  ["/music/recent/", "/music/top/tracks/", ["tab-backward"]],
  ["/projects?type=package", "/projects/example?ref=list#details", ["project"]],
  ["/music", "/music/recent", ["tab-forward"]],
  ["/music/top/tracks", "/music/top/artists", ["tab-forward", "music-type"]],
  ["/music/top/albums", "/music/top/artists", ["tab-forward", "music-type"]],
  ["/music/top/artists", "/music/top/albums", ["tab-backward", "music-type"]],
  ["/music/top/albums", "/music/top/tracks", ["tab-backward", "music-type"]],
  ["/music/top/albums?period=7day", "/music/top/albums?period=overall", ["music-period"]],
  ["/music/top/artists", "/music/top/tracks", ["tab-backward", "music-type"]],
  [
    "/music/top/tracks?period=7day",
    "/music/top/artists?period=1month",
    ["tab-forward", "music-type"],
  ],
  ["/music/top/artists", "/music/recent", ["tab-forward"]],
  ["/music/top/artists?period=7day", "/music/top/artists?period=overall", ["music-period"]],
  ["/music/top/artists", "/music/top/artists#details", []],
  ["/music/recent", "/music/top/tracks", ["tab-backward"]],
  ["/gigs", "/gigs/by-city", ["tab-forward"]],
  ["/gigs/by-city", "/gigs/by-artist", ["tab-backward"]],
  ["/gigs/by-month", "/gigs", false],
  ["/gigs/", "/gigs/by-month", false],
  ["/gigs/by-artist", "/gigs/by-venue", ["tab-forward"]],
  ["/gigs/by-venue", "/gigs/by-month", ["tab-backward"]],
  ["/music/recent?period=7day", "/music/top/tracks?period=1month", ["tab-backward"]],
  ["/music/top/tracks?period=7day", "/music/top/tracks?period=overall", ["music-period"]],
  ["/music/recent", "/music/recent?period=1month", ["music-period"]],
  ["/music/top/tracks?period=7day", "/music/recent?period=overall", ["tab-forward"]],
  ["/music/top/tracks", "/music/top/tracks?period=overall", []],
  ["/music/top/tracks?period=invalid", "/music/top/tracks?period=overall", []],
  ["/music/top/tracks?period=invalid", "/music/top/tracks?period=7day", ["music-period"]],
  ["/music?period=7day", "/gigs?period=1month", ["page-forward"]],
  ["/projects/?type=package", "/projects/", ["project-filter", "project-filter-all"]],
  ["/projects/example?type=project", "/projects/example?type=package", []],
  ["/projects", "/projects?type=project", ["project-filter", "project-filter-project"]],
  ["/projects", "/projects?type=package", ["project-filter", "project-filter-package"]],
  ["/projects", "/projects?type=contribution", ["project-filter", "project-filter-contribution"]],
  ["/projects?type=package", "/projects", ["project-filter", "project-filter-all"]],
  ["/projects?type=project", "/projects?type=package", []],
  ["/projects", "/projects?type=invalid", []],
  ["/projects?type=invalid", "/projects?type=package", []],
  ["/projects", "/projects", false],
  ["/projects", "/projects#intro", []],
  ["/unknown", "/projects", []],
] satisfies Array<[string, string, Array<string> | false]>)(
  "selects transition types for %s → %s",
  (from, to, expected) => {
    expect(
      getNavigationTransitionTypes({
        fromLocation: location(from),
        toLocation: location(to),
      }),
    ).toEqual(expected);
  },
);

test("initial navigation uses a generic transition", () => {
  expect(
    getNavigationTransitionTypes({
      toLocation: location("/projects"),
    }),
  ).toEqual([]);
});
