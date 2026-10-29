import { createFileRoute } from "@tanstack/react-router";
import { expect, fn, waitFor, within } from "storybook/test";

import preview from "#.storybook/preview";
import { Route as HomeRoute } from "#/routes/_home";
import { Route as GigsRoute } from "#/routes/gigs.{-$breakdown}/index.tsx";

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
          "An MD3 large flexible top app bar places a 64px action row above a display-small title, with a 120px minimum total height. An optional staticData.subtitle uses title-medium typography and increases the minimum height to 152px. Below 37.5rem, four labelled destinations appear in a fixed 80px bottom navigation bar with safe-area padding, replacing the menu button. Preferences stays at the top. From 37.5rem through 48rem, the menu opens the artwork modal drawer; above 48rem the drawer is persistent. The app shell reserves space beneath content and the footer only for compact bottom navigation. Both title and subtitle can wrap and come from the deepest matched route with a staticData title. Preferences opens independently of navigation and returns focus to its trigger when dismissed. Its original settings glyph spring-rotates 30 degrees on hover or keyboard focus and 60 degrees while open, remaining static for reduced motion.",
      },
    },
  },
});

export const Default = meta.story({
  play: async ({ canvas }) => {
    await expect(
      within(canvas.getByRole("banner")).getByText("Home", { exact: true }),
    ).toBeVisible();
  },
});

export const WithBackLink = meta.story({
  parameters: {
    tanstack: {
      router: {
        route: createFileRoute("/_home/")({
          staticData: {
            title: "Projects",
            backLink: {
              to: "/projects",
              label: "Back to projects",
              viewTransition: { types: ["project"] },
            },
          },
        }),
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Back to projects" })).toHaveAttribute(
      "href",
      "/projects",
    );
    await expect(canvas.queryByRole("button", { name: "Open navigation menu" })).toBeNull();
    await expect(canvas.getByRole("button", { name: "Preferences" })).toBeVisible();
  },
});

export const MobileBottomBar = meta.story({
  parameters: {
    viewport: {
      options: {
        mobileBar: {
          name: "Mobile bottom navigation",
          styles: { width: "390px", height: "844px" },
        },
      },
    },
    docs: {
      description: {
        story:
          "Below 37.5rem, Home, Projects, Music and Gigs stay visible in an opaque, shadow-free 80px surface-container-high bottom navigation bar. The whole destination is tappable, with an unbounded ripple clipped to the 64px by 32px icon pill even when pressing its label. Enter provides the same unbounded feedback; reduced motion uses a static pressed layer. The current destination has a secondary-container indicator and a filled icon. Moving right through destinations slides incoming page content from the right; moving left reverses it, following reading direction in RTL. The app bar title and subtitle slide and fade together in sync with page content, while Preferences stays stationary. Navigation has a stationary snapshot above the content so scrolling pages cannot cover the bar during transitions. The 24px slide uses spatial springs and fading uses effects springs; reduced motion disables both. Safe-area padding, reserved footer space and scroll padding keep content accessible. Preferences remains at the top; the menu is hidden. Medium screens retain the artwork modal drawer, and desktop retains its persistent drawer.",
      },
    },
  },
  globals: { viewport: { value: "mobileBar", isRotated: false } },
  play: async ({ canvas }) => {
    const navigation = within(canvas.getByRole("navigation", { name: "Primary" }));
    await expect(navigation.getAllByRole("link")).toHaveLength(4);
    await expect(navigation.getByRole("link", { name: /^Home$/ })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await expect(canvas.getByRole("button", { name: "Preferences" })).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Open navigation menu" }),
    ).not.toBeInTheDocument();
  },
});

export const MediumScreen = meta.story({
  parameters: {
    viewport: {
      options: {
        medium: { name: "Medium screen", styles: { width: "700px", height: "844px" } },
      },
    },
  },
  globals: { viewport: { value: "medium", isRotated: false } },
  play: async ({ canvas, userEvent, args }) => {
    await expect(canvas.queryByRole("navigation", { name: "Primary" })).not.toBeInTheDocument();
    await userEvent.click(canvas.getByRole("button", { name: "Open navigation menu" }));
    await expect(args.onOpenNavigation).toHaveBeenCalled();
  },
});

export const Gigs = meta.story({
  parameters: { tanstack: { router: { route: GigsRoute } } },
  play: async ({ canvas }) => {
    await expect(
      within(canvas.getByRole("banner")).getByText("Gigs", { exact: true }),
    ).toBeVisible();
  },
});

export const WithSubtitle = meta.story({
  parameters: {
    tanstack: {
      router: {
        route: createFileRoute("/_home/")({
          staticData: { title: "Home", subtitle: "Projects, music, and other interests" },
        }),
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(
      within(canvas.getByRole("banner")).getByText("Home", { exact: true }),
    ).toBeVisible();
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
