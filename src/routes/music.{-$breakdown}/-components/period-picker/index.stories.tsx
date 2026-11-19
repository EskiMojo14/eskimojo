import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { useState } from "react";
import { expect, waitFor } from "storybook/test";
import * as v from "valibot";

import preview from "#.storybook/preview";
import { musicBreakdownSchema, musicTypeSchema } from "#/routes/music.{-$breakdown}/-constants";
import { periodSchema } from "#/routes/music.{-$breakdown}/-query.ts";

import { MusicPeriodPicker } from "./index";

import "#/routes/music.{-$breakdown}/-components/recent-tracks/index.css";

function createDemoRouter() {
  const root = createRootRoute();

  return createRouter({
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
        component: MusicPeriodPicker,
      }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/music/top/tracks?period=1month"] }),
    defaultViewTransition: true,
  });
}

function Demo() {
  const [router] = useState(createDemoRouter);

  return <RouterProvider router={router} />;
}

const meta = preview.meta({
  title: "Music/Period Picker",
  component: MusicPeriodPicker,
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Period links use the music-period view-transition type. Only the top-music results crossfade; chips and page chrome remain live so the selection animation is not frozen in a page snapshot. Tab changes use a separate directional content transition; non-tab navigation keeps the default page transition.",
      },
    },
  },
});

export const Selection = meta.story({
  render: () => <Demo />,
  play: async ({ canvas, userEvent }) => {
    await expect(await canvas.findByRole("link", { name: "30 days" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await userEvent.click(canvas.getByRole("link", { name: "All time" }));
    await waitFor(async () => {
      await expect(canvas.getByRole("link", { name: "All time" })).toHaveAttribute(
        "aria-current",
        "page",
      );
      await expect(canvas.getByRole("link", { name: "30 days" })).not.toHaveAttribute(
        "aria-current",
      );
    });
  },
});
