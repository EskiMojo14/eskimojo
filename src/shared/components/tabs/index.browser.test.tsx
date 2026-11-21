import { expect, onTestFinished, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";
import { WebHaptics } from "web-haptics";

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
  using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();
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
  expect(triggerHaptic).toHaveBeenCalledExactlyOnceWith("selection", undefined);
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(first).toHaveFocus();
});

test("compact tabs keep 48px pseudo targets out of layout", async () => {
  const root = document.documentElement;
  const previousDensity = root.style.getPropertyValue("--md-density");

  onTestFinished(() => {
    if (previousDensity) root.style.setProperty("--md-density", previousDensity);
    else root.style.removeProperty("--md-density");
  });

  root.style.setProperty("--md-density", "-2");

  const result = await page.renderWithProviders(
    <>
      <Tabs defaultValue="horizontal">
        <TabList aria-label="Horizontal sections">
          <Tab value="horizontal">Horizontal</Tab>
          <Tab value="horizontal-next">Next</Tab>
        </TabList>
        <TabPanel value="horizontal">Horizontal panel</TabPanel>
        <TabPanel value="horizontal-next">Next panel</TabPanel>
      </Tabs>
      <Tabs defaultValue="vertical">
        <TabList aria-label="Vertical sections" orientation="vertical">
          <Tab value="vertical">Vertical</Tab>
          <Tab value="vertical-next">Next</Tab>
        </TabList>
        <TabPanel value="vertical">Vertical panel</TabPanel>
        <TabPanel value="vertical-next">Next panel</TabPanel>
      </Tabs>
    </>,
  );

  const horizontalList = result.getByRole("tablist", { name: "Horizontal sections" }).element();
  const horizontal = result.getByRole("tab", { name: "Horizontal" }).element();
  const horizontalBounds = horizontal.getBoundingClientRect();
  const horizontalHitArea = getComputedStyle(horizontal, "::before");

  expect(horizontalBounds.height).toBeLessThan(48);
  expect(Number.parseFloat(horizontalHitArea.blockSize)).toBeGreaterThanOrEqual(48);
  expect(horizontalBounds.top).toBe(horizontalList.getBoundingClientRect().top);

  const verticalList = result.getByRole("tablist", { name: "Vertical sections" }).element();
  const vertical = result.getByRole("tab", { name: "Vertical" }).element();

  const verticalNext = result
    .getByRole("tablist", { name: "Vertical sections" })
    .getByRole("tab", { name: "Next" })
    .element();

  const verticalBounds = vertical.getBoundingClientRect();
  const verticalHitArea = getComputedStyle(vertical, "::before");

  expect(verticalBounds.height).toBeLessThan(48);
  expect(Number.parseFloat(verticalHitArea.blockSize)).toBeGreaterThanOrEqual(48);
  expect(verticalBounds.top).toBe(verticalList.getBoundingClientRect().top);
  expect(verticalNext.getBoundingClientRect().top).toBe(verticalBounds.bottom);
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

test("decorative icons do not affect tab names or panel selection", async () => {
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

  await expect.element(result.getByRole("tab", { name: "Overview", exact: true })).toBeVisible();
  await expect.element(result.getByRole("img")).not.toBeInTheDocument();
  await result.getByRole("tab", { name: "Settings", exact: true }).click();
  await expect.element(result.getByRole("tabpanel", { name: "Settings" })).toBeVisible();
});
