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

import { ExternalLinkButton, InternalLinkButton } from "./index";

const meta = preview.meta({
  title: "Components/Buttons/LinkButton",
  component: ExternalLinkButton,
  parameters: {
    layout: "centered",
    a11y: { test: "error" },
    docs: {
      description: {
        component:
          "Semantic anchors sharing Button's variants, optional extra-small through extra-large sizes, decorative icon slot, tooltip support, native anchor props and refs. Size defaults to small (40px). ExternalLinkButton opens href in a new tab with noopener noreferrer by default. InternalLinkButton shares the base with TanStack createLink for typed destinations, search, params and active state, and stays in the current tab. Links navigate rather than expose a button role. Styles are supplied by the shared button stylesheet.",
      },
    },
  },
});

export const External = meta.story({
  args: {
    href: "https://open.spotify.com",
    children: "Open Spotify",
    icon: <MdSymbol>open_in_new</MdSymbol>,
    tooltip: "Browse Spotify",
  },
});

export const Variants = meta.story({
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      {(["filled", "tonal", "elevated", "outlined", "text"] as const).map((variant) => (
        <ExternalLinkButton key={variant} href="https://www.youtube.com" variant={variant}>
          {variant}
        </ExternalLinkButton>
      ))}
    </div>
  ),
});

export const Sizes = meta.story({
  render: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "start" }}>
      {(["extra-small", "small", "medium", "large", "extra-large"] satisfies Array<ButtonSize>).map(
        (size) => (
          <ExternalLinkButton key={size} size={size} href="https://example.com">
            {size}
          </ExternalLinkButton>
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
          'Non-false aria-current values use the selected button styling, including shape, icon fill and forced-colors treatment. Omit aria-current or use "false" for a non-current link; do not add aria-pressed to navigation links.',
      },
    },
  },
  render: () => (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 16 }}>
      {(["filled", "tonal", "elevated", "outlined", "text"] as const).map((variant) => (
        <ExternalLinkButton key={variant} href="#current" variant={variant} aria-current="page">
          {variant}
        </ExternalLinkButton>
      ))}
      <ExternalLinkButton href="#other" variant="filled" aria-current="false">
        Not current
      </ExternalLinkButton>
    </div>
  ),
});

function createDemoRouter() {
  const root = createRootRoute({
    component: () => (
      <>
        <InternalLinkButton to="/projects">View projects</InternalLinkButton>
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
