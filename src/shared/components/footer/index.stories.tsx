import { expect } from "storybook/test";

import preview from "#.storybook/preview";

import { Footer } from "./index";

const meta = preview.meta({
  title: "Components/Footer",
  component: Footer,
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Social and artwork-credit links use the global primary link colour and retain underlines. The global link default has zero specificity, so buttons, chips, tabs, and navigation keep their component colours.",
      },
    },
  },
});

export const Default = meta.story({
  play: async ({ canvas }) => {
    for (const link of canvas.getAllByRole("link")) {
      await expect(link).toHaveAttribute("target", "_blank");
      await expect(link).toHaveAttribute("rel", "noopener noreferrer");
    }
  },
});
