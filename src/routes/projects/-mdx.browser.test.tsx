import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { ProjectDetail } from "#/routes/projects/-components/project-detail";

import { getProject } from "./-data";
import { getProjectContent } from "./-mdx";

test("renders a project's real MDX body and frontmatter links", async () => {
  const project = getProject("keycaplendar");
  const Content = getProjectContent(project.filePath);
  await Content.preload?.();
  const result = await page.renderWithProviders(
    <ProjectDetail project={project}>
      <Content />
    </ProjectDetail>,
  );
  await expect
    .element(result.getByRole("heading", { name: "Keycaplendar", level: 1 }))
    .toBeVisible();
  await expect
    .element(result.getByRole("heading", { name: "A place for the details" }))
    .toBeVisible();
  await expect
    .element(result.getByRole("link", { name: "View source" }))
    .toHaveAttribute("href", "https://github.com/EskiMojo14/keycaplendar");
});

test("rejects unknown projects instead of loading an unrelated description", () => {
  expect(() => getProject("not-a-project")).toThrow(expect.objectContaining({ isNotFound: true }));
  expect(() => getProjectContent("not-a-project.mdx")).toThrow(
    'No project description found for "not-a-project.mdx".',
  );
});
