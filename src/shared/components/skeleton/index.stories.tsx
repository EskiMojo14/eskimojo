import { expect } from "storybook/test";

import preview from "#.storybook/preview";

import { Skeleton, SkeletonProgress } from "./index";

const meta = preview.meta({
  title: "Components/Skeleton",
  component: Skeleton,
  parameters: {
    layout: "padded",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Decorative placeholders use neutral surface tokens and a reduced-motion-aware pulse. Size them with standard span style/className props; inherited --skeleton-delay and --skeleton-column-delay control stagger timing. Styles are included in the root stylesheet. Pair a group of placeholders with one SkeletonProgress carrying a meaningful loading label.",
      },
    },
  },
});

export const Text = meta.story({
  render: () => (
    <>
      <SkeletonProgress label="Loading content..." />
      <Skeleton />
    </>
  ),
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("progressbar")).toHaveAccessibleName("Loading content...");
    await expect(canvas.getByRole("progressbar")).not.toHaveAttribute("value");
  },
});

export const Artwork = meta.story({
  args: {
    style: {
      inlineSize: 56,
      blockSize: 56,
      borderRadius: "var(--md-sys-shape-corner-medium)",
    },
  },
});
