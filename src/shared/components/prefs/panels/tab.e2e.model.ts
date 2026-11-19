import type { PreferencesDialogModel } from "#/shared/components/prefs/dialog.e2e.model";
import { TabObjectModel } from "#test/e2e";

export abstract class PreferencesTab extends TabObjectModel<PreferencesDialogModel> {
  override get tabPanel() {
    return this.parent.dialog.getByRole("tabpanel", {
      name: this.tabName,
      exact: true,
    });
  }
}
