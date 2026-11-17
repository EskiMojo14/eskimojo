import { ComponentObjectModel, expect } from "#test/e2e";

import { OtherTab } from "./panels/other.e2e.model";
import { SyntaxTab } from "./panels/syntax.e2e.model";
import { ThemeTab } from "./panels/theme.e2e.model";

export class PreferencesDialogModel extends ComponentObjectModel {
  dialog = this.page.getByRole("dialog", { name: "Preferences" });
  trigger = this.page.getByRole("button", { name: "Preferences" });
  tabs = this.dialog.getByRole("tablist", { name: "Preferences" });
  theme = new ThemeTab(this.page, this);
  syntax = new SyntaxTab(this.page, this);
  other = new OtherTab(this.page, this);

  async open() {
    await this.trigger.click();
    await expect(this.dialog).toBeVisible();
  }

  async close() {
    await this.page.keyboard.press("Escape");
    await expect(this.dialog).not.toBeVisible();
  }

  async activeThemeColors() {
    return this.page.locator('head meta[name="theme-color"]').evaluateAll((metas) =>
      metas
        .filter((meta) => {
          const media = meta.getAttribute("media");
          return !media || matchMedia(media).matches;
        })
        .map((meta) => meta.getAttribute("content")),
    );
  }

  async activeThemeColorMedia() {
    return this.page
      .locator('head meta[name="theme-color"]')
      .evaluateAll((metas) =>
        metas
          .map((meta) => meta.getAttribute("media"))
          .filter((media) => !media || matchMedia(media).matches),
      );
  }
}
