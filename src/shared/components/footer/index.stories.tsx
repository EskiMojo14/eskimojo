import { expect } from "storybook/test";

import preview from "#.storybook/preview";

import { Footer } from "./index";

const meta = preview.meta({
  title: "Components/Footer",
  component: Footer,
  parameters: {
    layout: "fullscreen",
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
