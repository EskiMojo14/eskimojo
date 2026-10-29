import { expect, waitFor } from "storybook/test";

import preview from "#.storybook/preview";

import { roles } from "./constants";
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
          "Full-width homepage banner with centered, size-capped Mitzi artwork on its matching purple background. Descriptors rotate every four seconds, with pause/resume and next-role controls. A tertiary progress underline smoothly resizes to match the current phrase. Skipping seeks the text and underline together, including while paused. Reduced motion shows the complete static sentence and no animation controls. Screen readers always receive the complete sentence without repeated announcements.",
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
      "I'm a web developer, an open source contributor, a Redux maintainer, a musician, an Overwatch casual, and a cat dad.",
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
    await userEvent.keyboard("{Enter}");
    await userEvent.tab();
    const next = canvas.getByRole("button", { name: "Next role" });
    await expect(next).toHaveFocus();
    const visibleRole = () =>
      roles.find((role) => canvas.getByText(`${role}.`).checkVisibility({ opacityProperty: true }));
    await userEvent.keyboard("{Enter}");
    const first = visibleRole();
    await expect(first).toBeDefined();
    const firstIndex = roles.findIndex((role) => role === first);
    for (let step = 1; step <= roles.length; step++) {
      await userEvent.keyboard(" ");
      await waitFor(() => expect(visibleRole()).toBe(roles[(firstIndex + step) % roles.length]));
    }
    await expect(canvas.getByRole("button", { name: "Resume role animation" })).toBeVisible();
    await expect(next).toHaveFocus();
  },
});

export const DarkTheme = meta.story({
  globals: { theme: "dark" },
});
