import { ComponentObjectModel } from "#test/e2e";

export class SnackbarModel extends ComponentObjectModel {
  notifications = this.page.getByRole("region", { name: "Notifications" });
  dismissButton = this.notifications.getByRole("button", { name: "Dismiss notification" });

  async dismiss() {
    await this.dismissButton.click();
  }
}
