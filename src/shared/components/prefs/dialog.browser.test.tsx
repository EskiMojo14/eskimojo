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
  darkSyntaxOptions,
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
  const syntax = dialog.getByRole("combobox", { name: "Dark theme" });
  await expect.element(theme).toHaveAccessibleDescription("Dark");
  await expect.element(contrast).toHaveAccessibleDescription("High");
  await expect.element(palette).toHaveAccessibleDescription("Arctic");

  for (const name of ["Theme", "Contrast", "Palette"]) {
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
  await dialog.getByRole("tab", { name: "Code", exact: true }).click();
  await expect.element(syntax).toHaveAccessibleDescription("Dracula Pro");
  for (const value of darkSyntaxOptions.options) {
    await syntax.click();
    const option = dialog.getByRole("listbox", { name: "Dark theme" }).getByRole("option", {
      name:
        value === "nosferatu"
          ? `${syntaxLabels[value].label} High contrast`
          : syntaxLabels[value].label,
      exact: true,
    });
    await option.click();
    await expect.element(syntax).toHaveAccessibleDescription(syntaxLabels[value].label);
  }
  await userEvent.keyboard("{Escape}");
  await expect.element(trigger).toHaveFocus();
  await trigger.click();
  await expect.element(syntax).toHaveAccessibleDescription("Nosferatu");
  await dialog.getByRole("tab", { name: "Theme", exact: true }).click();
  await expect.element(theme).toHaveAccessibleDescription("Dark");
  await expect.element(contrast).toHaveAccessibleDescription("High");
  await expect.element(palette).toHaveAccessibleDescription("Peach");

  await theme.click();
  await page.viewport(600, 800);
  await expect.element(dialog.getByRole("listbox")).not.toBeInTheDocument();
  for (const name of ["Theme", "Contrast", "Palette"]) {
    await expect.element(dialog.getByRole("combobox", { name })).not.toBeInTheDocument();
  }
  await dialog.getByRole("tab", { name: "Code", exact: true }).click();
  await expect.element(syntax).toBeVisible();
  await dialog.getByRole("tab", { name: "Theme", exact: true }).click();
  for (const name of ["Dark", "High", "Peach"]) {
    await expect
      .element(dialog.getByRole("button", { name }))
      .toHaveAttribute("aria-pressed", "true");
  }
  await page.viewport(390, 568);
  await expect.element(theme).toHaveAccessibleDescription("Dark");
  await dialog.getByRole("tab", { name: "Code", exact: true }).click();
  await expect.element(syntax).toHaveAccessibleDescription("Nosferatu");
});

test.each([1280, 390])(
  "preference tabs group their controls and switch locally with pointer and keyboard at %ipx",
  async (width) => {
    await page.viewport(width, 844);
    const result = await page.renderWithProviders(<PreferencesDialog open />);
    const dialog = result.getByRole("dialog", { name: "Preferences" });
    const url = window.location.href;
    const themeTab = dialog.getByRole("tab", { name: "Theme", exact: true });
    await expect.element(themeTab).toHaveAttribute("aria-selected", "true");
    await expect.element(dialog.getByRole("tabpanel", { name: "Theme" })).toBeVisible();
    const panelHeight = dialog.getByRole("tabpanel", { name: "Theme" }).element().clientHeight;
    await expect
      .element(dialog.getByRole("combobox", { name: "Dark theme" }))
      .not.toBeInTheDocument();
    await expect
      .element(dialog.getByRole("switch", { name: "Haptic feedback" }))
      .not.toBeInTheDocument();

    await dialog.getByRole("tab", { name: "Code", exact: true }).click();
    await expect.element(dialog.getByRole("tabpanel", { name: "Code" })).toBeVisible();
    expect(dialog.getByRole("tabpanel", { name: "Code" }).element().clientHeight).toBe(panelHeight);
    await expect.element(dialog.getByRole("combobox", { name: "Dark theme" })).toBeVisible();
    await expect.element(dialog.getByRole("combobox", { name: "Light theme" })).toBeVisible();
    await expect.element(dialog.getByRole("tabpanel", { name: "Theme" })).not.toBeInTheDocument();

    await userEvent.keyboard("{ArrowRight}");
    const otherTab = dialog.getByRole("tab", { name: "Other", exact: true });
    await expect.element(otherTab).toHaveFocus();
    await expect.element(otherTab).toHaveAttribute("aria-selected", "true");
    await expect.element(dialog.getByRole("switch", { name: "Haptic feedback" })).toBeVisible();
    expect(dialog.getByRole("tabpanel", { name: "Other" }).element().clientHeight).toBe(
      panelHeight,
    );
    await userEvent.keyboard("{Home}");
    await expect.element(themeTab).toHaveFocus();
    await expect.element(dialog.getByRole("tabpanel", { name: "Theme" })).toBeVisible();
    expect(window.location.href).toBe(url);
  },
);

