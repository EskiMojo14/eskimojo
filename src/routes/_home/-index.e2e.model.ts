import { PageObjectModel } from "#test/e2e";

export class HomePage extends PageObjectModel {
  url = "/";
  title = "Home";

  socialLink(name: string) {
    return this.main.getByRole("link", { name });
  }
}
