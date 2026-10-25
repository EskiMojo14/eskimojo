import { expect, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { MdSymbol } from "#/shared/components/symbol";

import { Tab, TabList, TabPanel, Tabs } from "./index";

function TabExample({
  orientation = "horizontal",
  direction,
}: {
  orientation?: "horizontal" | "vertical";
  direction?: "ltr" | "rtl";
}) {
  return (
    <Tabs defaultValue="first" dir={direction}>
      <TabList aria-label="Sections" orientation={orientation}>
        <Tab value="first">First</Tab>
        <Tab value="disabled" disabled>
          Disabled
        </Tab>
        <Tab value="last">Last</Tab>
      </TabList>
      <TabPanel value="first">First panel</TabPanel>
      <TabPanel value="disabled">Disabled panel</TabPanel>
      <TabPanel value="last">Last panel</TabPanel>
    </Tabs>
  );
}

test("tab relationships, selection, activation, and arrow navigation", async () => {
  const onValueChange = vi.fn<(value: string) => void>();
  const result = await page.renderWithProviders(
    <Tabs defaultValue="first" onValueChange={onValueChange}>
      <TabList aria-label="Sections">
        <Tab value="first">First</Tab>
        <Tab value="second">Second</Tab>
      </TabList>
      <TabPanel value="first">First panel</TabPanel>
      <TabPanel value="second">Second panel</TabPanel>
    </Tabs>,
  );
  const first = result.getByRole("tab", { name: "First" });
  const second = result.getByRole("tab", { name: "Second" });
  await expect.element(first).toHaveAttribute("aria-selected", "true");
  await expect.element(first).toHaveAttribute("aria-controls");
  await expect.element(result.getByRole("tabpanel")).toHaveTextContent("First panel");
  await userEvent.tab();
  await expect.element(first).toHaveFocus();
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(second).toHaveFocus();
  await expect.element(second).toHaveAttribute("aria-selected", "true");
  await expect.element(result.getByRole("tabpanel")).toHaveTextContent("Second panel");
  expect(onValueChange).toHaveBeenCalledExactlyOnceWith("second");
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(first).toHaveFocus();
});

test("wraps in RTL and skips disabled tabs", async () => {
  const result = await page.renderWithProviders(<TabExample direction="rtl" />);
  await userEvent.tab();
  await expect.element(result.getByRole("tab", { name: "First" })).toHaveFocus();
  await userEvent.keyboard("{ArrowLeft}");
  await expect.element(result.getByRole("tab", { name: "Last" })).toHaveFocus();
});

test("vertical tabs use Up and Down arrows", async () => {
  const result = await page.renderWithProviders(<TabExample orientation="vertical" />);
  await userEvent.tab();
  await userEvent.keyboard("{ArrowDown}");
  await expect.element(result.getByRole("tab", { name: "Last" })).toHaveFocus();
  await userEvent.keyboard("{ArrowUp}");
  await expect.element(result.getByRole("tab", { name: "First" })).toHaveFocus();
});

test("Home and End select the first and last enabled tabs", async () => {
  const result = await page.renderWithProviders(<TabExample />);
  await userEvent.tab();
  await userEvent.keyboard("{End}");
  await expect.element(result.getByRole("tab", { name: "Last" })).toHaveFocus();
  await userEvent.keyboard("{Home}");
  await expect.element(result.getByRole("tab", { name: "First" })).toHaveFocus();
});

test("uses the first enabled tab as the tab stop when the selected tab is disabled", async () => {
  const result = await page.renderWithProviders(
    <Tabs defaultValue="disabled">
      <TabList aria-label="Sections">
        <Tab value="disabled" disabled>
          Disabled
        </Tab>
        <Tab value="available">Available</Tab>
      </TabList>
      <TabPanel value="disabled">Disabled panel</TabPanel>
      <TabPanel value="available">Available panel</TabPanel>
    </Tabs>,
  );
  await expect
    .element(result.getByRole("tab", { name: "Available" }))
    .toHaveAttribute("tabindex", "0");
  await userEvent.tab();
  await expect.element(result.getByRole("tab", { name: "Available" })).toHaveFocus();
});

test("controlled tabs notify changes without changing until their value updates", async () => {
  const onValueChange = vi.fn<(value: string) => void>();
  const result = await page.renderWithProviders(
    <Tabs value="first" onValueChange={onValueChange}>
      <TabList aria-label="Sections">
        <Tab value="first">First</Tab>
        <Tab value="second">Second</Tab>
      </TabList>
      <TabPanel value="first">First panel</TabPanel>
      <TabPanel value="second">Second panel</TabPanel>
    </Tabs>,
  );
  await result.getByRole("tab", { name: "Second" }).click();
  expect(onValueChange).toHaveBeenCalledExactlyOnceWith("second");
  await expect
    .element(result.getByRole("tab", { name: "First" }))
    .toHaveAttribute("aria-selected", "true");
});

function indicatorBounds(list: Element) {
  const style = getComputedStyle(list, "::after");
  return {
    left:
      list.getBoundingClientRect().left +
      list.clientLeft +
      Number.parseFloat(style.left) -
      list.scrollLeft,
    width: Number.parseFloat(style.width),
  };
}

function labelIn(tab: Element) {
  const label = tab.querySelector<HTMLElement>(".tabs__content");
  if (!label) throw new Error("Expected a tab label.");
  return label;
}

test("primary icon tabs use MD3 stacked icons, spacing, and container dimensions", async () => {
  const result = await page.renderWithProviders(
    <Tabs defaultValue="overview">
      <TabList aria-label="Project details">
        <Tab value="overview" icon={<MdSymbol>space_dashboard</MdSymbol>}>
          Overview
        </Tab>
        <Tab value="settings" icon={<MdSymbol>settings</MdSymbol>}>
          Settings
        </Tab>
      </TabList>
      <TabPanel value="overview">Overview panel</TabPanel>
      <TabPanel value="settings">Settings panel</TabPanel>
    </Tabs>,
  );
  await document.fonts.ready;
  const tab = result.getByRole("tab", { name: "Overview", exact: true }).element();
  const icon = tab.querySelector<HTMLElement>(".tabs__icon");
  const symbol = icon?.querySelector<HTMLElement>(".md-symbol");
  const label = tab.querySelector<HTMLElement>(".tabs__label");
  if (!icon || !symbol || !label) throw new Error("Expected tab icon, symbol, and label.");
  const iconBounds = icon.getBoundingClientRect();
  const labelBounds = label.getBoundingClientRect();
  expect(iconBounds.width).toBe(24);
  expect(iconBounds.height).toBe(24);
  expect(symbol.getBoundingClientRect().width).toBe(24);
  expect(symbol.getBoundingClientRect().height).toBe(24);
  expect(labelBounds.top - iconBounds.bottom).toBeCloseTo(2);
  expect(iconBounds.left + iconBounds.width / 2).toBeCloseTo(
    labelBounds.left + labelBounds.width / 2,
  );
  expect(tab.getBoundingClientRect().height).toBe(64);
  await expect.element(icon).toHaveAttribute("aria-hidden", "true");
  await result.getByRole("tab", { name: "Settings", exact: true }).click();
  await expect.element(result.getByRole("tabpanel", { name: "Settings" })).toBeVisible();
});

test("text-only primary tabs use MD3 height, typography, padding, and label-width indicator", async () => {
  const result = await page.renderWithProviders(
    <Tabs defaultValue="overview">
      <TabList aria-label="Project details">
        <Tab value="overview">Overview</Tab>
        <Tab value="activity">Activity</Tab>
      </TabList>
      <TabPanel value="overview">Overview panel</TabPanel>
      <TabPanel value="activity">Activity panel</TabPanel>
    </Tabs>,
  );
  await document.fonts.ready;
  const list = result.getByRole("tablist", { name: "Project details" }).element();
  const tab = result.getByRole("tab", { name: "Overview", exact: true }).element();
  const label = labelIn(tab);
  const style = getComputedStyle(tab);
  expect(tab.getBoundingClientRect().height).toBe(48);
  expect(tab.querySelector(".tabs__icon")).toBeNull();
  expect(style.fontSize).toBe("14px");
  expect(style.lineHeight).toBe("20px");
  expect(style.paddingInlineStart).toBe("16px");
  expect(style.paddingInlineEnd).toBe("16px");
  expect(getComputedStyle(list, "::after").height).toBe("3px");
  await expect
    .poll(() => Math.abs(indicatorBounds(list).left - label.getBoundingClientRect().left))
    .toBeLessThan(1);
  await expect
    .poll(() => Math.abs(indicatorBounds(list).width - label.getBoundingClientRect().width))
    .toBeLessThan(1);
});

for (const variant of ["primary", "secondary"] as const) {
  for (const direction of ["ltr", "rtl"] as const) {
    test(`${variant} indicator matches ${variant === "primary" ? "icon-and-label" : "button"} widths in ${direction}`, async () => {
      const result = await page.renderWithProviders(
        <Tabs defaultValue="short" variant={variant} dir={direction} style={{ width: 360 }}>
          <TabList aria-label="Animated sections">
            <Tab value="short" icon={<span>icon</span>}>
              Short
            </Tab>
            <Tab value="long">A much longer label</Tab>
          </TabList>
          <TabPanel value="short">Short panel</TabPanel>
          <TabPanel value="long">Long panel</TabPanel>
        </Tabs>,
      );
      await document.fonts.ready;
      const list = result.getByRole("tablist", { name: "Animated sections" }).element();
      const shortTab = result.getByRole("tab", { name: "Short" }).element();
      const longTab = result.getByRole("tab", { name: "A much longer label" }).element();
      const short = variant === "primary" ? labelIn(shortTab) : shortTab;
      const long = variant === "primary" ? labelIn(longTab) : longTab;
      await expect
        .poll(() => Math.abs(indicatorBounds(list).left - short.getBoundingClientRect().left))
        .toBeLessThan(1);
      await expect
        .poll(() => Math.abs(indicatorBounds(list).width - short.getBoundingClientRect().width))
        .toBeLessThan(1);
      expect(getComputedStyle(list, "::after").height).toBe(variant === "primary" ? "3px" : "2px");
      expect(getComputedStyle(list, "::after").borderTopLeftRadius === "0px").toBe(
        variant === "secondary",
      );
      expect(getComputedStyle(list, "::after").borderTopRightRadius === "0px").toBe(
        variant === "secondary",
      );

      await result.getByRole("tab", { name: "A much longer label" }).click();
      await expect
        .poll(() =>
          list
            .getAnimations({ subtree: true })
            .some(
              (animation) =>
                animation instanceof CSSTransition && animation.transitionProperty === "left",
            ),
        )
        .toBe(true);
      await expect
        .poll(() => Math.abs(indicatorBounds(list).left - long.getBoundingClientRect().left))
        .toBeLessThan(1);
      await expect
        .poll(() => Math.abs(indicatorBounds(list).width - long.getBoundingClientRect().width))
        .toBeLessThan(1);
    });
  }
}

function independentLists(label: string) {
  return (
    <>
      <Tabs defaultValue="first">
        <TabList aria-label="Independent list">
          <Tab value="first">Independent</Tab>
        </TabList>
        <TabPanel value="first">Independent panel</TabPanel>
      </Tabs>
      <Tabs defaultValue="last" style={{ width: 200 }}>
        <TabList aria-label="Scrollable list">
          <Tab value="first">First section</Tab>
          <Tab value="middle">Middle section</Tab>
          <Tab value="last">{label}</Tab>
        </TabList>
        <TabPanel value="first">First panel</TabPanel>
        <TabPanel value="middle">Middle panel</TabPanel>
        <TabPanel value="last">Last panel</TabPanel>
      </Tabs>
    </>
  );
}

test("indicators stay scoped to each list and follow scrolling and label changes", async () => {
  const result = await page.renderWithProviders(independentLists("Last section"));
  const independentList = result.getByRole("tablist", { name: "Independent list" }).element();
  const scrollableList = result.getByRole("tablist", { name: "Scrollable list" }).element();
  const independentLabel = labelIn(result.getByRole("tab", { name: "Independent" }).element());
  await expect
    .poll(() =>
      Math.abs(
        indicatorBounds(independentList).width - independentLabel.getBoundingClientRect().width,
      ),
    )
    .toBeLessThan(1);

  scrollableList.scrollLeft = scrollableList.scrollWidth;
  await result.rerender(independentLists("Updated last section"));
  const updatedLabel = labelIn(result.getByRole("tab", { name: "Updated last section" }).element());
  await expect
    .poll(() =>
      Math.abs(indicatorBounds(scrollableList).left - updatedLabel.getBoundingClientRect().left),
    )
    .toBeLessThan(1);
  await expect
    .poll(() =>
      Math.abs(indicatorBounds(scrollableList).width - updatedLabel.getBoundingClientRect().width),
    )
    .toBeLessThan(1);
});
