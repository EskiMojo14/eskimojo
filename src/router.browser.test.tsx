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
            <Link
              to="/projects"
              search={{ type: "package" }}
              viewTransition={{ types: ["project-filter"] }}
            >
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

test("unrelated navigation retains the generic transition", async () => {
  using startViewTransition = vi.spyOn(document, "startViewTransition");
  const router = createTransitionRouter();
  const result = await page.renderWithProviders(<RouterProvider router={router} />);
  await expect.element(result.getByRole("link", { name: "Home" })).toBeVisible();
  startViewTransition.mockClear();

  await result.getByRole("link", { name: "Home" }).click();
  await expect.element(result.getByRole("heading", { name: "Home" })).toBeVisible();
  expect(startViewTransition).toHaveBeenLastCalledWith(expect.objectContaining({ types: [] }));
  await startViewTransition.mock.results.at(-1)?.value.finished;
});

test("explicit project filter transitions override the router default", async () => {
  using startViewTransition = vi.spyOn(document, "startViewTransition");
  const router = createTransitionRouter();
  const result = await page.renderWithProviders(<RouterProvider router={router} />);
  await expect.element(result.getByRole("link", { name: "Packages" })).toBeVisible();
  startViewTransition.mockClear();

  await result.getByRole("link", { name: "Packages" }).click();
  await expect.poll(() => router.state.location.searchStr).toBe("?type=package");
  expect(startViewTransition).toHaveBeenLastCalledWith(
    expect.objectContaining({ types: ["project-filter"] }),
  );
  await startViewTransition.mock.results.at(-1)?.value.finished;
});
