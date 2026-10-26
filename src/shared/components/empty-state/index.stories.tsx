import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import { MdSymbol } from "#/shared/components/symbol";

import { EmptyState } from "./index";

const meta = preview.meta({
  title: "Components/EmptyState",
  component: EmptyState,
  parameters: {
    layout: "centered",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          'A Material Design empty-state message with a decorative icon, an h2 title, and a supporting description. Pass a non-interactive React node to icon (for example a literal MdSymbol, SVG, or image) and inline content to description. The icon is hidden from assistive technology because the text conveys the message. Native div props, className, and ref are forwarded; live announcements are opt-in with aria-live="polite". Styles load through the shared head-linked stylesheet and use the current theme and contrast tokens.',
      },
    },
  },
  argTypes: {
    icon: { control: false },
    title: { control: "text" },
    description: { control: "text" },
  },
  args: {
    icon: <MdSymbol>search_off</MdSymbol>,
    title: "No results found",
    description: "Try a different search or adjust your filters.",
  },
});

export const Default = meta.story({
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("heading", { name: "No results found", level: 2 })).toBeVisible();
    await expect(canvas.getByText("Try a different search or adjust your filters.")).toBeVisible();
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
  },
});

export const CustomIcon = meta.story({
  args: {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path d="M3 7h7l2 2h9v11H3z" />
        <path d="M3 7V4h7l2 3h9v2" />
      </svg>
    ),
    title: "No projects yet",
    description: "Your projects will appear here once you add them.",
  },
});

export const WrappingContent = meta.story({
  args: {
    title: "Nothing matches your current selection",
    description:
      "Try choosing another time period or removing a few filters to see more of your listening history.",
    style: { width: 280, maxWidth: "100%" },
  },
});
