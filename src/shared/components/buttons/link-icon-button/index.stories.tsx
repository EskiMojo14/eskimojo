import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { useState } from "react";
import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import type { ButtonSize } from "#/shared/components/buttons/button";
import { MdSymbol } from "#/shared/components/symbol";

import { ExternalLinkIconButton, InternalLinkIconButton } from "./index";

const meta = preview.meta({
  title: "Components/Buttons/LinkIconButton",
  component: ExternalLinkIconButton,
  parameters: {
    layout: "centered",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Native anchors using IconButton's standard, filled, tonal and outlined variants and optional extra-small through extra-large sizes. Size defaults to small (40px). Supply an icon and either aria-label or aria-labelledby; icons are decorative. ExternalLinkIconButton accepts native anchor props and refs plus tooltip options, and opens a new tab with noopener noreferrer by default. InternalLinkIconButton shares the base with TanStack createLink for typed routes, params, search and active state, and stays in the current tab. Uses the shared icon-button stylesheet.",
      },
    },
  },
});

export const External = meta.story({
  args: {
    href: "https://www.youtube.com",
    "aria-label": "Open YouTube",
    icon: <MdSymbol>open_in_new</MdSymbol>,
    tooltip: "Open YouTube",
    tooltipAsLabel: true,
  },
});

export const Variants = meta.story({
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      {(["standard", "filled", "tonal", "outlined"] as const).map((variant) => (
        <ExternalLinkIconButton
          key={variant}
          variant={variant}
          href="https://www.youtube.com"
          aria-label={`${variant} YouTube link`}
          icon={<MdSymbol>open_in_new</MdSymbol>}
        />
      ))}
    </div>
  ),
});

export const Sizes = meta.story({
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "start" }}>
      {(["extra-small", "small", "medium", "large", "extra-large"] satisfies Array<ButtonSize>).map(
        (size) => (
          <ExternalLinkIconButton
            key={size}
            size={size}
            variant="tonal"
            href="https://example.com"
            aria-label={`${size} link`}
            icon={<MdSymbol>open_in_new</MdSymbol>}
          />
        ),
      )}
    </div>
  ),
});

export const Current = meta.story({
  parameters: {
    docs: {
      description: {
        story:
          'Non-false aria-current values use the selected icon-button colors and icon fill. Omitted aria-current and aria-current="false" stay unselected. Navigation links do not need aria-pressed.',
      },
    },
  },
  render: () => (
    <div style={{ display: "flex", gap: 8 }}>
      {(["standard", "filled", "tonal", "outlined"] as const).map((variant) => (
        <ExternalLinkIconButton
          key={variant}
          href="#current"
          variant={variant}
          aria-current="page"
          aria-label={`Current ${variant} link`}
          icon={<MdSymbol>folder</MdSymbol>}
        />
      ))}
      <ExternalLinkIconButton
        href="#other"
        variant="filled"
        aria-current="false"
        aria-label="Not current"
        icon={<MdSymbol>folder</MdSymbol>}
      />
    </div>
  ),
});

function createDemoRouter() {
  const root = createRootRoute({
    component: () => (
      <>
        <InternalLinkIconButton
          to="/projects"
          aria-label="View projects"
          icon={<MdSymbol>folder</MdSymbol>}
          tooltip="View projects"
          tooltipAsLabel
        />
        <Outlet />
      </>
    ),
  });
  return createRouter({
    routeTree: root.addChildren([
      createRoute({ getParentRoute: () => root, path: "/", component: () => <p>Home</p> }),
      createRoute({
        getParentRoute: () => root,
        path: "/projects",
        component: () => <p>Projects loaded</p>,
      }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/"] }),
  });
}

function InternalDemo() {
  const [router] = useState(createDemoRouter);
  return <RouterProvider router={router} />;
}

export const Internal = meta.story({
  render: () => <InternalDemo />,
  play: async ({ canvas, userEvent }) => {
    const link = canvas.getByRole("link", { name: "View projects" });
    await expect(link).toHaveAttribute("href", "/projects");
    await expect(link).not.toHaveAttribute("target");
    await userEvent.tab();
    await expect(link).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    await expect(canvas.getByText("Projects loaded")).toBeVisible();
    await expect(link).toHaveAttribute("aria-current", "page");
  },
});
