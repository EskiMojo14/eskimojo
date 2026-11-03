import type { Page, Locator } from "playwright";

import { lazy } from "#/utils";
import type { Tail } from "#/utils/types";

import { expect } from "./expect";

export abstract class ObjectModel {
  protected page: Page;

  constructor(page: Page) {
    this.page = page;
  }
}

export class ComponentObjectModel extends ObjectModel {
  main = this.page.locator("main");
  documentElement = this.page.locator("html");
}

export abstract class PageObjectModel extends ComponentObjectModel {
  abstract url: string;
  abstract title: string | RegExp;
  async goto(...args: Tail<Parameters<Page["goto"]>>) {
    const response = await this.page.goto(this.url, ...args);

    const suffixedTitle = this.title === "eskimojo" ? this.title : `${this.title} | eskimojo`;

    await expect.page(this.page).toHaveTitle(suffixedTitle);

    return response;
  }

  matchesUrl(url: URL) {
    return url.pathname === this.url;
  }
}

export abstract class TabObjectModel<
  TParent extends { tabs: Locator },
> extends ComponentObjectModel {
  parent: TParent;

  constructor(page: Page, parent: TParent) {
    super(page);
    this.parent = parent;
  }

  abstract url: string;

  matchesUrl(url: URL) {
    return url.pathname === this.url;
  }

  abstract tabName: string;

  @lazy
  get tabLink() {
    return this.parent.tabs.getByRole("tab", { name: this.tabName });
  }

  @lazy
  get tabPanel() {
    return this.page.getByRole("tabpanel", { name: this.tabName, includeHidden: true });
  }

  async select() {
    await this.tabLink.click();
    await expect.page(this.page).toHaveURL((url) => this.matchesUrl(url));
    await expect.locator(this.tabLink).toHaveAttribute("aria-selected", "true");
    await expect.locator(this.tabPanel).toBeVisible();
  }
}
