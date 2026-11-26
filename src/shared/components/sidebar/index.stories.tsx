import { useState } from "react";
import { expect } from "storybook/test";

import preview from "#.storybook/preview";
import { Route as HomeRoute } from "#/routes/_home";
import { AppBar } from "#/shared/components/app-bar";

import { Sidebar } from "./index";

const meta = preview.meta({
  title: "Components/Sidebar",
  component: NavigationLayout,
  argTypes: { christmas: { control: false } },
  parameters: {
    layout: "fullscreen",
    tanstack: { router: { route: HomeRoute } },
    docs: {
      description: {
        component:
          "Primary navigation in an MD3 list, shown alongside the large flexible app bar that opens it. The drawer keeps its compact site-identity header and artwork. It is persistent above 48rem and modal from 37.5rem through 48rem; below 37.5rem the app bar supplies four-destination bottom navigation instead. Preferences stays in the top app bar. The circular palette switcher remains a two-way Goat/Arctic toggle, sliding between the Goat and OC portraits. Pointer and keyboard presses use the shared unbounded ripple above the portraits, clipped to the circular button; reduced motion uses static pressed feedback and switches portraits immediately. Decorative artwork follows the palette selected on <html>: Goat for goat (the default), and OC for arctic.",
      },
    },
  },
});

function NavigationLayout({ christmas = false }: { christmas?: boolean }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="app-shell" data-christmas={christmas || undefined}>
      <Sidebar open={open} onClose={() => setOpen(false)} christmas={christmas} />
      <div className="app-shell__main">
        <AppBar navigationOpen={open} onOpenNavigation={() => setOpen(true)} />
      </div>
    </div>
  );
}

export const Default = meta.story({});

export const Christmas = meta.story({
  args: { christmas: true },
  play: async ({ canvasElement }) => {
    await expect(
      canvasElement.querySelector('img[src="/Goat-avatar-christmas.webp"]'),
    ).toBeInTheDocument();
  },
});

export const ScrollingPage = meta.story({
  render: () => (
    <div className="app-shell">
      <Sidebar open={false} onClose={() => {}} />
      <main className="app-shell__main">
        {Array.from({ length: 40 }, (_value, index) => (
          <p key={index}>Page content {index + 1}. The desktop navigation stays in place.</p>
        ))}
      </main>
    </div>
  ),
});
