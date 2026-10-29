import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { expect, test, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { addNavigationTransitions } from "#/shared/lib/view-transitions";

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
  await expect.element(result.getByRole("navigation", { name: "Gigs breakdown" })).toBeVisible();
  await expect.poll(() => router.state.status).toBe("idle");
  using startTransition = vi.spyOn(document, "startViewTransition");
  try {
    for (const [index, label, destination, type] of [
      [0, "Artist", "/gigs/by-artist", "tab-forward"],
      [1, "City", "/gigs/by-city", "tab-forward"],
      [2, "Venue", "/gigs/by-venue", "tab-backward"],
      [3, "Month", "/gigs", "tab-backward"],
    ] as const) {
      const link = result.getByRole("link", { name: label, exact: true });
      await expect.element(link).toHaveAttribute("href", destination);
      await link.click();
      await expect.poll(() => startTransition.mock.results.length).toBe(index + 1);
      expect(startTransition.mock.calls[index]?.[0]).toMatchObject({ types: [type] });
      const transition = startTransition.mock.results[index];
      if (transition?.type !== "return") throw new Error("Expected a native tab transition");
      await transition.value.ready;
      await expect.element(link).toHaveAttribute("aria-current", "page");
      expect(router.state.location.pathname).toBe(destination);
      await expect.element(result.getByText("Gig breakdown content")).toBeVisible();
      await transition.value.finished;
    }
  } finally {
    for (const entry of startTransition.mock.results) {
      if (entry.type === "return") await entry.value.finished;
    }
  }
});
