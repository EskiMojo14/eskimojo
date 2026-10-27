import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import { getProject } from "#/routes/projects/-data";

import { ProjectLinks } from "./index";

import "./index.css";

const meta = preview.meta({
  title: "Projects/Project Links",
  component: ProjectLinks,
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
  },
});

export const Default = meta.story({
  args: { project: getProject("schema-benchmarks") },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("list", { name: "Schema Benchmarks links" })).toBeVisible();
    await expect(canvas.getByRole("link", { name: "View source" })).toHaveAttribute(
      "href",
      "https://github.com/open-circle/schema-benchmarks",
    );
    await expect(canvas.getAllByRole("link")).toHaveLength(2);
  },
});