test.runIf("startViewTransition" in HTMLElement.prototype).each([
  { width: 1280, height: 800 },
  { width: 390, height: 568 },
])(
  "tab transitions survive layout reads and animate in the selected direction at $width x $height",
  async ({ width, height }) => {
    await page.viewport(width, height);
    const result = await page.renderWithProviders(<PreferencesDialog open />);
    const dialog = result.getByRole("dialog", { name: "Preferences" });
    const container = dialog.getByRole("tabpanel", { name: "Theme" }).element()
      .parentElement?.parentElement;
    if (!container) throw new Error("Expected a container for the preferences panels.");
    const startViewTransition = container.startViewTransition?.bind(container);
    if (!startViewTransition) throw new Error("Expected element-scoped transition support.");
    using scopedTransition = vi
      .spyOn(container, "startViewTransition")
      .mockImplementation((options) => {
        if (!options || typeof options === "function" || !options.update) {
          throw new Error("Expected transition options with an update callback.");
        }
        const update = options.update;
        return startViewTransition({
          ...options,
          update: () => {
            const updateResult = update();
            container.getBoundingClientRect();
            return updateResult;
          },
        });
      });
    using documentTransition = vi.spyOn(document, "startViewTransition");

    await dialog.getByRole("tab", { name: "Code", exact: true }).click();
    await expect.element(dialog.getByRole("tabpanel", { name: "Code" })).toBeVisible();
    expect(scopedTransition).toHaveBeenLastCalledWith(
      expect.objectContaining({ types: ["tab-forward"], update: expect.any(Function) }),
    );
    await scopedTransition.mock.results.at(-1)?.value?.ready;
    await scopedTransition.mock.results.at(-1)?.value?.finished;

    await dialog.getByRole("tab", { name: "Other", exact: true }).click();
    await expect.element(dialog.getByRole("tabpanel", { name: "Other" })).toBeVisible();
    await scopedTransition.mock.results.at(-1)?.value?.ready;
    await scopedTransition.mock.results.at(-1)?.value?.finished;

    await dialog.getByRole("tab", { name: "Theme", exact: true }).click();
    await expect.element(dialog.getByRole("tabpanel", { name: "Theme" })).toBeVisible();
    expect(scopedTransition).toHaveBeenLastCalledWith(
      expect.objectContaining({ types: ["tab-backward"], update: expect.any(Function) }),
    );
    await scopedTransition.mock.results.at(-1)?.value?.ready;
    await scopedTransition.mock.results.at(-1)?.value?.finished;
    expect(documentTransition).not.toHaveBeenCalled();
  },
);

