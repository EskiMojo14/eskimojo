import { useState } from "react";
import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import { MdSymbol } from "#/shared/components/symbol";

import { AssistChip, ChipGroup, ExternalLinkChip, FilterChip } from "./index";

const meta = preview.meta({
  title: "Components/Chips",
  component: FilterChip,
  parameters: {
    layout: "centered",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "MD3 outlined assist chips and controlled filter chips. FilterChip requires selected and exposes aria-pressed with a decorative checkmark. Selection draws the original Material Symbols check through an SVG mask and springs the icon slot's width; deselection reverses both transitions. Existing leading icons crossfade without resizing the chip. Link chips share the same animation. Reduced motion disables these transitions. ChipGroup wraps chips and requires an accessible name. Buttons retain native Tab, Enter and Space behavior; callers own single- or multiple-selection logic. Uses the shared head-linked stylesheet.",
      },
    },
  },
});

function SingleSelectDemo() {
  const [selected, setSelected] = useState("7 days");
  return (
    <ChipGroup aria-label="Listening period">
      {["7 days", "30 days", "All time"].map((period) => (
        <FilterChip key={period} selected={selected === period} onClick={() => setSelected(period)}>
          {period}
        </FilterChip>
      ))}
    </ChipGroup>
  );
}

export const SingleSelect = meta.story({
  render: () => <SingleSelectDemo />,
  play: async ({ canvas, userEvent }) => {
    const week = canvas.getByRole("button", { name: "7 days" });
    const month = canvas.getByRole("button", { name: "30 days" });
    await expect(week).toHaveAttribute("aria-pressed", "true");
    await userEvent.click(month);
    await expect(month).toHaveAttribute("aria-pressed", "true");
    await expect(week).toHaveAttribute("aria-pressed", "false");
    await userEvent.keyboard(" ");
    await expect(month).toHaveAttribute("aria-pressed", "true");
  },
});

export const Assist = meta.story({
  render: () => <AssistChip icon={<MdSymbol>event</MdSymbol>}>Add to calendar</AssistChip>,
});

function ToggleDemo() {
  const [selected, setSelected] = useState(false);
  return (
    <ChipGroup aria-label="Toggle filters">
      <FilterChip selected={selected} onClick={() => setSelected(!selected)}>
        Favourite
      </FilterChip>
      <FilterChip
        selected={selected}
        icon={<MdSymbol>favorite</MdSymbol>}
        onClick={() => setSelected(!selected)}
      >
        With icon
      </FilterChip>
    </ChipGroup>
  );
}

export const Toggle = meta.story({
  render: () => <ToggleDemo />,
  play: async ({ canvas, userEvent }) => {
    const chip = canvas.getByRole("button", { name: "Favourite" });
    await expect(chip).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(chip);
    await expect(chip).toHaveAttribute("aria-pressed", "true");
    await userEvent.keyboard(" ");
    await expect(chip).toHaveAttribute("aria-pressed", "false");
  },
});

export const Disabled = meta.story({
  args: { selected: false, disabled: true, children: "Unavailable" },
});

export const Links = meta.story({
  parameters: {
    docs: {
      description: {
        story:
          "ExternalLinkChip renders a native anchor opening a new tab with noopener noreferrer by default. InternalLinkChip shares its base with TanStack createLink for typed destinations and stays in the current tab. Non-false aria-current adds selected colors and a checkmark without changing link semantics.",
      },
    },
  },
  render: () => (
    <ChipGroup aria-label="Link chips">
      <ExternalLinkChip href="#current" aria-current="true">
        Current
      </ExternalLinkChip>
      <ExternalLinkChip href="https://example.com">Visit site</ExternalLinkChip>
    </ChipGroup>
  ),
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: "Visit site" });
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  },
});
