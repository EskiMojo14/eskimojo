import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import { getProject } from "#/routes/projects/-data";

import { ProjectCard } from "./index";

import "./index.css";

const meta = preview.meta({
  title: "Projects/Project Card",
  component: ProjectCard,
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
  },
});

export const Default = meta.story({
  args: { project: getProject("keycaplendar") },
  play: async ({ canvas, userEvent }) => {
    const link = canvas.getByRole("link", { name: "Keycaplendar" });
    await expect(link).toHaveAttribute("href", "/projects/keycaplendar");
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await expect(canvas.getByRole("link", { name: "View source" })).toHaveAttribute(
      "href",
      "https://github.com/EskiMojo14/keycaplendar",
    );
  },
});
