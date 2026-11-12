import { ComponentObjectModel, expect } from "#test/e2e";

export class PreferencesDialogModel extends ComponentObjectModel {
  dialog = this.page.getByRole("dialog", { name: "Preferences" });
  trigger = this.page.getByRole("button", { name: "Preferences" });

  async open() {
    await this.trigger.click();
    await expect(this.dialog).toBeVisible();
  }

  async select(name: string, option: string) {
    const select = this.dialog.getByRole("combobox", { name });
    if (await select.isVisible()) {
      await select.click();
      await this.dialog
        .getByRole("listbox", { name })
        .getByRole("option", { name: option, exact: true })
        .click();
    } else {
      await this.dialog
        .getByRole("toolbar", { name })
        .getByRole("button", { name: option, exact: true })
        .click();
    }
  }

  async expectSelected(name: string, option: string) {
    const select = this.dialog.getByRole("combobox", { name });
    if (await select.isVisible()) {
      await expect(select).toHaveAccessibleDescription(option);
    } else {
      await expect(
        this.dialog
          .getByRole("toolbar", { name })
          .getByRole("button", { name: option, exact: true }),
      ).toHaveAttribute("aria-pressed", "true");
    }
  }
}
