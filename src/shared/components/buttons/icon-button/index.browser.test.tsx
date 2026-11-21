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

test.each(["ltr", "rtl"] as const)(
  "compact icon buttons activate from the %s inline hit area",
  async (direction) => {
    await page.viewport(1280, 800);

    const onClick = vi.fn<() => void>();

    const result = await page.renderWithProviders(
      <div data-testid="hit-area" dir={direction} style={{ paddingInline: "16px" }}>
        <IconButton
          size="extra-small"
          aria-label="Settings"
          icon={<MdSymbol>settings</MdSymbol>}
          onClick={onClick}
        />
      </div>,
      {
        preferences: { density: "small" },
        syncPreferencesToDocument: true,
      },
    );

    const button = result.getByRole("button", { name: "Settings" }).element();
    const hitArea = result.getByTestId("hit-area").element();
    const bounds = button.getBoundingClientRect();
    const hitAreaBounds = hitArea.getBoundingClientRect();

    await userEvent.pointer({
      target: hitArea,
      coords: {
        x: (direction === "ltr" ? bounds.left - 1 : bounds.right + 1) - hitAreaBounds.left,
        y: bounds.top + bounds.height / 2 - hitAreaBounds.top,
      },
      keys: "[MouseLeft]",
    });

    expect(onClick).toHaveBeenCalledOnce();
  },
);

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
