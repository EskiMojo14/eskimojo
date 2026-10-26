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
          "MD3 large flexible top app bar: a 64px navigation/actions row above a display-small title, with a 120px minimum total height. An optional staticData.subtitle uses title-medium typography and increases the minimum height to 152px. Both title and subtitle can wrap and grow the bar rather than being clipped. Both come from the deepest matched route with a staticData title, selected with useMatches; subtitles are not inherited independently. The leading navigation icon is visible only on small screens. Preferences opens independently of the navigation drawer and returns focus to its trigger when dismissed. Its original settings glyph spring-rotates 30 degrees on hover or keyboard focus and 60 degrees while open, remaining static for reduced motion. The bar scrolls with the page; scroll-driven collapse is not enabled.",
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
  parameters: {
    docs: {
      description: {
        story:
          "CSS controls the original settings glyph's fill through --icon-fill inherited from the trigger's aria-expanded state. It uses the existing effects-spring font-variation transition and returns to an outline when dismissed.",
      },
    },
  },
  play: async ({ canvas, canvasElement, userEvent }) => {
    const trigger = canvas.getByRole("button", { name: "Preferences" });
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
    await expect(
      trigger.querySelector<HTMLElement>(".md-symbol")?.style.getPropertyValue("--icon-fill"),
    ).toBe("");
    await userEvent.click(trigger);
    const body = within(canvasElement.ownerDocument.body);
    const dialog = body.getByRole("dialog", { name: "Preferences" });
    await waitFor(() => expect(dialog).toBeVisible());
    await expect(trigger).toHaveAttribute("aria-expanded", "true");
    await expect(body.getAllByRole("dialog")).toHaveLength(1);
    await userEvent.click(within(dialog).getByRole("button", { name: "Done" }));
    await waitFor(() => expect(dialog).not.toBeVisible());
    await expect(trigger).toHaveFocus();
    await expect(trigger).toHaveAttribute("aria-expanded", "false");
  },
});
