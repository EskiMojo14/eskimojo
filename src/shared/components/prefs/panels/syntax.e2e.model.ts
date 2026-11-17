import { expect } from "#test/e2e";

import { PreferencesTab } from "./tab.e2e.model";

export class SyntaxTab extends PreferencesTab {
  tabName = "Syntax";

  get syntaxSelect() {
    return this.tabPanel.getByRole("combobox", { name: "Syntax", exact: true });
  }

  get matchLightSwitch() {
    return this.tabPanel.getByRole("switch", { name: "Match light theme" });
  }

  async setSyntax(option: string) {
    await this.syntaxSelect.click();
    await this.tabPanel
      .getByRole("listbox", { name: "Syntax" })
      .getByRole("option", { name: option, exact: true })
      .click();
  }

  async expectSelected(option: string) {
    await expect(this.syntaxSelect).toHaveAccessibleDescription(option);
  }

  async setMatchLight(enabled: boolean) {
    await this.matchLightSwitch.setChecked(enabled);
    await expect(this.matchLightSwitch).toBeChecked({ checked: enabled });
  }
}
