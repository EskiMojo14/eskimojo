import { expect } from "storybook/test";

import preview from "#.storybook/preview";

import { CircularProgress } from "./index";

const meta = preview.meta({
  title: "Components/Progress/Circular",
  component: CircularProgress,
  args: { label: "Loading content" },
  argTypes: {
    value: { control: "number" },
    max: { control: "number" },
  },
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Flat MD3 circular progress. Omit value for indeterminate progress; otherwise value/max determines completion (max defaults to 1). Values clamp to the native progress range. A named native progress element carries semantics while decorative SVG paths draw active/track strokes and a gap. Where corner-shape is supported, stroke ends are cut to match the app's beveled corners; otherwise they are round. The default 40px size uses primary and secondary-container colors; --circular-progress-size controls size. Reduced motion stops rotation/sweeping and makes value updates immediate. Button loading uses a centered 24px indicator with no track and inherits the button label color.",
      },
    },
  },
});

export const Indeterminate = meta.story({
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("progressbar")).toHaveAccessibleName("Loading content");
    await expect(canvas.getByRole("progressbar")).not.toHaveAttribute("value");
  },
});

export const Determinate = meta.story({
  args: { value: 65, max: 100 },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("progressbar")).toHaveAttribute("value", "65");
    await expect(canvas.getByRole("progressbar")).toHaveAttribute("max", "100");
  },
});

export const Empty = meta.story({ args: { value: 0 } });

export const Complete = meta.story({ args: { value: 1 } });

export const NoTrack = meta.story({ args: { track: false } });

export const Large = meta.story({
  args: { style: { "--circular-progress-size": "96px" } },
});
