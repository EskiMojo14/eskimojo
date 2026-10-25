import { expect, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { Button } from "#/shared/components/buttons/button";

import { ButtonGroup } from "./index";

for (const variant of ["standard", "connected"] as const) {
  test(`${variant} has one tab stop and arrows move focus without selecting`, async () => {
    const onClick = vi.fn<() => void>();
    const result = await page.renderWithProviders(
      <>
        <ButtonGroup variant={variant} aria-label="Theme">
          <Button aria-pressed>System</Button>
          <Button aria-pressed={false} onClick={onClick}>
            Light
          </Button>
          <Button aria-pressed={false}>Dark</Button>
        </ButtonGroup>
        <Button>Done</Button>
      </>,
    );
    const system = result.getByRole("button", { name: "System" });
    const light = result.getByRole("button", { name: "Light" });
    await expect.element(result.getByRole("toolbar", { name: "Theme" })).toBeVisible();
    await userEvent.tab();
    await expect.element(system).toHaveFocus();
    await userEvent.keyboard("{ArrowRight}");
    await expect.element(light).toHaveFocus();
    await expect.element(light).toHaveAttribute("aria-pressed", "false");
    expect(onClick).not.toHaveBeenCalled();
    await userEvent.keyboard("{Enter}");
    expect(onClick).toHaveBeenCalledOnce();
    await userEvent.keyboard(" ");
    expect(onClick).toHaveBeenCalledTimes(2);
    await userEvent.keyboard("{End}");
    await expect.element(result.getByRole("button", { name: "Dark" })).toHaveFocus();
    await userEvent.keyboard("{Home}");
    await expect.element(system).toHaveFocus();
    await userEvent.tab();
    await expect.element(result.getByRole("button", { name: "Done" })).toHaveFocus();
    await userEvent.tab({ shift: true });
    await expect.element(system).toHaveFocus();
  });
}

test("starts at the selected button and remembers pointer focus on re-entry", async () => {
  const result = await page.renderWithProviders(
    <>
      <ButtonGroup aria-label="Theme">
        <Button aria-pressed={false}>System</Button>
        <Button aria-pressed>Light</Button>
        <Button aria-pressed={false}>Dark</Button>
      </ButtonGroup>
      <Button>Done</Button>
    </>,
  );
  await userEvent.tab();
  await expect.element(result.getByRole("button", { name: "Light" })).toHaveFocus();
  await result.getByRole("button", { name: "Dark" }).click();
  await userEvent.tab();
  await expect.element(result.getByRole("button", { name: "Done" })).toHaveFocus();
  await userEvent.tab({ shift: true });
  await expect.element(result.getByRole("button", { name: "Dark" })).toHaveFocus();
});

test("skips disabled, aria-disabled, and hidden children", async () => {
  const result = await page.renderWithProviders(
    <ButtonGroup aria-label="Actions">
      <Button>First</Button>
      <Button disabled>Unavailable</Button>
      <Button aria-disabled>Pending</Button>
      <Button hidden>Hidden</Button>
      <Button>Last</Button>
    </ButtonGroup>,
  );
  await userEvent.tab();
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(result.getByRole("button", { name: "Last" })).toHaveFocus();
  await userEvent.keyboard("{ArrowLeft}");
  await expect.element(result.getByRole("button", { name: "First" })).toHaveFocus();
});

test("left and right follow RTL layout", async () => {
  const result = await page.renderWithProviders(
    <ButtonGroup aria-label="Actions" dir="rtl">
      <Button>First</Button>
      <Button>Last</Button>
    </ButtonGroup>,
  );
  await userEvent.tab();
  await userEvent.keyboard("{ArrowLeft}");
  await expect.element(result.getByRole("button", { name: "Last" })).toHaveFocus();
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(result.getByRole("button", { name: "First" })).toHaveFocus();
});

test("does not consume boundary, modified, vertical, or caller-handled keys", async () => {
  const result = await page.renderWithProviders(
    <ButtonGroup
      aria-label="Actions"
      onKeyDown={(event) => {
        if (event.key === "End") event.preventDefault();
      }}
    >
      <Button>First</Button>
      <Button>Last</Button>
    </ButtonGroup>,
  );
  const first = result.getByRole("button", { name: "First" }).element();
  for (const init of [
    { key: "ArrowLeft" },
    { key: "ArrowUp" },
    { key: "ArrowRight", ctrlKey: true },
    { key: "ArrowRight", isComposing: true },
  ]) {
    const event = new KeyboardEvent("keydown", { ...init, bubbles: true, cancelable: true });
    expect(first.dispatchEvent(event)).toBe(true);
  }
  await userEvent.tab();
  await userEvent.keyboard("{End}");
  await expect.element(first).toHaveFocus();
});

test("repairs the tab stop when a button is disabled, removed, or added", async () => {
  const result = await page.renderWithProviders(
    <ButtonGroup aria-label="Actions">
      <Button>First</Button>
      <Button>Last</Button>
    </ButtonGroup>,
  );
  await result.rerender(
    <ButtonGroup aria-label="Actions">
      <Button disabled>First</Button>
      <Button>Last</Button>
    </ButtonGroup>,
  );
  await expect
    .element(result.getByRole("button", { name: "Last" }))
    .toHaveAttribute("tabindex", "0");
  await result.rerender(
    <ButtonGroup aria-label="Actions">
      <Button key="new">New</Button>
    </ButtonGroup>,
  );
  await expect
    .element(result.getByRole("button", { name: "New" }))
    .toHaveAttribute("tabindex", "0");
});

test("empty and entirely disabled groups do not trap keyboard focus", async () => {
  const result = await page.renderWithProviders(
    <>
      <ButtonGroup aria-label="Empty" />
      <ButtonGroup aria-label="Disabled">
        <Button disabled>Unavailable</Button>
      </ButtonGroup>
      <Button>Done</Button>
    </>,
  );
  await userEvent.tab();
  await expect.element(result.getByRole("button", { name: "Done" })).toHaveFocus();
});

test("nested controls and groups keep their own keyboard handling", async () => {
  const result = await page.renderWithProviders(
    <ButtonGroup aria-label="Outer">
      <Button>Outer action</Button>
      <input aria-label="Text" />
      <ButtonGroup aria-label="Inner">
        <Button>Inner first</Button>
        <Button>Inner last</Button>
      </ButtonGroup>
    </ButtonGroup>,
  );
  await result.getByRole("textbox", { name: "Text" }).fill("text");
  await userEvent.keyboard("{ArrowLeft}");
  await expect.element(result.getByRole("textbox", { name: "Text" })).toHaveFocus();
  await result.getByRole("button", { name: "Inner first" }).click();
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(result.getByRole("button", { name: "Inner last" })).toHaveFocus();
});
