import { expect } from "#test/e2e";

import { PreferencesTab } from "./tab.e2e.model";

export class OtherTab extends PreferencesTab {
  tabName = "Other";

  get hapticsSwitch() {
    return this.tabPanel.getByRole("switch", { name: "Haptic feedback" });
  }

  async setHaptics(enabled: boolean) {
    await this.hapticsSwitch.setChecked(enabled);
    await expect(this.hapticsSwitch).toBeChecked({ checked: enabled });
  }
}
