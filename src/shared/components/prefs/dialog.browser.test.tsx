import { useState } from "react";
import { beforeEach, expect, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import { WebHaptics } from "web-haptics";

import { AppBar } from "#/shared/components/app-bar";
import { Sidebar } from "#/shared/components/sidebar";
import {
  themeSchema,
  themeLabels,
  contrastSchema,
  contrastLabels,
  paletteSchema,
  paletteLabels,
  syntaxSchema,
  syntaxLabels,
} from "#/shared/constants/prefs";

import { PreferencesDialog } from "./dialog";

beforeEach(async () => {
  await page.viewport(1280, 800);
});

test("mobile dropdowns save preferences", async () => {
  await page.viewport(390, 568);
  const result = await page.renderWithProviders(<NavigationLayout />, {
    preferences: { theme: "dark", contrast: "high", palette: "arctic" },
  });
  const trigger = result.getByRole("button", { name: "Preferences" });
  await trigger.click();
  const dialog = result.getByRole("dialog", { name: "Preferences" });
  await expect.element(dialog.getByRole("button", { name: "Done" })).not.toBeInTheDocument();
  const theme = dialog.getByRole("combobox", { name: "Theme" });
  const contrast = dialog.getByRole("combobox", { name: "Contrast" });
  const palette = dialog.getByRole("combobox", { name: "Palette" });
  const syntax = dialog.getByRole("combobox", { name: "Syntax" });
  await expect.element(theme).toHaveAccessibleDescription("Dark");
  await expect.element(contrast).toHaveAccessibleDescription("High");
  await expect.element(palette).toHaveAccessibleDescription("Arctic");
  await expect.element(syntax).toHaveAccessibleDescription("Dracula Pro");

  for (const name of ["Theme", "Contrast", "Palette", "Syntax"]) {
    await expect.element(dialog.getByRole("combobox", { name })).toBeVisible();
  }
  await expect.element(dialog.getByRole("toolbar")).not.toBeInTheDocument();
  for (const value of themeSchema.options) {
    await theme.click();
    await dialog
      .getByRole("listbox", { name: "Theme" })
      .getByRole("option", { name: themeLabels[value].label, exact: true })
      .click();
    await expect.element(theme).toHaveAccessibleDescription(themeLabels[value].label);
    await expect.element(contrast).toHaveAccessibleDescription("High");
  }
  for (const value of contrastSchema.options) {
    await contrast.click();
    await dialog
      .getByRole("listbox", { name: "Contrast" })
      .getByRole("option", { name: contrastLabels[value].label, exact: true })
      .click();
    await expect.element(contrast).toHaveAccessibleDescription(contrastLabels[value].label);
    await expect.element(theme).toHaveAccessibleDescription("Dark");
  }
  for (const value of paletteSchema.options) {
    await palette.click();
    await dialog
      .getByRole("listbox", { name: "Palette" })
      .getByRole("option", { name: paletteLabels[value].label, exact: true })
      .click();
    await expect.element(palette).toHaveAccessibleDescription(paletteLabels[value].label);
  }
  for (const value of syntaxSchema.options) {
    await syntax.click();
    await dialog
      .getByRole("listbox", { name: "Syntax" })
      .getByRole("option", { name: syntaxLabels[value], exact: true })
      .click();
    await expect.element(syntax).toHaveAccessibleDescription(syntaxLabels[value]);
  }
  await userEvent.keyboard("{Escape}");
  await expect.element(trigger).toHaveFocus();
  await trigger.click();
  await expect.element(theme).toHaveAccessibleDescription("Dark");
  await expect.element(contrast).toHaveAccessibleDescription("High");
  await expect.element(palette).toHaveAccessibleDescription("Peach");
  await expect.element(syntax).toHaveAccessibleDescription(syntaxLabels.alucard);

  await theme.click();
  await page.viewport(600, 800);
  await expect.element(dialog.getByRole("listbox")).not.toBeInTheDocument();
  for (const name of ["Theme", "Contrast", "Palette"]) {
    await expect.element(dialog.getByRole("combobox", { name })).not.toBeInTheDocument();
  }
  await expect.element(syntax).toBeVisible();
  for (const name of ["Dark", "High", "Peach"]) {
    await expect
      .element(dialog.getByRole("button", { name }))
      .toHaveAttribute("aria-pressed", "true");
  }
  await page.viewport(390, 568);
  await expect.element(theme).toHaveAccessibleDescription("Dark");
  await expect.element(syntax).toHaveAccessibleDescription(syntaxLabels.alucard);
});

test("syntax preference updates the document and remains selectable at desktop widths", async () => {
  const result = await page.renderWithProviders(<PreferencesDialog open />, {
    preferences: { syntax: "blade" },
    syncPreferencesToDocument: true,
  });
  const dialog = result.getByRole("dialog", { name: "Preferences" });
  const syntax = dialog.getByRole("combobox", { name: "Syntax" });
  await expect.element(syntax).toBeVisible();
  await expect.element(syntax).toHaveAccessibleDescription("Blade");
  await expect.element(document.documentElement).toHaveAttribute("data-syntax", "blade");

  await syntax.click();
  await dialog
    .getByRole("listbox", { name: "Syntax" })
    .getByRole("option", { name: "Buffy", exact: true })
    .click();
  await expect.element(syntax).toHaveAccessibleDescription("Buffy");
  await expect.element(document.documentElement).toHaveAttribute("data-syntax", "buffy");
});

test("Match light theme defaults on and can be toggled with pointer or keyboard", async () => {
  const result = await page.renderWithProviders(<PreferencesDialog open />, {
    syncPreferencesToDocument: true,
  });
  const dialog = result.getByRole("dialog", { name: "Preferences" });
  const toggle = dialog.getByRole("switch", { name: "Match light theme" });
  await expect.element(toggle).toBeChecked();
  await expect.element(document.documentElement).toHaveAttribute("data-match-light", "on");

  await toggle.click();
  await expect.element(toggle).not.toBeChecked();
  await expect.element(document.documentElement).toHaveAttribute("data-match-light", "off");

  toggle.element().focus();
  await userEvent.keyboard(" ");
  await expect.element(toggle).toBeChecked();
  await expect.element(document.documentElement).toHaveAttribute("data-match-light", "on");
});

test("preferences show a small syntax preview", async () => {
  const result = await page.renderWithProviders(<PreferencesDialog open />);
  const preview = result.getByRole("dialog", { name: "Preferences" }).getByRole("code");

  await expect.element(preview).toHaveTextContent('const syntax = "Dracula Pro";');
});

test("Escape dismisses the select menu before the preferences dialog", async () => {
  await page.viewport(320, 568);
  const result = await page.renderWithProviders(<NavigationLayout />);
  await result.getByRole("button", { name: "Preferences" }).click();
  const dialog = result.getByRole("dialog", { name: "Preferences" });
  const theme = dialog.getByRole("combobox", { name: "Theme" });
  await theme.click();
  await userEvent.keyboard("{End}{Escape}");
  await expect.element(theme).toHaveAttribute("aria-expanded", "false");
  await expect.element(theme).toHaveAccessibleDescription("System");
  await expect.element(theme).toHaveFocus();
  await expect.element(dialog).toBeVisible();
  await userEvent.keyboard("{Escape}");
  await expect.element(dialog).not.toBeInTheDocument();
});

function NavigationLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="app-shell__main">
        <AppBar navigationOpen={open} onOpenNavigation={() => setOpen(true)} />
      </div>
    </div>
  );
}

