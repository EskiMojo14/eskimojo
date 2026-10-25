import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

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
    expect(button.element().childElementCount).toBe(0);
    await expect.element(button).toHaveTextContent("Edit");
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
