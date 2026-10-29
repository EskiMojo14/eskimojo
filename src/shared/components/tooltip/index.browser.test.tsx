import { createRef, type ComponentPropsWithRef } from "react";
import { expect, expectTypeOf, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { Button } from "#/shared/components/buttons/button";
import { IconButton } from "#/shared/components/buttons/icon-button";

import { withTooltip, type TooltipProps } from "./index";

function Link({ children, ...props }: ComponentPropsWithRef<"a">) {
  return <a {...props}>{children}</a>;
}

const TooltipLink = withTooltip(Link);

test("rich tooltips cannot opt into trigger labeling", () => {
  expectTypeOf<{
    tooltip: { supporting: string };
    tooltipAsLabel: true;
  }>().not.toExtend<TooltipProps>();
  expectTypeOf<{
    tooltip: { supporting: string };
    tooltipAsLabel: false;
  }>().toExtend<TooltipProps>();
  expectTypeOf<{
    tooltip: string;
    tooltipAsLabel: true;
  }>().toExtend<TooltipProps>();
});

test("opt-in tooltip labels name the trigger while hidden, open, and dismissed", async () => {
  const result = await page.renderWithProviders(
    <TooltipLink href="#palette" tooltip="Switch palette" tooltipAsLabel>
      <span aria-hidden="true">Palette icon</span>
    </TooltipLink>,
  );
  const link = result.getByRole("link", { name: "Switch palette", exact: true });
  const linkElement = link.element();
  const hint = result.getByText("Switch palette", { exact: true });
  await expect.element(hint).not.toBeVisible();
  await expect.element(link).toHaveAttribute("aria-labelledby", hint.element().id);
  await userEvent.tab();
  await expect.element(hint).toBeVisible();
  await expect.element(link).toHaveAccessibleName("Switch palette");
  await userEvent.keyboard("{Escape}");
  await expect.element(hint).not.toBeVisible();
  await expect.element(link).toHaveAccessibleName("Switch palette");
  await result.rerender(
    <TooltipLink href="#palette" tooltip="Switch to Goat" tooltipAsLabel>
      <span aria-hidden="true">Palette icon</span>
    </TooltipLink>,
  );
  await expect.element(linkElement).toHaveAccessibleName("Switch to Goat");
});

test("labeling is opt-in and does not leave references for missing or rich tooltips", async () => {
  const result = await page.renderWithProviders(
    <Button tooltip="Save changes" tooltipAsLabel>
      Save
    </Button>,
  );
  const button = result.getByRole("button", { name: "Save changes", exact: true }).element();
  await result.rerender(<Button tooltip="Save changes">Save</Button>);
  await expect.element(button).not.toHaveAttribute("aria-labelledby");
  await expect.element(button).toHaveAccessibleName("Save");
  await result.rerender(
    <Button tooltip="" tooltipAsLabel>
      Save
    </Button>,
  );
  await expect.element(button).not.toHaveAttribute("aria-labelledby");
  await expect.element(button).toHaveAccessibleName("Save");
  await result.rerender(<Button tooltipAsLabel>Save</Button>);
  await expect.element(button).not.toHaveAttribute("aria-labelledby");
  await result.rerender(
    <Button tooltip={{ subhead: "Storage", supporting: "Details" }}>Save</Button>,
  );
  await expect.element(button).not.toHaveAttribute("aria-labelledby");
  await expect.element(button).toHaveAccessibleName("Save");
});

test("keyboard focus opens a hint, Escape dismisses it without activating the button", async () => {
  const onClick = vi.fn<() => void>();
  const result = await page.renderWithProviders(
    <Button tooltip="Save your changes" onClick={onClick}>
      Save
    </Button>,
  );
  const button = result.getByRole("button", { name: "Save", exact: true });
  const hint = result.getByText("Save your changes");
  await expect.element(hint).not.toBeVisible();
  await userEvent.tab();
  await expect.element(hint).toBeVisible();
  await userEvent.keyboard("{Escape}");
  await expect.element(hint).not.toBeVisible();
  await expect.element(button).toHaveFocus();
  expect(onClick).not.toHaveBeenCalled();
  await userEvent.keyboard("{Enter}");
  expect(onClick).toHaveBeenCalledOnce();
});

test("hover shows a hint that remains hoverable and closes after leaving", async () => {
  const result = await page.renderWithProviders(
    <>
      <Button tooltip="Supplemental text" tooltipOpts={{ delay: 20 }}>
        Hover me
      </Button>
      <button>Elsewhere</button>
    </>,
  );
  const button = result.getByRole("button", { name: "Hover me" });
  const hint = result.getByText("Supplemental text");
  await button.hover();
  await expect.element(hint).toBeVisible();
  await hint.hover();
  await expect.element(hint).toBeVisible();
  await result.getByRole("button", { name: "Elsewhere" }).hover();
  await expect.element(hint).not.toBeVisible();
});

test("rich hint actions are reachable by keyboard and retain focus inside the hint", async () => {
  const onClick = vi.fn<() => void>();
  const result = await page.renderWithProviders(
    <Button
      tooltip={{
        subhead: "Storage",
        supporting: "Preferences stay in this browser.",
        actions: <Button onClick={onClick}>Learn more</Button>,
      }}
    >
      Details
    </Button>,
  );
  await userEvent.tab();
  const hint = result.getByRole("dialog", { name: "Storage" });
  await expect.element(hint).toBeVisible();
  const hintElement = hint.element();
  await userEvent.tab();
  await expect.element(result.getByRole("button", { name: "Learn more" })).toHaveFocus();
  await expect.element(hint).toBeVisible();
  await userEvent.keyboard("{Enter}");
  expect(onClick).toHaveBeenCalledOnce();
  await userEvent.keyboard("{Escape}");
  await expect.element(hintElement).not.toBeVisible();
  await expect.element(result.getByRole("button", { name: "Details" })).toHaveFocus();
});

test("preserves trigger identity, handlers, styles and refs without replacing its accessible name", async () => {
  const ref = createRef<HTMLButtonElement>();
  const popoverRef = createRef<HTMLDivElement>();
  const onFocus = vi.fn<() => void>();
  const result = await page.renderWithProviders(
    <IconButton
      ref={ref}
      popoverRef={popoverRef}
      id="favorite"
      aria-label="Favorite"
      icon="+"
      tooltip="Add to your favorites"
      style={{ margin: 4 }}
      onFocus={onFocus}
    />,
  );
  const button = result.getByRole("button", { name: "Favorite" });
  expect(ref.current).toBe(button.element());
  expect(ref.current?.id).toBe("favorite");
  expect(popoverRef.current?.id).toBe("favorite-tooltip");
  await userEvent.tab();
  await expect.element(popoverRef.current).toBeVisible();
  expect(onFocus).toHaveBeenCalledOnce();
  await expect.element(button).toHaveAccessibleName("Favorite");
});

test("omits hint behavior when tooltip is absent or empty and removes it when content changes", async () => {
  const result = await page.renderWithProviders(<Button>Save</Button>);
  const button = result.getByRole("button", { name: "Save" });
  await expect.element(button).not.toHaveAttribute("interestfor");
  await result.rerender(<Button tooltip="">Save</Button>);
  await expect.element(button).not.toHaveAttribute("interestfor");
  await result.rerender(<Button tooltip="Details">Save</Button>);
  await userEvent.tab();
  await expect.element(result.getByText("Details")).toBeVisible();
  await result.rerender(<Button>Save</Button>);
  await expect.element(button).not.toHaveAttribute("interestfor");
  await expect.element(result.getByText("Details")).not.toBeInTheDocument();
});

test("Escape dismisses a nested hint without closing its enclosing auto popover", async () => {
  const result = await page.renderWithProviders(
    <>
      <button popoverTarget="parent-popover">Open parent</button>
      <div popover="auto" id="parent-popover">
        <Button tooltip="Nested hint">Inside</Button>
      </div>
    </>,
  );
  await result.getByRole("button", { name: "Open parent" }).click();
  await result.getByRole("button", { name: "Inside" }).hover();
  await expect.element(result.getByText("Nested hint")).toBeVisible();
  await userEvent.keyboard("{Escape}");
  await expect.element(result.getByText("Nested hint")).not.toBeVisible();
  await expect.element(result.getByRole("button", { name: "Inside" })).toBeVisible();
});

test("withTooltip works with links and generates distinct tooltip IDs", async () => {
  const result = await page.renderWithProviders(
    <>
      <TooltipLink href="#one" tooltip="First description">
        First
      </TooltipLink>
      <TooltipLink href="#two" tooltip="Second description">
        Second
      </TooltipLink>
    </>,
  );
  const first = result.getByRole("link", { name: "First" });
  const second = result.getByRole("link", { name: "Second" });
  expect(first.element().getAttribute("interestfor")).not.toBe(
    second.element().getAttribute("interestfor"),
  );
  await userEvent.tab();
  await expect.element(result.getByText("First description")).toBeVisible();
  await userEvent.tab();
  await expect.element(result.getByText("Second description")).toBeVisible();
  await expect.element(result.getByText("First description")).not.toBeVisible();
});

test("outside clicks dismiss a hint", async () => {
  const result = await page.renderWithProviders(
    <>
      <Button tooltip="Description">Trigger</Button>
      <button>Outside</button>
    </>,
  );
  await result.getByRole("button", { name: "Trigger" }).hover();
  await expect.element(result.getByText("Description")).toBeVisible();
  await result.getByRole("button", { name: "Outside" }).click();
  await expect.element(result.getByText("Description")).not.toBeVisible();
});

test("respects a configured hover delay", async () => {
  const result = await page.renderWithProviders(
    <Button tooltip="Delayed description" tooltipOpts={{ delay: 1000 }}>
      Delayed
    </Button>,
  );
  const start = performance.now();
  await result.getByRole("button", { name: "Delayed" }).hover();
  await expect.element(result.getByText("Delayed description")).not.toBeVisible();
  await expect.element(result.getByText("Delayed description")).toBeVisible();
  expect(performance.now() - start).toBeGreaterThanOrEqual(950);
});

for (const placement of ["top", "bottom", "left", "right"] as const) {
  test(`anchors the hint on the ${placement} of its trigger`, async () => {
    const ref = createRef<HTMLButtonElement>();
    const popoverRef = createRef<HTMLDivElement>();
    await page.renderWithProviders(
      <Button
        ref={ref}
        popoverRef={popoverRef}
        style={{ position: "fixed", left: "40%", top: "40%" }}
        tooltip="Anchored hint"
        tooltipOpts={{ placement, delay: 0 }}
      >
        Anchor
      </Button>,
    );
    await userEvent.tab();
    await expect.element(popoverRef.current).toBeVisible();
    await expect
      .poll(() => {
        const trigger = ref.current!.getBoundingClientRect();
        const hint = popoverRef.current!.getBoundingClientRect();
        return {
          top: trigger.top - hint.bottom,
          bottom: hint.top - trigger.bottom,
          left: trigger.left - hint.right,
          right: hint.left - trigger.right,
        }[placement];
      })
      .toBeCloseTo(8, 0);
  });
}

test("flips above a bottom-edge trigger and keeps long content within the viewport", async () => {
  const ref = createRef<HTMLButtonElement>();
  const popoverRef = createRef<HTMLDivElement>();
  await page.renderWithProviders(
    <Button
      ref={ref}
      popoverRef={popoverRef}
      style={{ position: "fixed", bottom: 8, right: 8 }}
      tooltip="A longer description that should remain fully inside the viewport even when the trigger is close to its bottom-right corner."
    >
      Edge
    </Button>,
  );
  await userEvent.tab();
  await expect.element(popoverRef.current).toBeVisible();
  await expect
    .poll(() => {
      const trigger = ref.current!.getBoundingClientRect();
      const hint = popoverRef.current!.getBoundingClientRect();
      return (
        hint.bottom <= trigger.top - 8 &&
        hint.left >= 0 &&
        hint.right <= innerWidth &&
        hint.top >= 0
      );
    })
    .toBe(true);
});