test("reflects existing theme, contrast, and palette preferences", async () => {
  const result = await page.renderWithProviders(<PreferencesDialog open />, {
    preferences: { theme: "dark", contrast: "high", palette: "arctic" },
  });
  const dialog = result.getByRole("dialog", { name: "Preferences" });
  await expect
    .element(dialog.getByRole("button", { name: "Arctic" }))
    .toHaveAttribute("aria-pressed", "true");
  await expect
    .element(dialog.getByRole("button", { name: "Goat" }))
    .toHaveAttribute("aria-pressed", "false");
  await expect
    .element(dialog.getByRole("button", { name: "Dark" }))
    .toHaveAttribute("aria-pressed", "true");
  await expect
    .element(dialog.getByRole("button", { name: "High" }))
    .toHaveAttribute("aria-pressed", "true");
  for (const group of ["Theme", "Contrast"]) {
    await expect
      .element(dialog.getByRole("toolbar", { name: group }).getByRole("button", { name: "System" }))
      .toHaveAttribute("aria-pressed", "false");
  }
});

test("selects every theme and contrast independently through existing contexts", async () => {
  const result = await page.renderWithProviders(<PreferencesDialog open />);
  const dialog = result.getByRole("dialog", { name: "Preferences" });
  const theme = dialog.getByRole("toolbar", { name: "Theme" });
  const contrast = dialog.getByRole("toolbar", { name: "Contrast" });
  for (const value of themeSchema.options) {
    await theme.getByRole("button", { name: themeLabels[value].label }).click();
    for (const option of themeSchema.options) {
      await expect
        .element(theme.getByRole("button", { name: themeLabels[option].label }))
        .toHaveAttribute("aria-pressed", String(value === option));
    }
    await expect
      .element(contrast.getByRole("button", { name: "System" }))
      .toHaveAttribute("aria-pressed", "true");
  }
  for (const value of contrastSchema.options) {
    await contrast.getByRole("button", { name: contrastLabels[value].label }).click();
    for (const option of contrastSchema.options) {
      await expect
        .element(contrast.getByRole("button", { name: contrastLabels[option].label }))
        .toHaveAttribute("aria-pressed", String(value === option));
    }
    await expect
      .element(theme.getByRole("button", { name: "Dark" }))
      .toHaveAttribute("aria-pressed", "true");
  }
});

