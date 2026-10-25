import { useState } from "react";
import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import { MdSymbol } from "#/shared/components/symbol";

import { Tab, TabList, TabPanel, Tabs } from "./index";

const meta = preview.meta({
  title: "Components/Tabs",
  component: Tabs,
  parameters: {
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Material 3 primary and secondary tabs with automatic activation. Horizontal primary tabs stack 24px icons above their labels with a 2px gap and a 64px minimum height (48px without icons). They use the title-small type token. Horizontal lists share a spring-animated indicator. Primary indicators are 3px thick and match the icon-and-label content width, excluding button padding. Secondary indicators are 2px thick, square-ended, and span the entire tab button. Reduced motion disables the slide. Use a labelled TabList inside Tabs, and pair every Tab value with a TabPanel value. Left/Right arrows move through horizontal tabs and follow reading direction; Up/Down move through vertical tabs; Home/End jump to the ends. Disabled tabs are skipped and narrow tab lists scroll horizontally. Tabs supports controlled value/onValueChange and defaultValue.",
      },
    },
  },
});

export const Primary = meta.story({
  render: () => (
    <Tabs defaultValue="overview">
      <TabList aria-label="Project details">
        <Tab value="overview" icon={<MdSymbol>space_dashboard</MdSymbol>}>
          Overview
        </Tab>
        <Tab value="activity" icon={<MdSymbol>history</MdSymbol>}>
          Activity
        </Tab>
        <Tab value="settings" icon={<MdSymbol>settings</MdSymbol>}>
          Settings
        </Tab>
      </TabList>
      <TabPanel value="overview">
        <p>Project overview content.</p>
      </TabPanel>
      <TabPanel value="activity">
        <p>Recent project activity.</p>
      </TabPanel>
      <TabPanel value="settings">
        <p>Project settings.</p>
      </TabPanel>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "MD3 primary icon-and-label tabs: 64px height, 24px icons stacked above title-small labels, and a 2px icon-to-label gap. The 3px indicator follows the content width.",
      },
    },
  },
  play: async ({ canvas, userEvent, globals }) => {
    const overview = canvas.getByRole("tab", { name: "Overview" });
    const activity = canvas.getByRole("tab", { name: "Activity" });
    await userEvent.click(overview);
    await userEvent.keyboard(globals.direction === "rtl" ? "{ArrowLeft}" : "{ArrowRight}");
    await expect(activity).toHaveFocus();
    await expect(activity).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tabpanel")).toHaveTextContent("Recent project activity.");
  },
});

export const PrimaryWithoutIcons = meta.story({
  render: () => (
    <Tabs defaultValue="overview">
      <TabList aria-label="Project details">
        <Tab value="overview">Overview</Tab>
        <Tab value="activity">Activity</Tab>
        <Tab value="settings">Settings</Tab>
      </TabList>
      <TabPanel value="overview">
        <p>Project overview content.</p>
      </TabPanel>
      <TabPanel value="activity">
        <p>Recent project activity.</p>
      </TabPanel>
      <TabPanel value="settings">
        <p>Project settings.</p>
      </TabPanel>
    </Tabs>
  ),
  parameters: {
    docs: {
      description: {
        story:
          "MD3 text-only primary tabs: 48px height, title-small labels (14px with a 20px line height), 16px horizontal padding, and a 3px rounded-top indicator matching the label width. Uses the project's Paper Mono font and theme-aware medium weight.",
      },
    },
  },
  play: async ({ canvas, userEvent, globals }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Overview" }));
    await userEvent.keyboard(globals.direction === "rtl" ? "{ArrowLeft}" : "{ArrowRight}");
    const activity = canvas.getByRole("tab", { name: "Activity" });
    await expect(activity).toHaveFocus();
    await expect(activity).toHaveAttribute("aria-selected", "true");
    await expect(canvas.getByRole("tabpanel", { name: "Activity" })).toHaveTextContent(
      "Recent project activity.",
    );
  },
});

export const Secondary = meta.story({
  render: () => (
    <Tabs defaultValue="tracks" variant="secondary">
      <TabList aria-label="Music collection">
        <Tab value="tracks">Tracks</Tab>
        <Tab value="artists">Artists</Tab>
      </TabList>
      <TabPanel value="tracks">
        <p>Recently played tracks.</p>
      </TabPanel>
      <TabPanel value="artists">
        <p>Top artists.</p>
      </TabPanel>
    </Tabs>
  ),
});

