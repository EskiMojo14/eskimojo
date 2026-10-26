import { useState } from "react";
import { beforeEach, expect, test } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { AppBar } from "#/shared/components/app-bar";
import { Sidebar } from "#/shared/components/sidebar";
import {
  themeSchema,
  themeLabels,
  contrastSchema,
  contrastLabels,
  paletteSchema,
  paletteLabels,
} from "#/shared/constants/prefs";

import { PreferencesDialog } from "./dialog";

beforeEach(async () => {
  await page.viewport(1280, 800);
});

test.each([320, 390, 600])("mobile dropdowns fit and save preferences at %i px", async (width) => {
  await page.viewport(width, 568);
  const result = await page.renderWithProviders(<NavigationLayout />, {
    preferences: { theme: "dark", contrast: "high", palette: "arctic" },
  });
  const trigger = result.getByRole("button", { name: "Preferences" });
  await trigger.click();
  const dialog = result.getByRole("dialog", { name: "Preferences" });
  await expect.element(dialog.getByRole("button", { name: "Done" })).not.toBeInTheDocument();
  await expect.poll(() => dialog.element().getBoundingClientRect().bottom).toBeCloseTo(568, 0);
  const dialogBounds = dialog.element().getBoundingClientRect();
  expect(dialogBounds.left).toBe(0);
  expect(dialogBounds.right).toBe(width);
  const theme = dialog.getByRole("combobox", { name: "Theme" });
  const contrast = dialog.getByRole("combobox", { name: "Contrast" });
  const palette = dialog.getByRole("combobox", { name: "Palette" });
  await expect.element(theme).toHaveAccessibleDescription("Dark");
  await expect.element(contrast).toHaveAccessibleDescription("High");
  await expect.element(palette).toHaveAccessibleDescription("Arctic");

  for (const name of ["Theme", "Contrast", "Palette"]) {
    const select = dialog.getByRole("combobox", { name });
    await expect.element(select).toBeVisible();
    await expect
      .poll(() => select.element().getBoundingClientRect().height)
      .toBeGreaterThanOrEqual(48);
    const bounds = select.element().getBoundingClientRect();
    expect(bounds.left).toBeGreaterThanOrEqual(0);
    expect(bounds.right).toBeLessThanOrEqual(width);
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
  const dialogElement = dialog.element();
  dialogElement.style.setProperty("--md-sys-motion-spring-default-spatial-duration", "317ms");
  const visibleTop = dialogElement.getBoundingClientRect().top;
  await userEvent.keyboard("{Escape}");
  await expect.poll(() => dialogElement.getBoundingClientRect().top).toBeGreaterThan(visibleTop);
  await expect.element(trigger).toHaveFocus();
  await trigger.click();
  await expect.element(theme).toHaveAccessibleDescription("Dark");
  await expect.element(contrast).toHaveAccessibleDescription("High");
  await expect.element(palette).toHaveAccessibleDescription("Arctic");

  await theme.click();
  await page.viewport(601, 800);
  await expect.element(dialog.getByRole("listbox")).not.toBeInTheDocument();
  await expect.element(dialog.getByRole("combobox")).not.toBeInTheDocument();
  for (const name of ["Dark", "High", "Arctic"]) {
    await expect
      .element(dialog.getByRole("button", { name }))
      .toHaveAttribute("aria-pressed", "true");
  }
  await page.viewport(width, 568);
  await expect.element(theme).toHaveAccessibleDescription("Dark");
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

test.each([{ width: 1280, height: 800 }])(
  "app bar opens only preferences at $width px, keeps changes, and reopens",
  async (viewport) => {
    await page.viewport(viewport.width, viewport.height);
    const result = await page.renderWithProviders(<NavigationLayout />);
    const trigger = result.getByRole("button", { name: "Preferences" });
    await trigger.click();
    const dialog = result.getByRole("dialog", { name: "Preferences" });
    await expect.element(dialog).toBeVisible();
    expect(document.querySelectorAll("dialog:modal")).toHaveLength(1);
    expect(
      document.querySelector('dialog[aria-label="Primary navigation"]')?.matches(":modal"),
    ).toBe(false);
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
  },
);

test("arrows only move focus; Space selects; Escape keeps changes", async () => {
  const result = await page.renderWithProviders(<NavigationLayout />);
  const trigger = result.getByRole("button", { name: "Preferences" });
  await trigger.click();
  const dialog = result.getByRole("dialog", { name: "Preferences" });
  const theme = dialog.getByRole("toolbar", { name: "Theme" });
  await theme.getByRole("button", { name: "System" }).click();
  await userEvent.keyboard("{ArrowRight}");
  const light = theme.getByRole("button", { name: "Light" });
  await expect.element(light).toHaveFocus();
  await expect.element(light).toHaveAttribute("aria-pressed", "false");
  await userEvent.keyboard(" ");
  await expect.element(light).toHaveAttribute("aria-pressed", "true");
  const dialogElement = dialog.element();
  await userEvent.keyboard("{Escape}");
  await expect.element(dialogElement).not.toBeVisible();
  await trigger.click();
  await expect.element(light).toHaveAttribute("aria-pressed", "true");
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
