import { expect } from "@playwright/test";
import type { Page, Locator } from "playwright";

import type { Tail } from "#/utils/types";

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
  abstract title: RegExp;
  async goto(...args: Tail<Parameters<Page["goto"]>>) {
    const response = await this.page.goto(this.url, ...args);

    await expect(this.page).toHaveTitle(this.title);

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

  get tabLink() {
    return this.parent.tabs.getByRole("tab", { name: this.tabName });
  }

  get tabPanel() {
    return this.page.getByRole("tabpanel", { name: this.tabName, includeHidden: true });
  }

  async select() {
    await this.tabLink.click();
    await expect(this.page).toHaveURL((url) => this.matchesUrl(url));
    await expect(this.tabLink).toHaveAttribute("aria-selected", "true");
    await expect(this.tabPanel).toBeVisible();
  }
}
