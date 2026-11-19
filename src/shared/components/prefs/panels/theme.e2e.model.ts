import { expect } from "#test/e2e";

import { PreferencesTab } from "./tab.e2e.model";

type ThemePreferenceName = "Theme" | "Contrast" | "Palette";

export class ThemeTab extends PreferencesTab {
  tabName = "Theme";

  async setPreference(name: ThemePreferenceName, option: string) {
    const select = this.tabPanel.getByRole("combobox", { name, exact: true });

    if (await select.isVisible()) {
      await select.click();
      await this.tabPanel
        .getByRole("listbox", { name })
        .getByRole("option", { name: option, exact: true })
        .click();
    } else {
      await this.tabPanel
        .getByRole("toolbar", { name })
        .getByRole("button", { name: option, exact: true })
        .click();
    }
  }

  async expectSelected(name: ThemePreferenceName, option: string) {
    const select = this.tabPanel.getByRole("combobox", { name, exact: true });

    if (await select.isVisible()) {
      await expect(select).toHaveAccessibleDescription(option);
    } else {
      await expect(
        this.tabPanel
          .getByRole("toolbar", { name })
          .getByRole("button", { name: option, exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
    }
  }
}
