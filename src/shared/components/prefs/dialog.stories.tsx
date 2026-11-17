import { useState } from "react";
import { expect, waitFor, within } from "storybook/test";

import preview from "#.storybook/preview";
import { Button } from "#/shared/components/buttons/button";
import { MdSymbol } from "#/shared/components/symbol";

import { HapticsContext, useHaptics } from "./context";
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
          "Desktop dialogs and mobile bottom sheets use opaque surfaces so floating select labels blend into their backgrounds. Syntax and Match light theme share an expressive list surface. The haptic feedback row is transparent to preserve the dialog surface while retaining its full-row click target and ripple. Theme icons retain their original, unrotated font glyphs in both layouts. Select chevrons spring between open and closed states, changing direction immediately for reduced motion.",
        component:
          "Theme, contrast, palette, syntax, Match light theme, and haptic feedback preferences using the existing preference contexts. At viewport widths up to 37.5rem (600px), appearance preferences use an MD3 outlined SelectMenu with a floating label, icons in the selection and options, and a themed, anchored listbox. Larger viewports use connected button groups with icons. Syntax uses an always-available SelectMenu, including Dracula Classic and Alucard Classic from the official Dracula specification. Syntax and Match light theme share an expressive list with a Prism-highlighted code sample that previews the active syntax palette. Match light theme and haptic feedback use whole-row native labels with leading headlines and trailing MD3 switches. Match light theme defaults on and overrides the selected syntax palette when the theme is light, whether explicit or system-driven. Haptic feedback is shown after hydration only when the Vibration API is supported; it defaults to on and turning it off silences feedback without changing interactions. Both layouts share the same selections and save changes immediately. Select menus support arrows, Home/End, type-ahead, Enter/Space to select, and Escape to dismiss without changing the value or closing the dialog. System follows the operating system for theme and contrast. Done, Escape, and backdrop dismissal close without reverting saved changes. Keep the component mounted and synchronize open through onClose. In Storybook, changes update the Theme, Contrast, Palette, Syntax, Match light theme, and Haptics globals; the app saves them through its cookie-backed providers.",
      },
    },
  },
});

export const Default = meta.story({});

export const HapticsOff = meta.story({
  globals: { haptics: "off" },
});

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
  const { haptics: initialHaptics } = useHaptics();
  const [haptics, setHaptics] = useState(initialHaptics);
  return (
    <HapticsContext value={{ haptics, setHaptics }}>
      <Button icon={<MdSymbol>settings</MdSymbol>} onClick={() => setOpen(true)}>
        Preferences
      </Button>
      <PreferencesDialog open={open} onClose={() => setOpen(false)} />
    </HapticsContext>
  );
}

export const Interactive = meta.story({
  parameters: {
    docs: {
      description: {
        story:
          "Haptics state is local to this interactive example and starts from the Haptics global. This lets pointer and keyboard toggles work in portable tests, where globals updates are not applied. Other preferences still update Storybook globals.",
      },
    },
  },
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
    const haptics = dialog.queryByRole("switch", { name: "Haptic feedback" });
    if (haptics) {
      const initiallyOn = globals.haptics !== "off";
      await expect(haptics).toHaveProperty("checked", initiallyOn);
      const row = dialog.getByText("Haptic feedback").closest("label");
      if (!row) throw new Error("Expected a native label row.");
      await userEvent.click(row);
      await waitFor(() => expect(haptics).toHaveProperty("checked", !initiallyOn));
      await userEvent.keyboard(" ");
      await waitFor(() => expect(haptics).toHaveProperty("checked", initiallyOn));
    }
    await userEvent.click(dialog.getByRole("button", { name: "Done" }));
    await waitFor(() => expect(dialogElement).not.toBeVisible());
    await expect(trigger).toHaveFocus();
  },
});
