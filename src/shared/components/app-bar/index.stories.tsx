import { expect, fn, waitFor, within } from "storybook/test";

import preview from "#.storybook/preview";

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
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "MD3 small top app bar with a 64px minimum height, title-large typography, and a trailing Preferences icon button. The leading navigation icon is visible only on small screens. Preferences opens independently of the navigation drawer and returns focus to its trigger when dismissed.",
      },
    },
  },
});

export const Default = meta.story({});

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
