import preview from "#.storybook/preview";
import { Footer } from "#/shared/components/footer";

import { Sidebar } from "./index";

const meta = preview.meta({
  title: "Components/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "An empty, non-modal sidebar. Decorative artwork follows the palette selected on <html>: Goat for goat (the default), and OC for arctic.",
      },
    },
  },
});

export const Default = meta.story({});

export const WithFooter = meta.story({
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap" }}>
      <Sidebar />
      <div className="app-shell" style={{ flex: "1 1 20rem", minInlineSize: 0 }}>
        <main className="app-shell__content" />
        <Footer />
      </div>
    </div>
  ),
});
