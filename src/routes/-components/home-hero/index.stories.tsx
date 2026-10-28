import { expect } from "storybook/test";

import preview from "#.storybook/preview";

import { HomeHero } from "./index";

import "./index.css";

const meta = preview.meta({
  title: "Home/Hero",
  component: HomeHero,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Full-width homepage banner with centered, size-capped Mitzi artwork on its matching purple background. Descriptors rotate every three seconds, with a pause/resume control surrounded by a tertiary progress outline: a diamond when corner-shape is supported, otherwise a circle. The outline fills before each descriptor change and pauses with the text. Reduced motion shows the complete static sentence and no animation control. Screen readers always receive the complete sentence without repeated announcements.",
      },
    },
    a11y: { test: "error" },
  },
});

export const Default = meta.story({
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("heading", { name: "Hi, I'm eskimojo." })).toBeVisible();
    await expect(canvas.queryByRole("navigation")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("link")).not.toBeInTheDocument();
    const introduction = canvas.getByText(
      "I'm a web developer, an open source contributor, a Redux maintainer, a musician, an Overwatch player, and a cat dad.",
    );
    await expect(introduction).toBeInTheDocument();

    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      await expect(introduction).toBeVisible();
      await expect(canvas.queryByRole("button")).not.toBeInTheDocument();
      return;
    }

    const pause = canvas.getByRole("button", { name: "Pause role animation" });
    await userEvent.tab();
    await expect(pause).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    const resume = canvas.getByRole("button", { name: "Resume role animation" });
    await expect(resume).toBeVisible();
    await expect(resume).toHaveFocus();
    await userEvent.keyboard(" ");
    await expect(canvas.getByRole("button", { name: "Pause role animation" })).toHaveFocus();
  },
});

export const DarkTheme = meta.story({
  globals: { theme: "dark" },
});
