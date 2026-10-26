import { useState } from "react";
import { expect, test } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { MdSymbol } from "#/shared/components/symbol";

import { ExternalLinkChip, FilterChip } from "./index";

function ToggleDemo() {
  const [selected, setSelected] = useState(false);
  return (
    <FilterChip
      selected={selected}
      icon={<MdSymbol aria-label="Favourite icon">favorite</MdSymbol>}
      onClick={() => setSelected(!selected)}
    >
      Favourite
    </FilterChip>
  );
}

test("toggles with pointer and keyboard without changing its accessible name", async () => {
  const result = await page.renderWithProviders(<ToggleDemo />);
  const chip = result.getByRole("button", { name: "Favourite", exact: true });
  await expect.element(chip).toHaveAttribute("type", "button");
  await expect.element(chip).toHaveAttribute("aria-pressed", "false");
  await chip.click();
  await expect.element(chip).toHaveAttribute("aria-pressed", "true");
  await userEvent.keyboard(" ");
  await expect.element(chip).toHaveAttribute("aria-pressed", "false");
  await expect.element(chip).toHaveAccessibleName("Favourite");
  expect(result.getByRole("img").query()).toBeNull();
});

test("keeps the check mounted while expanding and collapsing the chip", async () => {
  const result = await page.renderWithProviders(<FilterChip selected={false}>Period</FilterChip>);
  await document.fonts.ready;
  const chip = result.getByRole("button", { name: "Period" });
  const check = chip.element().querySelector(".chip__check");
  const width = chip.element().getBoundingClientRect().width;

  await result.rerender(<FilterChip selected>Period</FilterChip>);
  await expect.poll(() => chip.element().getBoundingClientRect().width).toBeCloseTo(width + 18, 0);
  expect(chip.element().querySelector(".chip__check")).toBe(check);

  await result.rerender(<FilterChip selected={false}>Period</FilterChip>);
  await expect.poll(() => chip.element().getBoundingClientRect().width).toBeCloseTo(width, 0);
  expect(chip.element().querySelector(".chip__check")).toBe(check);
  await expect.element(chip).toHaveAccessibleName("Period");
});

test("link chips retain their check across current-state changes and preserve link semantics", async () => {
  const result = await page.renderWithProviders(
    <ExternalLinkChip href="#period" aria-current="page">
      Period
    </ExternalLinkChip>,
  );
  const chip = result.getByRole("link", { name: "Period" });
  const check = chip.element().querySelector(".chip__check");
  await expect.element(chip).toHaveAttribute("aria-current", "page");
  await expect.element(chip).toHaveAttribute("target", "_blank");
  await expect.element(chip).toHaveAttribute("rel", "noopener noreferrer");

  await result.rerender(
    <ExternalLinkChip href="#period" aria-current={false}>
      Period
    </ExternalLinkChip>,
  );
  expect(chip.element().querySelector(".chip__check")).toBe(check);
  await expect.element(chip).not.toHaveAttribute("aria-pressed");
  await expect.element(chip).toHaveAccessibleName("Period");
});
