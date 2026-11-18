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
          "The tab bar spans the full dialog or bottom-sheet surface while panel contents stay padded. Panels share the height of the tallest panel without a fixed height; inactive panels remain invisible and unavailable to keyboard and assistive technology. A persistent content wrapper keeps native transition captures valid while the active panel changes. Panel changes use element-scoped transitions with the same directional slide, fade, and spring timing as route tabs, reversing direction in RTL. Reduced motion and browsers without element-scoped transitions switch immediately. Desktop dialogs and mobile bottom sheets use opaque surfaces so floating select labels blend into their backgrounds. Syntax controls and the code preview sit directly on the dialog surface, using the same spacing as Theme settings. The preview is capped at 12rem and scrolls independently; keyboard users can focus its named region to scroll through the full snippet. Haptic feedback uses a plain full-row label rather than a list surface. Theme icons retain their original, unrotated font glyphs in both layouts. Select chevrons spring between open and closed states, changing direction immediately for reduced motion.",
        component:
          "Primary tabs group preferences into Theme (theme, contrast, and palette), Syntax (light and dark syntax palettes and a code preview), and Other (haptic feedback). The active tab uses local state, starts on Theme, and stays selected while the mounted dialog is closed and reopened; it does not navigate or change the URL. Arrow keys and Home/End select and focus tabs. At viewport widths up to 37.5rem (600px), appearance preferences use outlined SelectMenus; larger viewports use connected button groups. Syntax uses two SelectMenus with a High contrast note for Nosferatu. The preview follows the active page theme, defaulting to Alucard in light mode and Dracula Pro in dark mode. Other shows a haptic feedback switch when supported, otherwise an explanatory message. Preferences save immediately and persist across tab changes. Done, Escape, and backdrop dismissal close without reverting saved changes. Keep the component mounted and synchronize open through onClose. In Storybook, preference changes update globals; the app saves them through cookie-backed providers.",
      },
    },
  },
});

export const Default = meta.story({});

export const Syntax = meta.story({
  play: async ({ canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("tab", { name: "Syntax" }));
    await waitFor(() => expect(body.getByRole("tabpanel", { name: "Syntax" })).toBeVisible());
    await expect(body.getByRole("combobox", { name: "Light theme" })).toBeVisible();
    await expect(body.getByRole("combobox", { name: "Dark theme" })).toBeVisible();
    const syntaxPreview = within(body.getByRole("region", { name: "Syntax preview" }));
    await expect(syntaxPreview.getByText("class", { exact: true })).toBeVisible();
  },
});

export const HapticsOff = meta.story({
  globals: { haptics: "off" },
  play: async ({ canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(body.getByRole("tab", { name: "Other" }));
    await waitFor(() => expect(body.getByRole("tabpanel", { name: "Other" })).toBeVisible());
  },
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
    await userEvent.click(dialog.getByRole("tab", { name: "Syntax" }));
    await waitFor(() =>
      expect(dialog.getByRole("combobox", { name: "Light theme" })).toBeVisible(),
    );
    await userEvent.keyboard("{ArrowRight}");
    await expect(dialog.getByRole("tab", { name: "Other" })).toHaveFocus();
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
