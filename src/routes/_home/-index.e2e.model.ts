import { PageObjectModel } from "#test/e2e";

import * as copy from "./-copy";

export class HomePage extends PageObjectModel {
  url = "/";
  title = PageObjectModel.regexp.startsWith(copy.meta.title);

  socialLink(name: string) {
    return this.main.getByRole("link", { name });
  }
}
