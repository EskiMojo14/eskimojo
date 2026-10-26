import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  getRouteApi,
  RouterProvider,
} from "@tanstack/react-router";
import * as v from "valibot";
import { expect, onTestFinished, test, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { MusicBreakdownTabs } from "#/routes/music.{-$breakdown}/-components/tabs";
import { periodSchema } from "#/routes/music.{-$breakdown}/-query";

import { MusicPeriodPicker } from "./index";

import "#/routes/music.{-$breakdown}/-components/recent-tracks/index.css";

const musicRoute = getRouteApi("/music/{-$breakdown}/");

function Demo() {
  const { period } = musicRoute.useSearch();
  return (
    <>
      <MusicBreakdownTabs />
      <MusicPeriodPicker />
      <div className="music-top-music">Results for {period}</div>
    </>
  );
}

test("period changes crossfade only results while other navigation keeps its page transition", async () => {
  const root = createRootRoute();
  const router = createRouter({
    routeTree: root.addChildren([
      createRoute({
        getParentRoute: () => root,
        path: "/music/{-$breakdown}/",
        validateSearch: v.object({ period: v.optional(periodSchema) }),
        component: Demo,
      }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/music/top-music?period=1month"] }),
    defaultViewTransition: true,
  });
  const result = await page.renderWithProviders(<RouterProvider router={router} />);
  const allTime = result.getByRole("link", { name: "All time" });
  await expect.element(allTime).toBeVisible();
  await expect.poll(() => router.state.status).toBe("idle");
  for (const animation of document.getAnimations()) animation.finish();
  const startTransition = vi.spyOn(document, "startViewTransition");
  onTestFinished(async () => {
    try {
      for (const entry of startTransition.mock.results) {
        if (entry.type === "return") await entry.value.finished;
      }
    } finally {
      startTransition.mockRestore();
    }
  });
  await allTime.click();
  await expect.element(allTime).toHaveAttribute("aria-current", "page");
  await expect.poll(() => startTransition.mock.results.length).toBe(1);

  const transitionResult = startTransition.mock.results[0];
  if (transitionResult?.type !== "return") throw new Error("Expected a native view transition");
  const transition = transitionResult.value;
  await transition.ready;
  expect(getComputedStyle(document.documentElement).viewTransitionName).toBe("none");
  expect(
    getComputedStyle(result.getByText("Results for overall").element()).viewTransitionName,
  ).toBe("music-results");
  expect(
    getComputedStyle(document.documentElement, "::view-transition-new(music-results)")
      .animationName,
  ).not.toBe("none");
  expect(
    allTime
      .element()
      .getAnimations({ subtree: true })
      .some((animation) => animation instanceof CSSTransition),
  ).toBe(true);
  await transition.finished;
  expect(getComputedStyle(document.documentElement).viewTransitionName).toBe("root");

  await result.getByRole("link", { name: "Recently played" }).click();
  await expect.poll(() => router.state.location.pathname).toBe("/music/recent");
  await expect.poll(() => startTransition.mock.results.length).toBe(2);
  expect(startTransition.mock.calls[1]?.[0]).toBeTypeOf("function");
  const tabTransition = startTransition.mock.results[1];
  if (tabTransition?.type !== "return") throw new Error("Expected a tab view transition");
  await tabTransition.value.ready;
  expect(getComputedStyle(document.documentElement).viewTransitionName).toBe("root");
  expect(
    getComputedStyle(result.getByText("Results for overall").element()).viewTransitionName,
  ).toBe("none");
});
