import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  getRouteApi,
  RouterProvider,
} from "@tanstack/react-router";
import { useMemo, type ComponentProps, type ReactNode } from "react";
import { expect, waitFor } from "storybook/test";
import * as v from "valibot";

import preview from "#.storybook/preview";
import { musicTypeSchema } from "#/routes/music.{-$breakdown}/-constants";
import { addNavigationTransitions } from "#/shared/lib/view-transitions";

import { MusicTopMusic, MusicTopMusicSkeleton, MusicTopMusicTabs } from "./index";

import "#/routes/music.{-$breakdown}/-components/recent-tracks/index.css";
import "#/routes/music.{-$breakdown}/-components/skeletons/index.css";

const musicRoute = getRouteApi("/music/{-$breakdown}/");

function TopMusicContent({
  loading = false,
  ...props
}: ComponentProps<typeof MusicTopMusic> & { loading?: boolean }) {
  const { type } = musicRoute.useSearch();
  return loading ? <MusicTopMusicSkeleton type={type} /> : <MusicTopMusic {...props} type={type} />;
}

function createDemoRouter(children: ReactNode, initialEntry: string) {
  const root = createRootRoute();
  const music = createRoute({
    getParentRoute: () => root,
    path: "/music/{-$breakdown}/",
    validateSearch: v.object({ type: v.optional(musicTypeSchema, musicTypeSchema.fallback) }),
    component: () => (
      <>
        <MusicTopMusicTabs />
        {children}
      </>
    ),
  });
  const router = createRouter({
    routeTree: root.addChildren([music]),
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
  });
  addNavigationTransitions(router);
  return router;
}

function TopMusicDemo({
  children,
  initialEntry = "/music",
}: {
  children: ReactNode;
  initialEntry?: string;
}) {
  const router = useMemo(() => createDemoRouter(children, initialEntry), [children, initialEntry]);
  return <RouterProvider router={router} />;
}

const meta = preview.meta({
  title: "Music/Top Music",
  component: MusicTopMusic,
  render: (args) => (
    <TopMusicDemo>
      <TopMusicContent {...args} />
    </TopMusicDemo>
  ),
  args: {
    tracks: [
      { name: "Lost Chapter", artist: "Pentakill", rank: 1, playcount: 290 },
      { name: "Let It Happen", artist: "Tame Impala", rank: 2, playcount: 200 },
    ],
    artists: [
      { name: "Scary Pockets", rank: 1, playcount: 4794 },
      { name: "Radiohead", rank: 2, playcount: 4000 },
    ],
  },
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Top tracks and artists for the same listening period, separated by secondary navigation links with decorative music-note and artist icons. Tracks is the default; ?type=artists opens artists directly. Arrow keys move focus; Enter or Space follows a tab link. Only the selected ranking is visible and available to keyboard and assistive-technology users. Tabs remain available while data and artwork load, and links preserve the shared period. Secondary tab changes slide the selected ranking, with direction reversed in RTL and animations disabled for reduced motion.",
      },
    },
  },
});

export const Wide = meta.story({
  parameters: {
    viewport: {
      options: {
        desktop: { name: "Desktop", styles: { width: "1200px", height: "900px" } },
      },
    },
  },
  globals: { viewport: { value: "desktop", isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    await waitFor(() => expect(canvas.getByRole("region", { name: "Top tracks" })).toBeVisible());
    await expect(canvas.queryByRole("region", { name: "Top artists" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("tab", { name: "Artists" }));
    await waitFor(() => expect(canvas.getByRole("region", { name: "Top artists" })).toBeVisible());
    await expect(canvas.queryByRole("region", { name: "Top tracks" })).not.toBeInTheDocument();
  },
});

export const Mobile = meta.story({
  parameters: {
    viewport: {
      options: {
        mobile: { name: "Mobile", styles: { width: "390px", height: "844px" } },
      },
    },
  },
  globals: { viewport: { value: "mobile", isRotated: false } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(await canvas.findByRole("tab", { name: "Tracks" }));
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getByRole("tab", { name: "Artists" })).toHaveFocus();
    await waitFor(() => expect(canvas.getByRole("region", { name: "Top tracks" })).toBeVisible());
    await userEvent.keyboard("{Enter}");
    await waitFor(() => expect(canvas.getByRole("region", { name: "Top artists" })).toBeVisible());
  },
});

export const Empty = meta.story({ args: { tracks: [], artists: [] } });

export const Artists = meta.story({
  render: (args) => (
    <TopMusicDemo initialEntry="/music?type=artists">
      <TopMusicContent {...args} />
    </TopMusicDemo>
  ),
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("tab", { name: "Artists" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    await waitFor(() => expect(canvas.getByRole("region", { name: "Top artists" })).toBeVisible());
    await expect(canvas.queryByRole("region", { name: "Top tracks" })).not.toBeInTheDocument();
  },
});

export const Loading = meta.story({
  render: (args) => (
    <TopMusicDemo>
      <TopMusicContent {...args} loading />
    </TopMusicDemo>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "The secondary tabs stay interactive while the selected ranking shows skeleton rows. Neutral placeholders pulse with staggered timing and remain static with reduced motion. One named progress element describes the combined loading state.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByRole("progressbar")).toHaveAccessibleName(
      "Loading top music...",
    );
    await expect(canvas.queryByRole("list")).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("tab", { name: "Artists" }));
    await waitFor(() => expect(canvas.getByRole("tabpanel", { name: "Artists" })).toBeVisible());
  },
});
