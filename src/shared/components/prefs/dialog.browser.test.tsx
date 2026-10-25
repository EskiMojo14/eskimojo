import { useState } from "react";
import { expect, test } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { Sidebar } from "#/shared/components/sidebar";
import { themeSchema, themeLabels, contrastSchema, contrastLabels } from "#/shared/constants/prefs";

import { PreferencesDialog } from "./dialog";

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

test.each([
  { width: 390, height: 844 },
  { width: 1280, height: 800 },
])("app bar opens only preferences at $width px, keeps changes, and reopens", async (viewport) => {
  await page.viewport(viewport.width, viewport.height);
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
  await page.viewport(390, 844);
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
import { AppBar } from "#/shared/components/app-bar";
