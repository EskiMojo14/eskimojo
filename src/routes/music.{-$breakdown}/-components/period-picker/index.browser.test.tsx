import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  getRouteApi,
  Link,
  RouterProvider,
} from "@tanstack/react-router";
import * as v from "valibot";
import { expect, test, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { MusicBreakdownTabs } from "#/routes/music.{-$breakdown}/-components/tabs";
import {
  MusicTopMusic,
  MusicTopMusicTabs,
} from "#/routes/music.{-$breakdown}/-components/top-music";
import { musicBreakdownSchema, musicTypeSchema } from "#/routes/music.{-$breakdown}/-constants";
import { periodSchema } from "#/routes/music.{-$breakdown}/-query";
import { TabLinkPanel } from "#/shared/components/tabs";
import { addNavigationTransitions } from "#/shared/lib/view-transitions";

import { MusicPeriodPicker } from "./index";

import "#/routes/music.{-$breakdown}/index.css";

const musicRoute = getRouteApi("/music/{-$breakdown}/");

function Demo() {
  const { period = periodSchema.fallback, type } = musicRoute.useSearch();
  const { breakdown = musicBreakdownSchema.fallback } = musicRoute.useParams();
  return (
    <>
      <MusicBreakdownTabs />
      {musicBreakdownSchema.options.map((value) => (
        <TabLinkPanel
          key={value}
          id={`music-${value}-panel`}
          tabId={`music-${value}-tab`}
          hidden={value !== breakdown}
          className="music-panel tabs__route-content"
        >
          {value === "top-music" ? (
            <>
              <MusicPeriodPicker />
              <div>Results for {period}</div>
              <MusicTopMusicTabs />
              <MusicTopMusic tracks={[]} artists={[]} type={type} />
            </>
          ) : (
            <p>Recently played tracks.</p>
          )}
        </TabLinkPanel>
      ))}
      <Link to="/">Home</Link>
    </>
  );
}

function Home() {
  return <h1>Home</h1>;
}

function transitionKeyframes(pseudoElement: string) {
  return document
    .getAnimations()
    .flatMap(({ effect }) =>
      effect instanceof KeyframeEffect && effect.pseudoElement === pseudoElement
        ? effect.getKeyframes()
        : [],
    );
}

test("both tab levels slide while period and other navigation crossfade", async () => {
  const root = createRootRoute();
  const router = createRouter({
    routeTree: root.addChildren([
      createRoute({
        getParentRoute: () => root,
        path: "/music/{-$breakdown}/",
        validateSearch: v.object({
          period: v.optional(periodSchema),
          type: v.optional(musicTypeSchema, musicTypeSchema.fallback),
        }),
        component: Demo,
      }),
      createRoute({ getParentRoute: () => root, path: "/", component: Home }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/music/top-music?period=1month"] }),
  });
  addNavigationTransitions(router);
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
    expect(
      transitionKeyframes("::view-transition-new(music-results)").some(
        (frame) => frame.opacity !== undefined,
      ),
    ).toBe(true);
    expect(
      transitionKeyframes("::view-transition-new(music-results)").some(
        (frame) => frame.translate !== undefined,
      ),
    ).toBe(false);
    await expect.element(result.getByText("Results for overall")).toBeVisible();
    await transition.finished;

    await result.getByRole("tab", { name: "Recently played" }).click();
    await expect.poll(() => router.state.location.pathname).toBe("/music/recent");
    await expect.poll(() => startTransition.mock.results.length).toBe(2);
    expect(startTransition.mock.calls[1]?.[0]).toMatchObject({ types: ["tab-forward"] });
    const tabTransition = startTransition.mock.results[1];
    if (tabTransition?.type !== "return") throw new Error("Expected a tab view transition");
    await tabTransition.value.ready;
    expect(
      transitionKeyframes("::view-transition-new(tab-content)").some(
        (frame) => frame.translate !== undefined,
      ),
    ).toBe(true);
    await expect
      .element(result.getByRole("tab", { name: "Recently played" }))
      .toHaveAttribute("aria-current", "page");
    await tabTransition.value.finished;

    await result.getByRole("tab", { name: "Top music" }).click();
    await expect.poll(() => startTransition.mock.results.length).toBe(3);
    expect(startTransition.mock.calls[2]?.[0]).toMatchObject({ types: ["tab-backward"] });
    const backwards = startTransition.mock.results[2];
    if (backwards?.type !== "return") throw new Error("Expected a backwards tab transition");
    await backwards.value.ready;
    await expect
      .element(result.getByRole("tab", { name: "Top music" }))
      .toHaveAttribute("aria-current", "page");
    await backwards.value.finished;

    await result.getByRole("tab", { name: "Artists", exact: true }).click();
    await expect.poll(() => startTransition.mock.results.length).toBe(4);
    expect(startTransition.mock.calls[3]?.[0]).toMatchObject({
      types: ["tab-forward", "music-type"],
    });
    const artists = startTransition.mock.results[3];
    if (artists?.type !== "return") throw new Error("Expected an artist tab transition");
    await artists.value.ready;
    expect(
      transitionKeyframes("::view-transition-new(tab-content)").some(
        (frame) => frame.translate !== undefined,
      ),
    ).toBe(true);
    await artists.value.finished;
    await expect
      .element(result.getByRole("tabpanel", { name: "Artists", exact: true }))
      .toBeVisible();

    await result.getByRole("tab", { name: "Tracks", exact: true }).click();
    await expect.poll(() => startTransition.mock.results.length).toBe(5);
    expect(startTransition.mock.calls[4]?.[0]).toMatchObject({
      types: ["tab-backward", "music-type"],
    });
    const tracks = startTransition.mock.results[4];
    if (tracks?.type !== "return") throw new Error("Expected a track tab transition");
    await tracks.value.ready;
    expect(
      transitionKeyframes("::view-transition-new(tab-content)").some(
        (frame) => frame.translate !== undefined,
      ),
    ).toBe(true);
    await tracks.value.finished;

    await result.getByRole("link", { name: "Home", exact: true }).click();
    await expect.poll(() => startTransition.mock.results.length).toBe(6);
    const home = startTransition.mock.results[5];
    if (home?.type !== "return") throw new Error("Expected a page transition");
    await home.value.ready;
    expect(
      transitionKeyframes("::view-transition-old(music-results)").some(
        (frame) => frame.opacity !== undefined,
      ),
    ).toBe(true);
    expect(
      transitionKeyframes("::view-transition-old(music-results)").some(
        (frame) => frame.translate !== undefined,
      ),
    ).toBe(false);
    await home.value.finished;
  } finally {
    for (const entry of startTransition.mock.results) {
      if (entry.type === "return") await entry.value.finished;
    }
  }
});
