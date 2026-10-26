import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import { Footer } from "#/shared/components/footer";

import { NotFoundPage } from "./index";

const meta = preview.meta({
  title: "Components/NotFoundPage",
  component: NotFoundPage,
  parameters: {
    layout: "fullscreen",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "The default router not-found page, composed from EmptyState. Centres in the viewport when standalone, or in the available app-shell content area above the footer. Shared styles load through the head-linked stylesheet.",
      },
    },
  },
});

export const Default = meta.story({
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("main")).toBeVisible();
    await expect(canvas.getByRole("heading", { name: "Page not found" })).toBeVisible();
  },
});

export const InAppShell = meta.story({
  render: () => (
    <div className="app-shell">
      <div className="app-shell__main">
        <header>Page header</header>
        <div className="app-shell__content">
          <NotFoundPage />
        </div>
        <Footer />
      </div>
    </div>
  ),
});
