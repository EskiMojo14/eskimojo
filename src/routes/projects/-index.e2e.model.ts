import { expect, PageObjectModel } from "#test/e2e";

const projectFilters = {
  Projects: "project",
  Packages: "package",
  "Open-source contributions": "contribution",
} as const;

export type ProjectFilterLabel = keyof typeof projectFilters;

export class ProjectsPage extends PageObjectModel {
  url = "/projects";
  title = "Projects";

  get filterGroup() {
    return this.page.getByRole("group", { name: "Filter projects by type" });
  }

  filterLink(label: ProjectFilterLabel) {
    return this.filterGroup.getByRole("link", { name: label, exact: true });
  }

  projectLink(title: string) {
    return this.page.getByRole("main", { name: "Projects" }).getByRole("link", {
      name: title,
      exact: true,
    });
  }

  async filterBy(label: ProjectFilterLabel) {
    const link = this.filterLink(label);
    await link.click();
    await expect
      .page(this.page)
      .toHaveURL((url) => url.searchParams.get("type") === projectFilters[label]);
    await expect.locator(link).toHaveAttribute("aria-current", "page");
  }

  async openProject(title: string) {
    await this.projectLink(title).click();
  }
}

export class HistoryAdapterPage extends PageObjectModel {
  url = "/projects/history-adapter";
  title = "History Adapter";

  get heading() {
    return this.page.getByRole("heading", { name: this.title, level: 1 });
  }

  get backLink() {
    return this.page.getByRole("link", { name: "Back to projects" });
  }

  async goBackToProjects() {
    await this.backLink.click();
  }
}
