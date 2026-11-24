import type { ProjectKind } from "#/routes/projects/-schema";
import { expect, PageObjectModel } from "#test/e2e";

import * as copy from "./-copy";

export class ProjectsPage extends PageObjectModel {
  url = "/projects";
  title = PageObjectModel.regexp.startsWith(copy.meta.title);

  get filterGroup() {
    return this.page.getByRole("group", { name: copy.filters.title });
  }

  filterLink(kind: ProjectKind) {
    return this.filterGroup.getByRole("link", { name: copy.filters.kind[kind].label, exact: true });
  }

  projectLink(title: string) {
    return this.page.getByRole("main", { name: copy.meta.title }).getByRole("link", {
      name: title,
      exact: true,
    });
  }

  async filterBy(kind: ProjectKind) {
    const link = this.filterLink(kind);
    await link.click();
    await expect(this.page).toHaveURL((url) => url.searchParams.get("type") === kind);
    await expect(link).toHaveAttribute("aria-current", "page");
  }

  async openProject(title: string) {
    await this.projectLink(title).click();
  }
}

export class HistoryAdapterPage extends PageObjectModel {
  url = "/projects/history-adapter";
  title = PageObjectModel.regexp.startsWith("History Adapter");

  get heading() {
    return this.page.getByRole("heading", { name: this.title, level: 1 });
  }

  get backLink() {
    return this.page.getByRole("link", { name: copy.detailsMeta.backLinkLabel });
  }

  async goBackToProjects() {
    await this.backLink.click();
  }
}
