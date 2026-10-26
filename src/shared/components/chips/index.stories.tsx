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
          "MD3 outlined assist chips and controlled filter chips. FilterChip requires selected and exposes aria-pressed with a decorative checkmark. ChipGroup wraps chips and requires an accessible name. Buttons retain native Tab, Enter and Space behavior; callers own single- or multiple-selection logic. Uses the shared head-linked stylesheet.",
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

export const Disabled = meta.story({
  args: { selected: false, disabled: true, children: "Unavailable" },
});

export const Links = meta.story({
  parameters: {
    docs: {
      description: {
        story:
          "ExternalLinkChip renders a native anchor; InternalLinkChip wraps it with TanStack createLink for typed destinations. Non-false aria-current adds selected colors and a checkmark without changing link semantics.",
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
});