test("tab changes still work without element-scoped transition support", async () => {
  const result = await page.renderWithProviders(<PreferencesDialog open />);
  const dialog = result.getByRole("dialog", { name: "Preferences" });
  const panels = dialog.getByRole("tabpanel", { name: "Theme" }).element()
    .parentElement?.parentElement;
  if (!panels) throw new Error("Expected a container for the preferences panels.");
  Object.defineProperty(panels, "startViewTransition", { value: undefined, configurable: true });
  using documentTransition = vi.spyOn(document, "startViewTransition");

  await dialog.getByRole("tab", { name: "Code", exact: true }).click();
  await expect.element(dialog.getByRole("tabpanel", { name: "Code" })).toBeVisible();
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(dialog.getByRole("tabpanel", { name: "Other" })).toBeVisible();
  expect(documentTransition).not.toHaveBeenCalled();
});

test.runIf("startViewTransition" in HTMLElement.prototype)(
  "reduced motion switches tabs without starting an element transition",
  async () => {
    const matchMedia = window.matchMedia.bind(window);
    using media = vi.spyOn(window, "matchMedia").mockImplementation((query) => {
      const result = matchMedia(query);
      if (query === "(prefers-reduced-motion: reduce)") {
        Object.defineProperty(result, "matches", { value: true });
      }
      return result;
    });
    const result = await page.renderWithProviders(<PreferencesDialog open />);
    const dialog = result.getByRole("dialog", { name: "Preferences" });
    const container = dialog.getByRole("tabpanel", { name: "Theme" }).element()
      .parentElement?.parentElement;
    if (!container) throw new Error("Expected a container for the preferences panels.");
    using transition = vi.spyOn(container, "startViewTransition");

    await dialog.getByRole("tab", { name: "Code", exact: true }).click();
    await expect.element(dialog.getByRole("tabpanel", { name: "Code" })).toBeVisible();
    expect(media).toHaveBeenCalledWith("(prefers-reduced-motion: reduce)");
    expect(transition).not.toHaveBeenCalled();
  },
);

test("light and dark syntax palettes can be changed independently at desktop widths", async () => {
  const result = await page.renderWithProviders(<PreferencesDialog open />, {
    syncPreferencesToDocument: true,
  });
  const dialog = result.getByRole("dialog", { name: "Preferences" });
  await dialog.getByRole("tab", { name: "Code", exact: true }).click();
  const light = dialog.getByRole("combobox", { name: "Light theme" });
  const dark = dialog.getByRole("combobox", { name: "Dark theme" });
  await expect.element(light).toHaveAccessibleDescription("Alucard");
  await expect.element(dark).toHaveAccessibleDescription("Dracula Pro");

  await light.click();
  const lightMenu = dialog.getByRole("listbox", { name: "Light theme" });
  await expect.element(lightMenu.getByRole("option")).toHaveLength(3);
  await lightMenu.getByRole("option", { name: "Alucard Classic", exact: true }).click();
  await expect.element(light).toHaveAccessibleDescription("Alucard Classic");
  await expect.element(dark).toHaveAccessibleDescription("Dracula Pro");

  await light.click();
  await dialog
    .getByRole("listbox", { name: "Light theme" })
    .getByRole("option", { name: "Utarefson High contrast (unofficial)", exact: true })
    .click();
  await expect.element(light).toHaveAccessibleDescription("Utarefson");

  dark.element().focus();
  await userEvent.keyboard("{Enter}");
  const darkMenu = dialog.getByRole("listbox", { name: "Dark theme" });
  await expect.element(darkMenu.getByRole("option", { name: /Alucard/ })).not.toBeInTheDocument();
  await userEvent.keyboard("{Home}{Enter}");
  await expect.element(dark).toHaveAccessibleDescription("Dracula Classic");
  await expect.element(light).toHaveAccessibleDescription("Utarefson");
  await expect.element(document.documentElement).toHaveAttribute("data-light-syntax", "utarefson");
  await expect
    .element(document.documentElement)
    .toHaveAttribute("data-dark-syntax", "dracula-classic");
});

