import { expect } from "storybook/test";

import preview from "#.storybook/preview";

import { LinearProgress } from "./index";

const meta = preview.meta({
  title: "Components/Progress/Linear",
  component: LinearProgress,
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
          "Flat MD3 linear progress with a 4px track, rounded ends, active/track gaps, and a determinate stop indicator. Omit value for indeterminate progress; supply value and optional max (default 1) for measured completion. Native progress semantics carry the required label and current value. Values clamp to 0-max; invalid numbers throw. Uses logical positioning for RTL, root-loaded theme styles, and --linear-progress-thickness for sizing. Reduced motion keeps an indeterminate segment static and disables determinate transitions. Prefer placing it along the edge of the loading container; use circular progress for compact standalone loading.",
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

export const Large = meta.story({
  args: { value: 0.4, style: { "--linear-progress-thickness": "8px" } },
});

export const RightToLeft = meta.story({
  args: { value: 0.4 },
  globals: { direction: "rtl" },
});
