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

export const Package = meta.story({
  args: { project: getProject("history-adapter") },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "history-adapter", level: 3 })).toBeVisible();
    await expect(canvas.getByRole("link", { name: "history-adapter" })).toHaveAttribute(
      "href",
      "/projects/history-adapter",
    );
  },
});

export const ThemedLogo = meta.story({
  args: { project: getProject("schema-benchmarks") },
  globals: { theme: "light" },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('img[src="/projects/schema-benchmarks-light.png"]'),
    ).toBeVisible();
    await expect(
      canvasElement.querySelector('img[src="/projects/schema-benchmarks-dark.png"]'),
    ).not.toBeVisible();
  },
});

export const DarkLogo = meta.story({
  args: { project: getProject("mix-n-matchers") },
  globals: { theme: "dark" },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('img[src="/projects/mix-n-matchers-dark.png"]'),
    ).toBeVisible();
    await expect(
      canvasElement.querySelector('img[src="/projects/mix-n-matchers.png"]'),
    ).not.toBeVisible();
  },
});

export const WithoutLogo = meta.story({
  args: { project: getProject("rad-event-listeners") },
  play: async ({ canvasElement }) => {
    await expect(canvasElement.querySelector("img")).not.toBeInTheDocument();
  },
});

export const MaterialSymbol = meta.story({
  args: { project: getProject("event-gen") },
  play: async ({ canvas, canvasElement }) => {
    await expect(canvas.getByRole("link", { name: "Event Generator" })).toHaveAttribute(
      "href",
      "/projects/event-gen",
    );
    await expect(canvas.getByText("stream")).toBeVisible();
    await expect(canvas.getByText("stream").closest('[aria-hidden="true"]')).not.toBeNull();
    await expect(canvasElement.querySelector("img")).not.toBeInTheDocument();
  },
});
