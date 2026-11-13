import { expect, fn } from "storybook/test";

import preview from "#.storybook/preview";
import { getProject } from "#/routes/projects/-data";
import { AppBar } from "#/shared/components/app-bar";
import { Footer } from "#/shared/components/footer";

import { ProjectDetail } from "./index";

import "./index.css";

const meta = preview.meta({
  title: "Projects/Project Detail",
  component: ProjectDetail,
  args: {
    project: getProject("history-adapter"),
    children: (
      <>
        <h2>The full story</h2>
        <p>An example detailed project description.</p>
        <pre className="language-ts">
          <code>
            <span className="token keyword">const</span> message ={" "}
            <span className="token string">"Hello"</span>;{"\n"}
            <span className="token function">log</span>(message);
          </code>
        </pre>
      </>
    ),
  },
  render: (args) => (
    <div
      className="app-shell__main"
      data-project-page={args.project.palette ? "" : undefined}
      style={args.project.palette}
    >
      <AppBar navigationOpen={false} onOpenNavigation={fn()} />
      <div className="app-shell__content">
        <main
          className="projects-page"
          data-project-palette={args.project.palette ? "" : undefined}
          style={args.project.palette}
        >
          <ProjectDetail {...args} />
        </main>
      </div>
      <Footer />
    </div>
  ),
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
  },
});

export const Dark = meta.story({
  globals: { theme: "dark" },
});

export const HighContrast = meta.story({
  globals: { theme: "light", contrast: "high" },
});

export const MaterialSymbol = meta.story({
  args: { project: getProject("event-gen") },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "Event Generator", level: 1 })).toBeVisible();
  },
});

export const Default = meta.story({
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "History Adapter", level: 1 })).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "The full story" })).toBeVisible();
    await expect(canvas.getByRole("link", { name: "View source" })).toHaveAttribute(
      "href",
      "https://github.com/EskiMojo14/history-adapter",
    );
  },
});
