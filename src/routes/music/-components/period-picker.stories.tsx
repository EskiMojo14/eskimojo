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
import { periodSchema } from "#/routes/music/-query";

import { MusicPeriodPicker } from "./period-picker";

import "./recent-tracks.css";

function createDemoRouter() {
  const root = createRootRoute();
  return createRouter({
    routeTree: root.addChildren([
      createRoute({
        getParentRoute: () => root,
        path: "/music/{-$breakdown}/",
        validateSearch: v.object({ period: v.optional(periodSchema) }),
        component: MusicPeriodPicker,
      }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/music/top-artists?period=1month"] }),
  });
}

function Demo() {
  const [router] = useState(createDemoRouter);
  return <RouterProvider router={router} />;
}

const meta = preview.meta({
  title: "Music/Period Picker",
  component: MusicPeriodPicker,
  parameters: { layout: "padded", a11y: { test: "error" } },
});

export const Selection = meta.story({
  render: () => <Demo />,
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("link", { name: "30 days" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await userEvent.click(canvas.getByRole("link", { name: "All time" }));
    await expect(canvas.getByRole("link", { name: "All time" })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(canvas.getByRole("link", { name: "30 days" })).not.toHaveAttribute("aria-current");
  },
});
