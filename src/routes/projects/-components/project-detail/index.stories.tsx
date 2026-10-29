import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import { getProject } from "#/routes/projects/-data";

import { ProjectDetail } from "./index";

import "./index.css";

const meta = preview.meta({
  title: "Projects/Project Detail",
  component: ProjectDetail,
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
  },
});

export const Default = meta.story({
  args: {
    project: getProject("history-adapter"),
    children: (
      <>
        <h2>The full story</h2>
        <p>An example detailed project description.</p>
      </>
    ),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "History Adapter", level: 1 })).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "The full story" })).toBeVisible();
    await expect(canvas.getByRole("link", { name: "View source" })).toHaveAttribute(
      "href",
      "https://github.com/EskiMojo14/history-adapter",
    );
  },
});