test("app bar opens only preferences on desktop, keeps changes, and reopens", async () => {
  const result = await page.renderWithProviders(<NavigationLayout />);
  const trigger = result.getByRole("button", { name: "Preferences" });
  await trigger.click();
  const dialog = result.getByRole("dialog", { name: "Preferences" });
  await expect.element(dialog).toBeVisible();
  expect(document.querySelectorAll("dialog:modal")).toHaveLength(1);
  expect(document.querySelector('dialog[aria-label="Primary navigation"]')?.matches(":modal")).toBe(
    false,
  );
  await dialog.getByRole("button", { name: "Dark" }).click();
  await dialog.getByRole("button", { name: "High" }).click();
  await dialog.getByRole("button", { name: "Arctic" }).click();
  const dialogElement = dialog.element();
  await dialog.getByRole("button", { name: "Done" }).click();
  await expect.element(dialogElement).not.toBeVisible();
  await expect.element(trigger).toHaveFocus();
  await trigger.click();
  await expect
    .element(dialog.getByRole("button", { name: "Arctic" }))
    .toHaveAttribute("aria-pressed", "true");
  await expect
    .element(dialog.getByRole("button", { name: "Dark" }))
    .toHaveAttribute("aria-pressed", "true");
  await expect
    .element(dialog.getByRole("button", { name: "High" }))
    .toHaveAttribute("aria-pressed", "true");
});

test("arrows only move focus; Space selects; Escape keeps changes", async () => {
  using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();
  const result = await page.renderWithProviders(<NavigationLayout />);
  const trigger = result.getByRole("button", { name: "Preferences" });
  await trigger.click();
  const dialog = result.getByRole("dialog", { name: "Preferences" });
  const theme = dialog.getByRole("toolbar", { name: "Theme" });
  await theme.getByRole("button", { name: "System" }).click();
  expect(triggerHaptic).not.toHaveBeenCalled();
  await userEvent.keyboard("{ArrowRight}");
  const light = theme.getByRole("button", { name: "Light" });
  await expect.element(light).toHaveFocus();
  await expect.element(light).toHaveAttribute("aria-pressed", "false");
  await userEvent.keyboard(" ");
  await expect.element(light).toHaveAttribute("aria-pressed", "true");
  expect(triggerHaptic).toHaveBeenCalledExactlyOnceWith("selection", undefined);
  const dialogElement = dialog.element();
  await userEvent.keyboard("{Escape}");
  await expect.element(dialogElement).not.toBeVisible();
  await trigger.click();
  await expect.element(light).toHaveAttribute("aria-pressed", "true");
});

