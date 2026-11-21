import { expect } from "#test/e2e";

import { PreferencesTab } from "./tab.e2e.model";

export class OtherTab extends PreferencesTab {
  tabName = "Other";

  get densityButtons() {
    return this.tabPanel.getByRole("toolbar", { name: "Density" });
  }

  get densitySelect() {
    return this.tabPanel.getByRole("combobox", { name: "Density" });
  }

  get hapticsSwitch() {
    return this.tabPanel.getByRole("switch", { name: "Haptic feedback" });
  }

  async setDensity(value: "Small" | "Medium" | "Large") {
    if (await this.densitySelect.isVisible()) {
      await this.densitySelect.click();
      await this.tabPanel
        .getByRole("listbox", { name: "Density" })
        .getByRole("option", { name: value, exact: true })
        .click();
      await expect(this.densitySelect).toHaveAccessibleDescription(value);
    } else {
      const button = this.densityButtons.getByRole("button", { name: value, exact: true });
      await button.click();
      await expect(button).toHaveAttribute("aria-pressed", "true");
    }
  }

  async expectDensity(value: "Small" | "Medium" | "Large") {
    if (await this.densitySelect.isVisible()) {
      await expect(this.densitySelect).toHaveAccessibleDescription(value);
    } else {
      await expect(
        this.densityButtons.getByRole("button", { name: value, exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
    }
  }

  async setHaptics(enabled: boolean) {
    await this.hapticsSwitch.setChecked(enabled);
    await expect(this.hapticsSwitch).toBeChecked({ checked: enabled });
  }
}
