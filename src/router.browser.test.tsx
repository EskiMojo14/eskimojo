import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { expect, test, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { getRouter } from "./router";

function createTransitionRouter(initialEntry = "/projects") {
  const root = createRootRoute({ component: Outlet });
  return createRouter({
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    defaultViewTransition: getRouter().options.defaultViewTransition,
    routeTree: root.addChildren([
      createRoute({
        getParentRoute: () => root,
        path: "/projects",
        component: () => (
          <>
            <Link to="/projects/$slug" params={{ slug: "history-adapter" }}>
              History Adapter
            </Link>
            <Link to="/projects" search={{ type: "package" }}>
              Packages
            </Link>
            <Link to="/">Home</Link>
          </>
        ),
      }),
      createRoute({
        getParentRoute: () => root,
        path: "/projects/$slug",
        component: () => <h1>History Adapter detail</h1>,
      }),
      createRoute({
        getParentRoute: () => root,
        path: "/",
        component: () => <h1>Home</h1>,
      }),
    ]),
  });
}

test("project transitions retain their type through Back and Forward navigation", async () => {
  using startViewTransition = vi.spyOn(document, "startViewTransition");
  const router = createTransitionRouter();
  const result = await page.renderWithProviders(<RouterProvider router={router} />);
  await expect.element(result.getByRole("link", { name: "History Adapter" })).toBeVisible();
  startViewTransition.mockClear();

  await result.getByRole("link", { name: "History Adapter" }).click();
  await expect
    .element(result.getByRole("heading", { name: "History Adapter detail" }))
    .toBeVisible();
  expect(startViewTransition).toHaveBeenLastCalledWith(
    expect.objectContaining({ types: ["project"] }),
  );
  await startViewTransition.mock.results.at(-1)?.value.finished;

  router.history.back();
  await expect.element(result.getByRole("link", { name: "History Adapter" })).toBeVisible();
  expect(startViewTransition).toHaveBeenLastCalledWith(
    expect.objectContaining({ types: ["project"] }),
  );
  await startViewTransition.mock.results.at(-1)?.value.finished;

  router.history.forward();
  await expect
    .element(result.getByRole("heading", { name: "History Adapter detail" }))
    .toBeVisible();
  expect(startViewTransition).toHaveBeenLastCalledWith(
    expect.objectContaining({ types: ["project"] }),
  );
  await startViewTransition.mock.results.at(-1)?.value.finished;
});

test("top-level navigation uses destination order", async () => {
  using startViewTransition = vi.spyOn(document, "startViewTransition");
  const router = createTransitionRouter();
  const result = await page.renderWithProviders(<RouterProvider router={router} />);
  await expect.element(result.getByRole("link", { name: "Home" })).toBeVisible();
  startViewTransition.mockClear();

  await result.getByRole("link", { name: "Home" }).click();
  await expect.element(result.getByRole("heading", { name: "Home" })).toBeVisible();
  expect(startViewTransition).toHaveBeenLastCalledWith(
    expect.objectContaining({ types: ["page-backward"] }),
  );
  await startViewTransition.mock.results.at(-1)?.value.finished;
});

test("project filters derive their transition types from the URL", async () => {
  using startViewTransition = vi.spyOn(document, "startViewTransition");
  const router = createTransitionRouter();
  const result = await page.renderWithProviders(<RouterProvider router={router} />);
  await expect.element(result.getByRole("link", { name: "Packages" })).toBeVisible();
  startViewTransition.mockClear();

  await result.getByRole("link", { name: "Packages" }).click();
  await expect.poll(() => router.state.location.searchStr).toBe("?type=package");
  expect(startViewTransition).toHaveBeenLastCalledWith(
    expect.objectContaining({ types: ["project-filter", "project-filter-package"] }),
  );
  await startViewTransition.mock.results.at(-1)?.value.finished;
});

test.each([
  ["/", "/music", ["page-forward"], ["page-backward"]],
  ["/music", "/music/recent", ["tab-forward"], ["tab-backward"]],
  ["/gigs", "/gigs/by-city", ["tab-forward"], ["tab-backward"]],
  ["/music?period=7day", "/music?period=1month", ["music-period"], ["music-period"]],
  [
    "/projects",
    "/projects?type=package",
    ["project-filter", "project-filter-package"],
    ["project-filter", "project-filter-all"],
  ],
] satisfies Array<[string, string, Array<string>, Array<string>]>)(
  "history navigation selects transitions for %s and %s",
  async (from, to, forwardTypes, backwardTypes) => {
    const root = createRootRoute({ component: Outlet });
    const router = createRouter({
      history: createMemoryHistory({ initialEntries: [from, to] }),
      defaultViewTransition: getRouter().options.defaultViewTransition,
      routeTree: root.addChildren([
        createRoute({
          getParentRoute: () => root,
          path: "$",
          component: () => <p>Destination content</p>,
        }),
      ]),
    });
    const result = await page.renderWithProviders(<RouterProvider router={router} />);
    await expect.element(result.getByText("Destination content")).toBeVisible();
    await expect.poll(() => router.state.status).toBe("idle");
    for (const animation of document.getAnimations()) animation.finish();
    using startTransition = vi.spyOn(document, "startViewTransition");
    try {
      router.history.back();
      await expect.poll(() => router.state.location.href).toBe(from);
      await expect.poll(() => startTransition.mock.calls.length).toBe(1);
      expect(startTransition).toHaveBeenLastCalledWith(
        expect.objectContaining({ types: backwardTypes }),
      );
      await startTransition.mock.results.at(-1)?.value.finished;

      router.history.forward();
      await expect.poll(() => router.state.location.href).toBe(to);
      await expect.poll(() => startTransition.mock.calls.length).toBe(2);
      expect(startTransition).toHaveBeenLastCalledWith(
        expect.objectContaining({ types: forwardTypes }),
      );
      await startTransition.mock.results.at(-1)?.value.finished;
    } finally {
      for (const entry of startTransition.mock.results) {
        if (entry.type === "return") await entry.value.finished;
      }
    }
  },
);
