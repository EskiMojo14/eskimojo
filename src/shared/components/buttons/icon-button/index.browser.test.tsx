import { expect, onTestFinished, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { MdSymbol } from "#/shared/components/symbol";

import { IconButton } from "./index";

test("requires and exposes an accessible name while hiding decorative icon content", async () => {
  const result = await page.renderWithProviders(
    <IconButton aria-label="Edit" icon={<MdSymbol aria-label="Pencil">edit</MdSymbol>} />,
  );

  await expect.element(result.getByRole("button", { name: "Edit" })).toHaveAccessibleName("Edit");
  expect(result.getByRole("img", { name: "Pencil" }).query()).toBeNull();
});

test("compact icon buttons keep 48px hit areas without enlarging their layout boxes", async () => {
  const root = document.documentElement;
  const previousDensity = root.style.getPropertyValue("--md-density");

  onTestFinished(() => {
    if (previousDensity) root.style.setProperty("--md-density", previousDensity);
    else root.style.removeProperty("--md-density");
  });

  root.style.setProperty("--md-density", "-2");

  const result = await page.renderWithProviders(
    <IconButton size="extra-small" aria-label="Settings" icon={<MdSymbol>settings</MdSymbol>} />,
  );

  const button = result.getByRole("button", { name: "Settings" }).element();
  const bounds = button.getBoundingClientRect();
  const hitArea = getComputedStyle(button, "::after");

  expect(bounds.width).toBeLessThan(48);
  expect(bounds.height).toBeLessThan(48);
  expect(Number.parseFloat(hitArea.inlineSize)).toBeGreaterThanOrEqual(48);
  expect(Number.parseFloat(hitArea.blockSize)).toBeGreaterThanOrEqual(48);
});

test("defaults to button type and forwards native button props", async () => {
  const result = await page.renderWithProviders(
    <>
      <IconButton aria-label="Preview" icon={<MdSymbol>visibility</MdSymbol>} />
      <IconButton
        aria-labelledby="save-label"
        type="submit"
        variant="outlined"
        icon={<MdSymbol>save</MdSymbol>}
      />
      <span id="save-label">Save</span>
    </>,
  );

  await expect
    .element(result.getByRole("button", { name: "Preview" }))
    .toHaveAttribute("type", "button");
  await expect
    .element(result.getByRole("button", { name: "Save" }))
    .toHaveAttribute("type", "submit");
});

test("forwards toggle state and leaves its state controlled by the caller", async () => {
  const onClick = vi.fn<() => void>();

  const result = await page.renderWithProviders(
    <IconButton
      aria-label="Favorite"
      aria-pressed={false}
      icon={<MdSymbol>favorite</MdSymbol>}
      onClick={onClick}
    />,
  );

  const button = result.getByRole("button", { name: "Favorite" });

  await userEvent.click(button);
  expect(onClick).toHaveBeenCalledOnce();
  await expect.element(button).toHaveAttribute("aria-pressed", "false");

  await result.rerender(
    <IconButton
      aria-label="Favorite"
      aria-pressed
      icon={<MdSymbol>favorite</MdSymbol>}
      onClick={onClick}
    />,
  );
  await expect.element(button).toHaveAttribute("aria-pressed", "true");
});