test.each([1280, 390])("code preview is capped and keyboard-scrollable at %ipx", async (width) => {
  await page.viewport(width, 844);
  const result = await page.renderWithProviders(<PreferencesDialog open />);
  await result.getByRole("tab", { name: "Code", exact: true }).click();
  const dialog = result.getByRole("dialog", { name: "Preferences" });
  const preview = dialog.getByRole("region", { name: "Code preview" });
  const snippet = preview.getByRole("code");

  await expect.element(snippet).toMatchTextContent(/class Vampire/);
  await expect.element(snippet).toMatchTextContent(/weaknesses: \["Sunlight", "Garlic"\]/);
  expect(preview.element().clientHeight).toBeLessThanOrEqual(192);
  expect(preview.element().scrollHeight).toBeGreaterThan(preview.element().clientHeight);
  expect(dialog.element().scrollWidth).toBeLessThanOrEqual(dialog.element().clientWidth);

  dialog.getByRole("combobox", { name: "Dark theme" }).element().focus();
  await userEvent.keyboard("{Tab}");
  await expect.element(preview).toHaveFocus();
  await userEvent.keyboard("{End}");
  await expect
    .poll(() => preview.element().scrollTop + preview.element().clientHeight)
    .toBeGreaterThanOrEqual(preview.element().scrollHeight - 1);
});

test.each([390, 320])(
  "code preview scrolls horizontally without widening the bottom sheet at %ipx",
  async (width) => {
    await page.viewport(width, 844);
    const result = await page.renderWithProviders(<PreferencesDialog open />);
    await result.getByRole("tab", { name: "Code", exact: true }).click();
    const dialog = result.getByRole("dialog", { name: "Preferences" });
    const preview = dialog.getByRole("region", { name: "Code preview" });

    await expect.element(preview).toBeVisible();
    expect(preview.element().scrollWidth).toBeGreaterThan(preview.element().clientWidth);
    expect(dialog.element().getBoundingClientRect().width).toBeLessThanOrEqual(width);
    expect(dialog.element().scrollWidth).toBeLessThanOrEqual(dialog.element().clientWidth);
    expect(document.documentElement.scrollWidth).toBeLessThanOrEqual(width);

    dialog.getByRole("combobox", { name: "Dark theme" }).element().focus();
    await userEvent.keyboard("{Tab}{ArrowRight}");
    await expect.element(preview).toHaveFocus();
    await expect.poll(() => preview.element().scrollLeft).toBeGreaterThan(0);
  },
);

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
    await dialog.getByRole("tab", { name: "Other", exact: true }).click();
    const toggle = dialog.getByRole("switch", { name: "Haptic feedback" });
    await expect.element(toggle).not.toBeChecked();

    async function selectTheme(name: string) {
      await dialog.getByRole("tab", { name: "Theme", exact: true }).click();
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
    await dialog.getByRole("tab", { name: "Other", exact: true }).click();
    await dialog.getByText("Haptic feedback", { exact: true }).click();
    await expect.element(toggle).toBeChecked();
    await expect.element(toggle).toHaveAccessibleName("Haptic feedback");
    expect(triggerHaptic).toHaveBeenCalledExactlyOnceWith("selection", undefined);
    await selectTheme("Light");
    await expect.element(document.documentElement).toHaveAttribute("data-theme", "light");
    expect(triggerHaptic).toHaveBeenCalledTimes(3);
    await dialog.getByRole("tab", { name: "Other", exact: true }).click();
    await expect.element(toggle).toBeVisible();
    toggle.element().focus();
    await userEvent.keyboard(" ");
    await expect.element(toggle).not.toBeChecked();
    await selectTheme("System");
    await expect.element(document.documentElement).toHaveAttribute("data-theme", "system");
    expect(triggerHaptic).toHaveBeenCalledTimes(4);
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
  await dialog.getByRole("tab", { name: "Other", exact: true }).click();
  await expect
    .element(dialog.getByRole("switch", { name: "Haptic feedback" }))
    .not.toBeInTheDocument();
  await expect
    .element(dialog.getByText("Haptic feedback is not supported by this browser."))
    .toBeVisible();
  await dialog.getByRole("tab", { name: "Theme", exact: true }).click();
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
