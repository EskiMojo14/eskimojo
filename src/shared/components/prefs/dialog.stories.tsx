import { useState } from "react";
import { expect, waitFor, within } from "storybook/test";

import preview from "#.storybook/preview";
import { Button } from "#/shared/components/button";
import { MdSymbol } from "#/shared/components/symbol";

import { PreferencesDialog } from "./dialog";

const meta = preview.meta({
  title: "Components/PreferencesDialog",
  component: PreferencesDialog,
  args: { open: true },
  parameters: {
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Theme, contrast, and palette preferences using connected button groups and the existing preference contexts. Each group is single-select; arrows move focus and Enter/Space select. Changes are applied through the existing setters without an Apply step. System follows the operating system for theme and contrast. Done, Escape, and backdrop dismissal close without reverting changes. Keep the component mounted and synchronize open through onClose. In Storybook, changes update the existing Theme, Contrast, and Palette globals; the app saves them through its cookie-backed providers.",
      },
    },
  },
});

export const Default = meta.story({});

function InteractivePreferences() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button icon={<MdSymbol>settings</MdSymbol>} onClick={() => setOpen(true)}>
        Preferences
      </Button>
      <PreferencesDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export const Interactive = meta.story({
  render: () => <InteractivePreferences />,
  play: async ({ canvas, canvasElement, userEvent, globals }) => {
    const trigger = canvas.getByRole("button", { name: "Preferences" });
    await userEvent.click(trigger);
    const body = within(canvasElement.ownerDocument.body);
    const dialogElement = body.getByRole("dialog", { name: "Preferences" });
    const dialog = within(dialogElement);
    const theme = within(dialog.getByRole("toolbar", { name: "Theme" }));
    const contrast = within(dialog.getByRole("toolbar", { name: "Contrast" }));
    const palette = within(dialog.getByRole("toolbar", { name: "Palette" }));
    await expect(palette.getByRole("button", { name: "Arctic" })).toHaveAttribute(
      "aria-pressed",
      String(globals.palette === "arctic"),
    );
    await expect(theme.getByRole("button", { name: "System" })).toHaveAttribute(
      "aria-pressed",
      String(globals.theme === "system"),
    );
    await expect(contrast.getByRole("button", { name: "System" })).toHaveAttribute(
      "aria-pressed",
      String(globals.contrast === "system"),
    );
    await userEvent.click(dialog.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(dialogElement).not.toBeVisible());
    await expect(trigger).toHaveFocus();
  },
});
