import { expect } from "#test/e2e";

import { PreferencesTab } from "./tab.e2e.model";

type SyntaxPreferenceName = "Light theme" | "Dark theme";

export class CodeTab extends PreferencesTab {
  tabName = "Code";

  syntaxSelect(name: SyntaxPreferenceName) {
    return this.tabPanel.getByRole("combobox", { name, exact: true });
  }

  async setPreference(name: SyntaxPreferenceName, option: string) {
    await this.syntaxSelect(name).click();
    await this.tabPanel
      .getByRole("listbox", { name, exact: true })
      .getByRole("option", { name: option, exact: true })
      .click();
  }

  async expectSelected(name: SyntaxPreferenceName, option: string) {
    await expect(this.syntaxSelect(name)).toHaveAccessibleDescription(option);
  }
}
