import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  getRouteApi,
  RouterProvider,
} from "@tanstack/react-router";
import { useState } from "react";
import { expect, waitFor } from "storybook/test";
import * as v from "valibot";

import preview from "#.storybook/preview";
import {
  musicBreakdownLabels,
  musicBreakdownSchema,
} from "#/routes/music.{-$breakdown}/-constants.ts";
import { addNavigationTransitions } from "#/shared/lib/view-transitions";

import { MusicBreakdownTabs } from "./index";

const musicRoute = getRouteApi("/music/{-$breakdown}/");

function MusicTabsContent() {
  const { breakdown: param } = musicRoute.useParams();
  const breakdown = v.parse(musicBreakdownSchema, param);
  return (
    <>
      <MusicBreakdownTabs />
      <div className="tabs__route-content">
        <h2>{musicBreakdownLabels[breakdown].label}</h2>
        <p>
          {breakdown === "recent"
            ? "Your latest listening activity."
            : "Your top tracks and artists for the selected period."}
        </p>
      </div>
    </>
  );
}

function MusicTabsDemo({ initialEntry = "/music?period=1month" }: { initialEntry?: string }) {
  const [router] = useState(() => {
    const root = createRootRoute();
    const music = createRoute({
      getParentRoute: () => root,
      path: "/music/{-$breakdown}/",
      params: { parse: v.parser(v.object({ breakdown: v.optional(musicBreakdownSchema) })) },
      validateSearch: v.object({ period: v.optional(v.string()) }),
      component: MusicTabsContent,
    });
    const demoRouter = createRouter({
      routeTree: root.addChildren([music]),
      history: createMemoryHistory({ initialEntries: [initialEntry] }),
    });
    addNavigationTransitions(demoRouter);
    return demoRouter;
  });
  return <RouterProvider router={router} />;
}

const meta = preview.meta({
  title: "Music/Tabs",
  component: MusicBreakdownTabs,
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Responsive primary route links. /music defaults to Top music, combining tracks and artists for one listening period. /music/top-music selects it explicitly; /music/recent shows Recently played. Links replace history and preserve the period search parameter. Contents crossfade with a 24px directional slide: a later tab enters from the inline end, an earlier tab from the inline start. Tabs and page chrome remain live, RTL reverses the direction, and reduced motion disables the transition.",
      },
    },
  },
});

export const Navigation = meta.story({
  render: () => <MusicTabsDemo />,
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByRole("link", { name: "Top music" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await waitFor(() =>
      expect(document.documentElement.matches(":active-view-transition")).toBe(false),
    );
    await userEvent.click(canvas.getByRole("link", { name: "Recently played" }));
    await expect(canvas.getByRole("link", { name: "Recently played" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(canvas.getByRole("link", { name: "Top music" })).toHaveAttribute(
      "href",
      "/music?period=1month",
    );
    await waitFor(() =>
      expect(document.documentElement.matches(":active-view-transition")).toBe(false),
    );
    await userEvent.click(canvas.getByRole("link", { name: "Top music" }));
    await expect(canvas.getByRole("link", { name: "Top music" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await waitFor(() =>
      expect(document.documentElement.matches(":active-view-transition")).toBe(false),
    );
  },
});

export const DeepLink = meta.story({
  render: () => <MusicTabsDemo initialEntry="/music/top-music?period=7day" />,
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("link", { name: "Top music" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await waitFor(() =>
      expect(document.documentElement.matches(":active-view-transition")).toBe(false),
    );
  },
});
