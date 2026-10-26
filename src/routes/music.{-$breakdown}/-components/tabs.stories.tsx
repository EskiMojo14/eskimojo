import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { useState } from "react";
import { expect } from "storybook/test";
import * as v from "valibot";

import preview from "#.storybook/preview";
import { musicBreakdownSchema } from "#/routes/music.{-$breakdown}/-constants.ts";

import { MusicBreakdownTabs } from "./tabs";

function MusicTabsDemo({ initialEntry = "/music?period=1month" }: { initialEntry?: string }) {
  const [router] = useState(() => {
    const root = createRootRoute();
    const music = createRoute({
      getParentRoute: () => root,
      path: "/music/{-$breakdown}/",
      params: { parse: v.parser(v.object({ breakdown: v.optional(musicBreakdownSchema) })) },
      validateSearch: v.object({ period: v.optional(v.string()) }),
      component: MusicBreakdownTabs,
    });
    return createRouter({
      routeTree: root.addChildren([music]),
      history: createMemoryHistory({ initialEntries: [initialEntry] }),
    });
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
          "Responsive primary route links. /music defaults to Top music, combining tracks and artists for one listening period. /music/top-music selects it explicitly; /music/recent shows Recently played. Links replace history and preserve the period search parameter.",
      },
    },
  },
});

export const Navigation = meta.story({
  render: () => <MusicTabsDemo />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("link", { name: "Top music" })).toHaveAttribute(
      "aria-current",
      "page",
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
    await userEvent.click(canvas.getByRole("link", { name: "Top music" }));
    await expect(canvas.getByRole("link", { name: "Top music" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
});

export const DeepLink = meta.story({
  render: () => <MusicTabsDemo initialEntry="/music/top-music?period=7day" />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Top music" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
});