function VerticalTabsDemo({
  variant = "primary",
  icons = false,
}: {
  variant?: "primary" | "secondary";
  icons?: boolean;
}) {
  return (
    <Tabs
      defaultValue="overview"
      variant={variant}
      style={{ display: "flex", alignItems: "flex-start", gap: 24, maxWidth: 640 }}
    >
      <TabList aria-label="Project sections" orientation="vertical" style={{ flexShrink: 0 }}>
        <Tab value="overview" icon={icons ? <MdSymbol>space_dashboard</MdSymbol> : undefined}>
          Overview
        </Tab>
        <Tab value="activity" icon={icons ? <MdSymbol>history</MdSymbol> : undefined}>
          Activity
        </Tab>
        <Tab value="archive" icon={icons ? <MdSymbol>archive</MdSymbol> : undefined} disabled>
          Archive
        </Tab>
        <Tab value="settings" icon={icons ? <MdSymbol>settings</MdSymbol> : undefined}>
          Settings
        </Tab>
      </TabList>
      <div style={{ minWidth: 0 }}>
        <TabPanel value="overview">
          <h2>Project overview</h2>
          <p>A summary of the project, its goals, and the latest updates.</p>
        </TabPanel>
        <TabPanel value="activity">
          <h2>Recent activity</h2>
          <p>Browse recent contributions and milestones.</p>
        </TabPanel>
        <TabPanel value="archive">
          <h2>Archive</h2>
          <p>Archived content is currently unavailable.</p>
        </TabPanel>
        <TabPanel value="settings">
          <h2>Project settings</h2>
          <p>Manage project preferences and configuration.</p>
        </TabPanel>
      </div>
    </Tabs>
  );
}

export const VerticalPrimary = meta.story({
  render: () => <VerticalTabsDemo icons />,
  parameters: {
    docs: {
      description: {
        story:
          "A vertical adaptation of primary tabs with leading icons and an adjacent content panel. Up/Down activate tabs and wrap at the ends; Home/End jump to the first/last available tab. The disabled Archive tab is skipped. Vertical tabs are a project extension, not a standard MD3 tab layout.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("tablist", { name: "Project sections" })).toHaveAttribute(
      "aria-orientation",
      "vertical",
    );
    await userEvent.click(canvas.getByRole("tab", { name: "Overview" }));
    await userEvent.keyboard("{ArrowDown}");
    await expect(canvas.getByRole("tab", { name: "Activity" })).toHaveFocus();
    await expect(canvas.getByRole("tabpanel", { name: "Activity" })).toBeVisible();
    await userEvent.keyboard("{ArrowDown}");
    await expect(canvas.getByRole("tab", { name: "Settings" })).toHaveFocus();
    await expect(canvas.getByRole("tabpanel", { name: "Settings" })).toBeVisible();
    await userEvent.keyboard("{ArrowDown}");
    await expect(canvas.getByRole("tab", { name: "Overview" })).toHaveFocus();
  },
});

export const VerticalPrimaryWithoutIcons = meta.story({
  render: () => <VerticalTabsDemo />,
  parameters: {
    docs: {
      description: {
        story:
          "Text-only vertical primary tabs with side-by-side content. This is a project-specific vertical adaptation of MD3 styling.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Overview" }));
    await userEvent.keyboard("{End}");
    await expect(canvas.getByRole("tab", { name: "Settings" })).toHaveFocus();
    await expect(canvas.getByRole("tabpanel", { name: "Settings" })).toBeVisible();
    await userEvent.keyboard("{Home}");
    await expect(canvas.getByRole("tab", { name: "Overview" })).toHaveFocus();
    await expect(canvas.getByRole("tabpanel", { name: "Overview" })).toBeVisible();
  },
});

export const VerticalSecondary = meta.story({
  render: () => <VerticalTabsDemo variant="secondary" />,
  parameters: {
    docs: {
      description: {
        story:
          "The secondary visual treatment in a vertical, side-by-side layout. Up/Down navigation stays vertical in both LTR and RTL. This layout is a project extension to MD3.",
      },
    },
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Settings" }));
    await userEvent.keyboard("{ArrowUp}");
    await expect(canvas.getByRole("tab", { name: "Activity" })).toHaveFocus();
    await expect(canvas.getByRole("tabpanel", { name: "Activity" })).toBeVisible();
    await expect(canvas.getByRole("tab", { name: "Archive" })).toBeDisabled();
  },
});

function ControlledTabs() {
  const [value, setValue] = useState("about");
  return (
    <>
      <Tabs value={value} onValueChange={setValue}>
        <TabList aria-label="Profile">
          <Tab value="about" icon={<MdSymbol>person</MdSymbol>}>
            About
          </Tab>
          <Tab value="work" icon={<MdSymbol>work</MdSymbol>}>
            Work
          </Tab>
        </TabList>
        <TabPanel value="about">
          <p>Personal profile.</p>
        </TabPanel>
        <TabPanel value="work">
          <p>Selected work.</p>
        </TabPanel>
      </Tabs>
      <output aria-live="polite">Current section: {value}</output>
    </>
  );
}

export const Controlled = meta.story({
  render: () => <ControlledTabs />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("tab", { name: "Work" }));
    await expect(canvas.getByRole("status")).toHaveTextContent("Current section: work");
  },
});

export const DisabledTab = meta.story({
  render: () => (
    <Tabs defaultValue="recent">
      <TabList aria-label="Reports">
        <Tab value="recent">Recent</Tab>
        <Tab value="archived" disabled>
          Archived
        </Tab>
        <Tab value="all">All reports</Tab>
      </TabList>
      <TabPanel value="recent">
        <p>Recent reports.</p>
      </TabPanel>
      <TabPanel value="archived">
        <p>Archived reports.</p>
      </TabPanel>
      <TabPanel value="all">
        <p>All reports.</p>
      </TabPanel>
    </Tabs>
  ),
});
