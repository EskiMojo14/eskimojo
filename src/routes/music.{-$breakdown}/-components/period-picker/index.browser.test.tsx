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
      <div className="tabs__route-content">
        <MusicPeriodPicker />
        <div className="music-top-music">Results for {period}</div>
      </div>
    </>
  );
}

function expectTabMotion(distance: number) {
  const effects = document
    .getAnimations()
    .map((animation) => animation.effect)
    .filter((effect): effect is KeyframeEffect => effect instanceof KeyframeEffect);
  expect(effects.some((effect) => effect.pseudoElement?.includes("(root)"))).toBe(false);

  const incoming = effects.filter(
    (effect) => effect.pseudoElement === "::view-transition-new(tab-content)",
  );
  const outgoing = effects.filter(
    (effect) => effect.pseudoElement === "::view-transition-old(tab-content)",
  );
  expect(incoming.map((effect) => effect.getKeyframes()[0])).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ translate: `${distance}px` }),
      expect.objectContaining({ opacity: "0" }),
    ]),
  );
  expect(outgoing.map((effect) => effect.getKeyframes().at(-1))).toEqual(
    expect.arrayContaining([
      expect.objectContaining({ translate: `${-distance}px` }),
      expect.objectContaining({ opacity: "0" }),
    ]),
  );
}

test.each(["ltr", "rtl"])(
  "period changes only crossfade results and tabs slide 24px in both directions (%s)",
  async (direction) => {
    const previousDirection = document.documentElement.dir;
    document.documentElement.dir = direction;
    onTestFinished(() => {
      document.documentElement.dir = previousDirection;
    });
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
    using startTransition = vi.spyOn(document, "startViewTransition");
    try {
      await allTime.click();
      await expect.element(allTime).toHaveAttribute("aria-current", "page");
      await expect.poll(() => startTransition.mock.results.length).toBe(1);

      const transitionResult = startTransition.mock.results[0];
      if (transitionResult?.type !== "return") throw new Error("Expected a native view transition");
      const transition = transitionResult.value;
      await transition.ready;
      expect(startTransition.mock.calls[0]?.[0]).toMatchObject({ types: ["music-period"] });
      await expect.element(result.getByText("Results for overall")).toBeVisible();
      const snapshotTargets = document
        .getAnimations()
        .flatMap((animation) =>
          animation.effect instanceof KeyframeEffect && animation.effect.pseudoElement
            ? [animation.effect.pseudoElement]
            : [],
        );
      expect(snapshotTargets).toContain("::view-transition-new(music-results)");
      expect(snapshotTargets.some((target) => target.includes("(root)"))).toBe(false);
      expect(
        allTime
          .element()
          .getAnimations({ subtree: true })
          .some((animation) => animation instanceof CSSTransition),
      ).toBe(true);
      await transition.finished;

      await result.getByRole("link", { name: "Recently played" }).click();
      await expect.poll(() => router.state.location.pathname).toBe("/music/recent");
      await expect.poll(() => startTransition.mock.results.length).toBe(2);
      expect(startTransition.mock.calls[1]?.[0]).toMatchObject({ types: ["tab-forward"] });
      const tabTransition = startTransition.mock.results[1];
      if (tabTransition?.type !== "return") throw new Error("Expected a tab view transition");
      await tabTransition.value.ready;
      await expect
        .element(result.getByRole("link", { name: "Recently played" }))
        .toHaveAttribute("aria-current", "page");
      expectTabMotion(direction === "rtl" ? -24 : 24);
      await tabTransition.value.finished;

      await result.getByRole("link", { name: "Top music" }).click();
      await expect.poll(() => startTransition.mock.results.length).toBe(3);
      expect(startTransition.mock.calls[2]?.[0]).toMatchObject({ types: ["tab-backward"] });
      const backwards = startTransition.mock.results[2];
      if (backwards?.type !== "return") throw new Error("Expected a backwards tab transition");
      await backwards.value.ready;
      await expect
        .element(result.getByRole("link", { name: "Top music" }))
        .toHaveAttribute("aria-current", "page");
      expectTabMotion(direction === "rtl" ? 24 : -24);
    } finally {
      for (const entry of startTransition.mock.results) {
        if (entry.type === "return") await entry.value.finished;
      }
    }
  },
);
