import preview from "#.storybook/preview";
import { Footer } from "#/shared/components/footer";
import { createBem } from "#/shared/lib/bem";

import { Sidebar } from "./index";

const appShellBem = createBem("app-shell");

const meta = preview.meta({
  title: "Components/Sidebar",
  component: Sidebar,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Primary navigation in an MD3 list. Decorative artwork follows the palette selected on <html>: Goat for goat (the default), and OC for arctic.",
      },
    },
  },
});

export const Default = meta.story({});

export const WithFooter = meta.story({
  render: () => (
    <div {...appShellBem()}>
      <Sidebar />
      <div {...appShellBem({ element: "main" })}>
        <main {...appShellBem({ element: "content" })} />
        <Footer />
      </div>
    </div>
  ),
});
