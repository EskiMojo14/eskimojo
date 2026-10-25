import { expect, test, vi } from "vite-plus/test";
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
  await expect
    .element(result.getByRole("button", { name: "Save" }))
    .toHaveClass(/icon-button--outlined/);
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
