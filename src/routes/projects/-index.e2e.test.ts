import { createTest, expect } from "#test/e2e";

import { HistoryAdapterPage, ProjectsPage } from "./-index.e2e.model";

const test = createTest({ projects: ProjectsPage, historyAdapter: HistoryAdapterPage });

test.beforeEach(async ({ projects, fontsLoaded }) => {
  await projects.goto();
  await fontsLoaded();
});

test("filters the project list and updates the URL", async ({ projects }) => {
  await projects.filterBy("Packages");

  await expect.locator(projects.projectLink("History Adapter")).toBeVisible();
  await expect.locator(projects.projectLink("eskimojo")).not.toBeVisible();
});

test("opens a project detail and returns to the listing", async ({ projects, historyAdapter }) => {
  await projects.filterBy("Packages");
  await projects.openProject("History Adapter");
  await expect.locator(historyAdapter.heading).toBeVisible();

  await historyAdapter.goBackToProjects();
  await expect.locator(projects.filterGroup).toBeVisible();
});

test("loads a project detail directly from its URL", async ({ historyAdapter }) => {
  await historyAdapter.goto();

  await expect.locator(historyAdapter.heading).toBeVisible();
});
