import { expect, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { MdSymbol } from "#/shared/components/symbol";

import { Button } from "./index";

test("renders a decorative icon without changing the button name", async () => {
  const result = await page.renderWithProviders(
    <Button icon={<MdSymbol aria-label="Pencil">edit</MdSymbol>}>Edit</Button>,
  );

  const button = result.getByRole("button", { name: "Edit", exact: true });
  await expect.element(button).toHaveAccessibleName("Edit");
  expect(result.getByRole("img", { name: "Pencil" }).query()).toBeNull();
});

test("supports SVG icons and replacing or removing the icon", async () => {
  const result = await page.renderWithProviders(
    <Button
      icon={
        <svg aria-label="Pencil">
          <title>Pencil</title>
          <path d="M0 0h18v18H0z" />
        </svg>
      }
    >
      Edit
    </Button>,
  );

  const button = result.getByRole("button", { name: "Edit", exact: true });
  await expect.element(button).toHaveAccessibleName("Edit");
  await result.rerender(<Button icon={<MdSymbol>edit</MdSymbol>}>Edit</Button>);
  await expect.element(button).toHaveAccessibleName("Edit");

  for (const icon of [null, undefined, false]) {
    await result.rerender(<Button icon={icon}>Edit</Button>);
    await expect.element(button).toHaveTextContent("Edit");
    await expect.element(button).toHaveAccessibleName("Edit");
  }
});

test("defaults type to button and allows an explicit override", async () => {
  const result = await page.renderWithProviders(
    <>
      <Button>Preview</Button>
      <Button type="submit">Save</Button>
    </>,
  );

  await expect
    .element(result.getByRole("button", { name: "Preview" }))
    .toHaveAttribute("type", "button");
  await expect
    .element(result.getByRole("button", { name: "Save" }))
    .toHaveAttribute("type", "submit");
});

test.each(["ltr", "rtl"] as const)(
  "compact buttons activate from the %s inline hit area",
  async (direction) => {
    await page.viewport(1280, 800);

    const onClick = vi.fn<() => void>();

    const result = await page.renderWithProviders(
      <div data-testid="hit-area" dir={direction} style={{ paddingInline: "16px" }}>
        <Button size="extra-small" onClick={onClick}>
          X
        </Button>
      </div>,
      {
        preferences: { density: "small" },
        syncPreferencesToDocument: true,
      },
    );

    const button = result.getByRole("button", { name: "X" }).element();
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

test("loading preserves the action label, blocks duplicates, and allows recovery", async () => {
  let clicks = 0;

  const onClick = () => {
    clicks += 1;
  };

  const result = await page.renderWithProviders(
    <Button onClick={onClick} icon={<MdSymbol>refresh</MdSymbol>}>
      Retry
    </Button>,
  );

  const button = result.getByRole("button", { name: "Retry", exact: true });
  await button.click();
  expect(clicks).toBe(1);
  await result.rerender(
    <Button loading onClick={onClick} icon={<MdSymbol>refresh</MdSymbol>}>
      Retry
    </Button>,
  );
  await expect.element(button).toHaveAttribute("aria-busy", "true");
  await expect.element(button).toHaveFocus();
  button.element().dispatchEvent(new MouseEvent("click", { bubbles: true, cancelable: true }));
  expect(clicks).toBe(1);
  await result.rerender(
    <Button onClick={onClick} icon={<MdSymbol>refresh</MdSymbol>}>
      Retry
    </Button>,
  );
  await expect.element(button).not.toHaveAttribute("aria-busy");
  await button.click();
  expect(clicks).toBe(2);
});
