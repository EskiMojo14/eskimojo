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
          "Primary navigation in an MD3 list, shown alongside the large flexible app bar that opens it. The drawer keeps its compact site-identity header; the app bar places the page title below its navigation/actions row. It is a permanent navigation drawer on larger screens and a modal navigation drawer on small screens. Preferences is only available from the app bar, never from inside the drawer. Decorative artwork follows the palette selected on <html>: Goat for goat (the default), and OC for arctic.",
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
