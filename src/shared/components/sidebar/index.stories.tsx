import { useState } from "react";

import preview from "#.storybook/preview";
import { Route as HomeRoute } from "#/routes/index";
import { AppBar } from "#/shared/components/app-bar";

import { Sidebar } from "./index";

const meta = preview.meta({
  title: "Components/Sidebar",
  component: NavigationLayout,
  parameters: {
    layout: "fullscreen",
    tanstack: { router: { route: HomeRoute } },
    docs: {
      description: {
        component:
          "Primary navigation in an MD3 list, shown alongside the large flexible app bar that opens it. The drawer keeps its compact site-identity header and artwork. It is persistent above 48rem and modal from 37.5rem through 48rem; below 37.5rem the app bar supplies four-destination bottom navigation instead. Preferences stays in the top app bar. The circular palette switcher slides between the Goat and OC portraits with a spatial spring, without changing its containing shape. Pointer and keyboard presses use the shared unbounded ripple above the portraits, clipped to the circular button; reduced motion uses static pressed feedback and switches portraits immediately. Decorative artwork follows the palette selected on <html>: Goat for goat (the default), and OC for arctic.",
      },
    },
  },
});

function NavigationLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="app-shell">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="app-shell__main">
        <AppBar navigationOpen={open} onOpenNavigation={() => setOpen(true)} />
      </div>
    </div>
  );
}

export const Default = meta.story({});

export const ScrollingPage = meta.story({
  render: () => (
    <div className="app-shell">
      <Sidebar open={false} onClose={() => {}} />
      <main className="app-shell__main">
        {Array.from({ length: 40 }, (_, index) => (
          <p key={index}>Page content {index + 1}. The desktop navigation stays in place.</p>
        ))}
      </main>
    </div>
  ),
});
