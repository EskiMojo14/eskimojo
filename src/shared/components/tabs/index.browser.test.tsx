import { expect, test, vi } from "vite-plus/test";
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

test.each(["ltr", "rtl"] as const)(
  "%s compact horizontal tabs activate beyond their visible block edge",
  async (direction) => {
    using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();
    const onValueChange = vi.fn<(value: string) => void>();

    const result = await page.renderWithProviders(
      <div data-testid="hit-area" dir={direction} style={{ paddingBlock: "8px" }}>
        <Tabs defaultValue="first" onValueChange={onValueChange}>
          <TabList aria-label="Horizontal sections">
            <Tab value="first">First</Tab>
            <Tab value="last">Last</Tab>
          </TabList>
          <TabPanel value="first">First panel</TabPanel>
          <TabPanel value="last">Last panel</TabPanel>
        </Tabs>
      </div>,
      {
        preferences: { density: "small" },
        syncPreferencesToDocument: true,
      },
    );

    const last = result.getByRole("tab", { name: "Last" });
    const hitArea = result.getByTestId("hit-area").element();
    const bounds = last.element().getBoundingClientRect();
    const hitAreaBounds = hitArea.getBoundingClientRect();

    await userEvent.pointer({
      target: hitArea,
      coords: {
        x: bounds.left + bounds.width / 2 - hitAreaBounds.left,
        y: bounds.bottom + 1 - hitAreaBounds.top,
      },
      keys: "[MouseLeft]",
    });

    await expect.element(last).toHaveAttribute("aria-selected", "true");
    await expect.element(result.getByRole("tabpanel", { name: "Last" })).toBeVisible();
    expect(onValueChange).toHaveBeenCalledExactlyOnceWith("last");
    expect(triggerHaptic).toHaveBeenCalledOnce();
  },
);

test("compact vertical tabs keep edge and neighboring targets independently clickable", async () => {
  using triggerHaptic = vi.spyOn(WebHaptics.prototype, "trigger").mockResolvedValue();
  const onValueChange = vi.fn<(value: string) => void>();

  const result = await page.renderWithProviders(
    <div data-testid="hit-area" style={{ paddingBlock: "8px" }}>
      <Tabs defaultValue="last" onValueChange={onValueChange}>
        <TabList aria-label="Vertical sections" orientation="vertical">
          <Tab value="first">First</Tab>
          <Tab value="middle">Middle</Tab>
          <Tab value="last">Last</Tab>
        </TabList>
        <TabPanel value="first">First panel</TabPanel>
        <TabPanel value="middle">Middle panel</TabPanel>
        <TabPanel value="last">Last panel</TabPanel>
      </Tabs>
    </div>,
    {
      preferences: { density: "small" },
      syncPreferencesToDocument: true,
    },
  );

  const first = result.getByRole("tab", { name: "First" });
  const hitArea = result.getByTestId("hit-area").element();
  const hitAreaBounds = hitArea.getBoundingClientRect();
  const firstBounds = first.element().getBoundingClientRect();

  await userEvent.pointer({
    target: hitArea,
    coords: {
      x: firstBounds.left + firstBounds.width / 2 - hitAreaBounds.left,
      y: firstBounds.top - 1 - hitAreaBounds.top,
    },
    keys: "[MouseLeft]",
  });

  await expect.element(first).toHaveAttribute("aria-selected", "true");
  expect(onValueChange).toHaveBeenLastCalledWith("first");

  const middle = result.getByRole("tab", { name: "Middle" });
  const middleBounds = middle.element().getBoundingClientRect();

  await userEvent.pointer({
    target: hitArea,
    coords: {
      x: middleBounds.left + middleBounds.width / 2 - hitAreaBounds.left,
      y: middleBounds.bottom + 3 - hitAreaBounds.top,
    },
    keys: "[MouseLeft]",
  });

  await expect.element(middle).toHaveAttribute("aria-selected", "true");
  expect(onValueChange).toHaveBeenLastCalledWith("middle");

  const last = result.getByRole("tab", { name: "Last" });
  const lastBounds = last.element().getBoundingClientRect();

  await userEvent.pointer({
    target: hitArea,
    coords: {
      x: lastBounds.left + lastBounds.width / 2 - hitAreaBounds.left,
      y: lastBounds.bottom + 1 - hitAreaBounds.top,
    },
    keys: "[MouseLeft]",
  });

  await expect.element(last).toHaveAttribute("aria-selected", "true");
  expect(onValueChange).toHaveBeenLastCalledWith("last");
  expect(triggerHaptic).toHaveBeenCalledTimes(3);
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
