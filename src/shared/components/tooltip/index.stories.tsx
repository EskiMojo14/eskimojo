import { expect, fn, waitFor } from "storybook/test";

import preview from "#.storybook/preview";
import { Button } from "#/shared/components/buttons/button";
import { IconButton } from "#/shared/components/buttons/icon-button";
import { MdSymbol } from "#/shared/components/symbol";

const meta = preview.meta({
  title: "Components/Tooltip",
  component: Button,
  args: {
    children: "Save",
    tooltip: "Save your changes",
    onClick: fn(),
  },
  parameters: {
    layout: "centered",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Plain and rich MD3 tooltips, inspired by Schema Benchmarks' withTooltip approach. Button and IconButton accept tooltip, tooltipOpts (placement and hover delay), and popoverRef. Current evergreen browsers must support native Popover and CSS anchor positioning; neither is polyfilled. Only interest invokers are conditionally polyfilled for browsers such as Firefox/Safari that still lack them. Hover waits 500ms by default; keyboard focus is immediate. Escape and light dismiss close the hint. Rich hints support a subhead, supporting content, and optional actions. Hints preserve the trigger's accessible name by default; opt into tooltipAsLabel to name a trigger using non-empty plain tooltip text through aria-labelledby. Rich hints still need a separately named trigger.",
      },
    },
  },
});

export const Plain = meta.story({
  play: async ({ canvas, userEvent, args }) => {
    const button = canvas.getByRole("button", { name: "Save" });
    await userEvent.tab();
    await waitFor(() => expect(canvas.getByText("Save your changes")).toBeVisible());
    await userEvent.tab();
    await waitFor(() => expect(canvas.getByText("Save your changes")).not.toBeVisible());
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
});

export const Rich = meta.story({
  args: {
    children: "Storage",
    tooltip: {
      subhead: "Local storage",
      supporting: "Your theme and contrast choices are remembered only in this browser.",
      actions: <Button variant="text">Understood</Button>,
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.tab();
    await waitFor(() =>
      expect(canvas.getByRole("dialog", { name: "Local storage" })).toBeVisible(),
    );
    await userEvent.tab();
    await expect(canvas.getByRole("button", { name: "Understood" })).toHaveFocus();
    await userEvent.tab();
    await waitFor(() => expect(canvas.queryByRole("dialog")).not.toBeInTheDocument());
  },
});

export const Icon = meta.story({
  render: () => (
    <IconButton
      aria-label="Add to favorites"
      icon={<MdSymbol>favorite</MdSymbol>}
      tooltip="Keep this in your favorites"
    />
  ),
});

export const LongContent = meta.story({
  args: {
    tooltip:
      "This longer tooltip wraps within a constrained width so that supplemental information stays readable on small screens.",
  },
});

export const Disabled = meta.story({
  args: { disabled: true },
  play: async ({ canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: "Save" });
    await userEvent.hover(button);
    await expect(button).toBeDisabled();
    await expect(canvas.getByText("Save your changes")).not.toBeVisible();
  },
});
