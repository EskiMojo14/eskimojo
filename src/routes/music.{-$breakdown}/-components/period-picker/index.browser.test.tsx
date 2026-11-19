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
import { expect, test } from "vite-plus/test";
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
import { observeViewTransitions } from "#test/browser/view-transition.test-utils";

import { MusicPeriodPicker } from "./index";

import "#/routes/music.{-$breakdown}/index.css";

const musicRoute = getRouteApi("/music/{-$breakdown}/{-$type}");

const topMusicPanels = {
  tracks: <MusicTopMusic tracks={[]} />,
  albums: <MusicTopMusic albums={[]} />,
  artists: <MusicTopMusic artists={[]} />,
};

function Demo() {
  const { period = periodSchema.fallback } = musicRoute.useSearch();
  const { type = musicTypeSchema.fallback } = musicRoute.useParams();
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
          {value === "top" ? (
            <>
              <MusicPeriodPicker />
              <div>Results for {period}</div>
              <MusicTopMusicTabs />
              {topMusicPanels[type]}
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
        path: "/music/{-$breakdown}/{-$type}",
        params: {
          parse: v.parser(
            v.object({
              breakdown: v.optional(musicBreakdownSchema),
              type: v.optional(musicTypeSchema),
            }),
          ),
        },
        validateSearch: v.object({ period: v.optional(periodSchema) }),
        component: Demo,
      }),
      createRoute({ getParentRoute: () => root, path: "/", component: Home }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/music/top/tracks?period=1month"] }),
  });

  addNavigationTransitions(router);
  const result = await page.renderWithProviders(<RouterProvider router={router} />);
  const allTime = result.getByRole("link", { name: "All time" });
  await expect.element(allTime).toBeVisible();
  await expect.poll(() => router.state.status).toBe("idle");

  for (const animation of document.getAnimations()) animation.finish();
  const transitions = observeViewTransitions();
  using startTransition = transitions.spy;

  try {
    const periodTransition = transitions.next();
    await allTime.click();
    await expect.element(allTime).toHaveAttribute("aria-current", "page");
    const transition = await periodTransition;
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

    const recentTracksTransition = transitions.next();
    await result.getByRole("tab", { name: "Recently played" }).click();
    await expect.poll(() => router.state.location.pathname).toBe("/music/recent");
    const tabTransition = await recentTracksTransition;
    expect(startTransition.mock.calls[1]?.[0]).toMatchObject({ types: ["tab-forward"] });
    await tabTransition.ready;
    expect(
      transitionKeyframes("::view-transition-new(tab-content)").some(
        (frame) => frame.translate !== undefined,
      ),
    ).toBe(true);
    await expect
      .element(result.getByRole("tab", { name: "Recently played" }))
      .toHaveAttribute("aria-current", "page");
    await tabTransition.finished;

    const topMusicTransition = transitions.next();
    await result.getByRole("tab", { name: "Top music" }).click();
    const backwards = await topMusicTransition;
    expect(startTransition.mock.calls[2]?.[0]).toMatchObject({ types: ["tab-backward"] });
    await backwards.ready;
    await expect
      .element(result.getByRole("tab", { name: "Top music" }))
      .toHaveAttribute("aria-current", "page");
    await backwards.finished;

    const albumsTransition = transitions.next();
    await result.getByRole("tab", { name: "Albums", exact: true }).click();
    const albums = await albumsTransition;
    expect(startTransition.mock.calls[3]?.[0]).toMatchObject({
      types: ["tab-forward", "music-type"],
    });
    await albums.ready;
    expect(
      transitionKeyframes("::view-transition-new(tab-content)").some(
        (frame) => frame.translate !== undefined,
      ),
    ).toBe(true);
    await albums.finished;
    await expect
      .element(result.getByRole("tabpanel", { name: "Albums", exact: true }))
      .toBeVisible();

    const tracksTransition = transitions.next();
    await result.getByRole("tab", { name: "Tracks", exact: true }).click();
    const tracks = await tracksTransition;
    expect(startTransition.mock.calls[4]?.[0]).toMatchObject({
      types: ["tab-backward", "music-type"],
    });
    await tracks.ready;
    expect(
      transitionKeyframes("::view-transition-new(tab-content)").some(
        (frame) => frame.translate !== undefined,
      ),
    ).toBe(true);
    await tracks.finished;

    const homeTransition = transitions.next();
    await result.getByRole("link", { name: "Home", exact: true }).click();
    const home = await homeTransition;
    await home.ready;
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
    await home.finished;
  } finally {
    for (const entry of startTransition.mock.results) {
      if (entry.type === "return") await entry.value.finished;
    }
  }
});
