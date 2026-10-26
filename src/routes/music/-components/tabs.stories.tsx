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
import { musicBreakdownSchema } from "#/routes/music/-constants";

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
          "Responsive primary route links, matching the gigs breakdown tabs. /music defaults to Recent; top-artists and top-tracks use optional URL segments. Links replace history and preserve the period search parameter.",
      },
    },
  },
});

export const Navigation = meta.story({
  render: () => <MusicTabsDemo />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("link", { name: "Recent" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await userEvent.click(canvas.getByRole("link", { name: "Top artists" }));
    await expect(canvas.getByRole("link", { name: "Top artists" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(canvas.getByRole("link", { name: "Top tracks" })).toHaveAttribute(
      "href",
      "/music/top-tracks?period=1month",
    );
    await userEvent.click(canvas.getByRole("link", { name: "Recent" }));
    await expect(canvas.getByRole("link", { name: "Recent" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
});

export const DeepLink = meta.story({
  render: () => <MusicTabsDemo initialEntry="/music/top-tracks?period=7day" />,
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Top tracks" })).toHaveAttribute(
      "aria-current",
      "page",
    );
  },
});
