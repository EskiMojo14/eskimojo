import preview from "#.storybook/preview";

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
