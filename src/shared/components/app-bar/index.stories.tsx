import { createFileRoute } from "@tanstack/react-router";
import { expect, fn, waitFor, within } from "storybook/test";

import preview from "#.storybook/preview";
import { Route as GigsRoute } from "#/routes/gigs.{-$breakdown}/index.tsx";
import { Route as HomeRoute } from "#/routes/index";

import { AppBar } from "./index";

const meta = preview.meta({
  title: "Components/AppBar",
  component: AppBar,
  args: {
    navigationOpen: false,
    onOpenNavigation: fn(),
  },
  parameters: {
    layout: "fullscreen",
    tanstack: { router: { route: HomeRoute } },
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "MD3 large flexible top app bar: a 64px navigation/actions row above a display-small title, with a 120px minimum total height. An optional staticData.subtitle uses title-medium typography and increases the minimum height to 152px. Both title and subtitle can wrap and grow the bar rather than being clipped. Both come from the deepest matched route with a staticData title, selected with useMatches; subtitles are not inherited independently. The leading navigation icon is visible only on small screens. Preferences opens independently of the navigation drawer and returns focus to its trigger when dismissed. The bar scrolls with the page; scroll-driven collapse is not enabled.",
      },
    },
  },
});

export const Default = meta.story({
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Home", { exact: true })).toBeVisible();
  },
});

export const Gigs = meta.story({
  parameters: { tanstack: { router: { route: GigsRoute } } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Gigs", { exact: true })).toBeVisible();
  },
});

export const WithSubtitle = meta.story({
  parameters: {
    tanstack: {
      router: {
        route: createFileRoute("/")({
          staticData: { title: "Home", subtitle: "Projects, music, and other interests" },
        }),
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Home", { exact: true })).toBeVisible();
    await expect(canvas.getByText("Projects, music, and other interests")).toBeVisible();
  },
});

export const OpenPreferences = meta.story({
  play: async ({ canvas, canvasElement, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "Preferences" });
    await userEvent.click(trigger);
    const body = within(canvasElement.ownerDocument.body);
    const dialog = body.getByRole("dialog", { name: "Preferences" });
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(body.getAllByRole("dialog")).toHaveLength(1);
    await userEvent.click(within(dialog).getByRole("button", { name: "Done" }));
    await waitFor(() => expect(dialog).not.toBeVisible());
    await expect(trigger).toHaveFocus();
  },
});
