import { useState } from "react";
import { expect, waitFor, within } from "storybook/test";

import preview from "#.storybook/preview";
import { Button } from "#/shared/components/buttons/button";
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
        story:
          "Desktop dialogs and mobile bottom sheets use opaque surfaces so floating select labels blend into their backgrounds. Theme icons retain their original, unrotated font glyphs in both layouts. Select chevrons spring between open and closed states, changing direction immediately for reduced motion.",
        component:
          "Theme, contrast, and palette preferences using the existing preference contexts. At viewport widths up to 37.5rem (600px), each preference uses an MD3 outlined SelectMenu with a floating label, icons in the selection and options, and a themed, anchored listbox. Larger viewports use connected button groups with icons. Both layouts share the same selections and save changes immediately. Select menus support arrows, Home/End, type-ahead, Enter/Space to select, and Escape to dismiss without changing the value or closing the dialog. System follows the operating system for theme and contrast. Done, Escape, and backdrop dismissal close without reverting saved changes. Keep the component mounted and synchronize open through onClose. In Storybook, changes update the existing Theme, Contrast, and Palette globals; the app saves them through its cookie-backed providers.",
      },
    },
  },
});

export const Default = meta.story({});

export const BottomSheet = meta.story({
  parameters: {
    viewport: {
      options: {
        bottomSheet: {
          name: "Bottom sheet",
          styles: { width: "390px", height: "844px" },
        },
      },
    },
    docs: {
      description: {
        story:
          "On mobile, preferences open as a spring-animated bottom sheet using surface-container-high to match desktop dialogs, including the floating select-label backgrounds. A matching surface extension below the sheet keeps the viewport bottom solid during spring overshoot without changing the content height.",
      },
    },
  },
  globals: { viewport: { value: "bottomSheet", isRotated: false } },
});

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
