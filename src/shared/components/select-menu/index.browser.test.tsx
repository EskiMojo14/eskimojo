import { useState } from "react";
import { expect, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { MdSymbol } from "#/shared/components/symbol";

import { SelectMenu } from "./index";

const options = [
  { value: "system", label: "System" },
  { value: "standard", label: "Standard" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
];

function Example({ disabled = false, onChange = (_value: string) => {} }) {
  const [value, setValue] = useState("system");
  return (
    <form aria-label="Settings">
      <SelectMenu
        label="Contrast"
        name="contrast"
        options={options}
        value={value}
        disabled={disabled}
        onChange={(next) => {
          onChange(next);
          setValue(next);
        }}
      />
      <button type="button" style={{ marginBlockStart: 360 }}>
        Next
      </button>
    </form>
  );
}

test("pointer selection updates the controlled value, form value, and focus", async () => {
  const onChange = vi.fn<(value: string) => void>();
  const result = await page.renderWithProviders(<Example onChange={onChange} />);
  const field = result.getByRole("combobox", { name: "Contrast" });
  await expect.element(field).toHaveAccessibleDescription("System");
  await field.click();
  await expect.element(result.getByRole("listbox", { name: "Contrast" })).toBeVisible();
  await expect
    .element(result.getByRole("option", { name: "System", exact: true }))
    .toHaveAttribute("aria-selected", "true");
  await result.getByRole("option", { name: "High", exact: true }).click();
  await expect.element(field).toHaveAccessibleDescription("High");
  await expect.element(field).toHaveAttribute("aria-expanded", "false");
  await expect.element(field).toHaveFocus();
  expect(onChange).toHaveBeenCalledExactlyOnceWith("high");
  const form = result.getByRole("form", { name: "Settings" }).element();
  expect(form).toBeInstanceOf(HTMLFormElement);
  if (!(form instanceof HTMLFormElement)) throw new Error("Expected Settings form.");
  expect(new FormData(form).get("contrast")).toBe("high");
});

test("arrows explore without changing selection; Escape cancels and Enter commits", async () => {
  const onChange = vi.fn<(value: string) => void>();
  const result = await page.renderWithProviders(<Example onChange={onChange} />);
  const field = result.getByRole("combobox", { name: "Contrast" });
  await field.click();
  await userEvent.keyboard("{End}");
  await expect.element(field).toHaveAccessibleDescription("System");
  await expect
    .element(result.getByRole("option", { name: "System", exact: true }))
    .toHaveAttribute("aria-selected", "true");
  await expect
    .element(field)
    .toHaveAttribute(
      "aria-activedescendant",
      result.getByRole("option", { name: "High", exact: true }).element().id,
    );
  await userEvent.keyboard("{Escape}");
  await expect.element(field).toHaveAttribute("aria-expanded", "false");
  expect(onChange).not.toHaveBeenCalled();
  await userEvent.keyboard("{ArrowDown}{ArrowDown}{ArrowDown}{Enter}");
  await expect.element(field).toHaveAccessibleDescription("Medium");
  expect(onChange).toHaveBeenCalledExactlyOnceWith("medium");
});

test("Home/End stop at boundaries and Space commits", async () => {
  const result = await page.renderWithProviders(<Example />);
  const field = result.getByRole("combobox", { name: "Contrast" });
  await field.click();
  await userEvent.keyboard("{End}{ArrowDown} ");
  await expect.element(field).toHaveAccessibleDescription("High");
  await userEvent.keyboard("{Home}{ArrowUp} ");
  await expect.element(field).toHaveAccessibleDescription("System");
});

test("type-ahead supports prefixes and repeated-letter cycling", async () => {
  const result = await page.renderWithProviders(<Example />);
  const field = result.getByRole("combobox", { name: "Contrast" });
  await field.click();
  await userEvent.keyboard("s{Enter}");
  await expect.element(field).toHaveAccessibleDescription("Standard");
  await field.click();
  await userEvent.keyboard("ss{Enter}");
  await expect.element(field).toHaveAccessibleDescription("Standard");
  await field.click();
  await userEvent.keyboard("me{Enter}");
  await expect.element(field).toHaveAccessibleDescription("Medium");
});

test("Tab commits the active option and leaves the field", async () => {
  const result = await page.renderWithProviders(<Example />);
  await result.getByRole("combobox", { name: "Contrast" }).click();
  await userEvent.keyboard("{End}{Tab}");
  await expect
    .element(result.getByRole("combobox", { name: "Contrast" }))
    .toHaveAccessibleDescription("High");
  await expect.element(result.getByRole("button", { name: "Next" })).toHaveFocus();
  await expect.element(result.getByRole("listbox")).not.toBeInTheDocument();
});

test("clicking the trigger twice and clicking outside dismiss the menu", async () => {
  const result = await page.renderWithProviders(<Example />);
  const field = result.getByRole("combobox", { name: "Contrast" });
  await field.click();
  await field.click();
  await expect.element(field).toHaveAttribute("aria-expanded", "false");
  await field.click();
  await result.getByRole("button", { name: "Next" }).click();
  await expect.element(field).toHaveAttribute("aria-expanded", "false");
});

test("disabled fields cannot open and do not submit a value", async () => {
  const result = await page.renderWithProviders(<Example disabled />);
  await expect.element(result.getByRole("combobox", { name: "Contrast" })).toBeDisabled();
  const form = result.getByRole("form", { name: "Settings" }).element();
  if (!(form instanceof HTMLFormElement)) throw new Error("Expected Settings form.");
  expect(new FormData(form).has("contrast")).toBe(false);
});

test("icons appear in the selected value and menu options without changing accessible names", async () => {
  const result = await page.renderWithProviders(
    <SelectMenu
      label="Theme"
      value="dark"
      options={[
        { value: "light", label: "Light", icon: <MdSymbol>light_mode</MdSymbol> },
        { value: "dark", label: "Dark", icon: <MdSymbol>dark_mode</MdSymbol> },
      ]}
      onChange={vi.fn<(value: string) => void>()}
    />,
  );
  const field = result.getByRole("combobox", { name: "Theme", exact: true });
  const selectedIcon = field.element().querySelector<HTMLElement>('[aria-hidden="true"]');
  await expect.element(selectedIcon).toBeVisible();
  await expect.element(field).toHaveAccessibleDescription("Dark");
  await field.click();
  for (const name of ["Light", "Dark"]) {
    const option = result.getByRole("option", { name, exact: true });
    await expect.element(option).toBeVisible();
    await expect
      .element(option.element().querySelector<HTMLElement>('[aria-hidden="true"]'))
      .toBeVisible();
  }
});

test("long menus keep the active option visible at mobile widths", async () => {
  await page.viewport(320, 568);
  const result = await page.renderWithProviders(
    <SelectMenu
      label="Time zone"
      value="zone-0"
      options={Array.from({ length: 30 }, (_, index) => ({
        value: `zone-${index}`,
        label: `Time zone ${index}`,
      }))}
      onChange={vi.fn<(value: string) => void>()}
    />,
  );
  const field = result.getByRole("combobox", { name: "Time zone" });
  await field.click();
  await userEvent.keyboard("{End}");
  const menu = result.getByRole("listbox").element();
  const last = result.getByRole("option", { name: "Time zone 29", exact: true }).element();
  await expect.poll(() => menu.scrollTop).toBeGreaterThan(0);
  const menuBounds = menu.getBoundingClientRect();
  const optionBounds = last.getBoundingClientRect();
  expect(optionBounds.top).toBeGreaterThanOrEqual(menuBounds.top);
  expect(optionBounds.bottom).toBeLessThanOrEqual(menuBounds.bottom);
  expect(menuBounds.left).toBeGreaterThanOrEqual(0);
  expect(menuBounds.right).toBeLessThanOrEqual(320);
  expect(menuBounds.bottom).toBeLessThanOrEqual(568);
});