test.each([1280, 390])(
  "haptic feedback follows its saved preference immediately at %ipx",
  async (width) => {
    await page.viewport(width, 844);
    using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();
    const result = await page.renderWithProviders(<PreferencesDialog open />, {
      preferences: { haptics: "off" },
      syncPreferencesToDocument: true,
    });
    const dialog = result.getByRole("dialog", { name: "Preferences" });
    const toggle = dialog.getByRole("switch", { name: "Haptic feedback" });
    await expect.element(toggle).not.toBeChecked();

    async function selectTheme(name: string) {
      if (width <= 600) {
        await dialog.getByRole("combobox", { name: "Theme" }).click();
        await dialog
          .getByRole("listbox", { name: "Theme" })
          .getByRole("option", { name, exact: true })
          .click();
      } else {
        const button = dialog
          .getByRole("toolbar", { name: "Theme" })
          .getByRole("button", { name, exact: true });
        await button.click();
      }
    }

    await selectTheme("Dark");
    await expect.element(document.documentElement).toHaveAttribute("data-theme", "dark");
    expect(triggerHaptic).not.toHaveBeenCalled();
    await dialog
      .getByRole("listitem")
      .filter({ hasText: "Haptic feedback" })
      .click({ position: { x: 4, y: 28 } });
    await expect.element(toggle).toBeChecked();
    await expect.element(toggle).toHaveAccessibleName("Haptic feedback");
    expect(triggerHaptic).toHaveBeenCalledExactlyOnceWith("selection", undefined);
    await selectTheme("Light");
    await expect.element(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(triggerHaptic).toHaveBeenCalledTimes(2);
    toggle.element().focus();
    await userEvent.keyboard(" ");
    await expect.element(toggle).not.toBeChecked();
    await selectTheme("System");
    await expect.element(document.documentElement).toHaveAttribute("data-theme", "system");
    expect(triggerHaptic).toHaveBeenCalledTimes(2);
  },
);

test("unsupported browsers omit the haptics preference and keep interactions quiet", async ({
  onTestFinished,
}) => {
  const support = Object.getOwnPropertyDescriptor(WebHaptics, "isSupported");
  if (!support) throw new Error("Expected the haptics support capability.");
  Object.defineProperty(WebHaptics, "isSupported", { value: false });
  onTestFinished(() => {
    Object.defineProperty(WebHaptics, "isSupported", support);
  });
  using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();
  const result = await page.renderWithProviders(<PreferencesDialog open />);
  const dialog = result.getByRole("dialog", { name: "Preferences" });
  await expect
    .element(dialog.getByRole("switch", { name: "Haptic feedback" }))
    .not.toBeInTheDocument();
  await dialog.getByRole("button", { name: "Dark" }).click();
  await expect
    .element(dialog.getByRole("button", { name: "Dark" }))
    .toHaveAttribute("aria-pressed", "true");
  expect(triggerHaptic).not.toHaveBeenCalled();
});

test("sidebar opens a modal navigation drawer and Escape restores focus", async () => {
  await page.viewport(600, 844);
  const result = await page.renderWithProviders(<NavigationLayout />);
  const trigger = result.getByRole("button", { name: "Open navigation menu" });

  await trigger.click();
  const dialog = result.getByRole("dialog", { name: "Primary navigation" }).element();
  await expect.element(dialog).toBeVisible();
  expect(dialog.matches(":modal")).toBe(true);
  await expect
    .element(
      result
        .getByRole("dialog", { name: "Primary navigation" })
        .getByRole("button", { name: "Preferences" }),
    )
    .not.toBeInTheDocument();
  await expect.element(trigger).toHaveAttribute("aria-expanded", "true");

  await userEvent.keyboard("{Escape}");
  await expect.element(dialog).not.toBeVisible();
  await expect.element(trigger).toHaveFocus();
  await expect.element(trigger).toHaveAttribute("aria-expanded", "false");

  await result.getByRole("button", { name: "Preferences" }).click();
  await expect.element(result.getByRole("dialog", { name: "Preferences" })).toBeVisible();
  expect(document.querySelectorAll("dialog:modal")).toHaveLength(1);
});
