import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import * as copy from "#/routes/gigs.{-$breakdown}/-copy.tsx";
import { addNavigationTransitions } from "#/shared/lib/view-transitions";
import { observeViewTransitions } from "#test/browser/view-transition.test-utils";

import { GigsBreakdownTabs } from "./index";

function Demo() {
  return (
    <>
      <GigsBreakdownTabs />
      <div className="tabs__route-content">Gig breakdown content</div>
    </>
  );
}

test("gigs tabs infer direction for adjacent tabs, jumps, and the default tab alias", async () => {
  const root = createRootRoute();

  const router = createRouter({
    routeTree: root.addChildren([
      createRoute({
        getParentRoute: () => root,
        path: "/gigs/{-$breakdown}/",
        component: Demo,
      }),
    ]),
    history: createMemoryHistory({ initialEntries: ["/gigs"] }),
  });

  addNavigationTransitions(router);
  const result = await page.renderWithProviders(<RouterProvider router={router} />);
  await expect.element(result.getByRole("navigation", { name: copy.tabs.title })).toBeVisible();
  await expect.poll(() => router.state.status).toBe("idle");
  const transitions = observeViewTransitions();
  using startTransition = transitions.spy;

  try {
    for (const [index, label, destination, type] of [
      [0, copy.tabs.breakdown["by-artist"].label, "/gigs/by-artist", "tab-forward"],
      [1, copy.tabs.breakdown["by-city"].label, "/gigs/by-city", "tab-forward"],
      [2, copy.tabs.breakdown["by-venue"].label, "/gigs/by-venue", "tab-backward"],
      [3, copy.tabs.breakdown["by-month"].label, "/gigs", "tab-backward"],
    ] as const) {
      const link = result.getByRole("tab", { name: label, exact: true });
      await expect.element(link).toHaveAttribute("href", destination);
      const transitionPromise = transitions.next();
      await link.click();
      const transition = await transitionPromise;
      expect(startTransition.mock.calls[index]?.[0]).toMatchObject({ types: [type] });
      await transition.ready;
      await expect.element(link).toHaveAttribute("aria-current", "page");
      await expect.element(link).toHaveAttribute("aria-selected", "true");
      expect(router.state.location.pathname).toBe(destination);
      await expect.element(result.getByText("Gig breakdown content")).toBeVisible();
      await transition.finished;
    }
  } finally {
    for (const entry of startTransition.mock.results) {
      if (entry.type === "return") await entry.value.finished;
    }
  }
});
