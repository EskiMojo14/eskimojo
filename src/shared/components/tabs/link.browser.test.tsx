import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterContextProvider,
  RouterProvider,
} from "@tanstack/react-router";
import { expect, test, vi } from "vite-plus/test";
import { page, userEvent } from "vite-plus/test/browser";

import { MdSymbol } from "#/shared/components/symbol";

import { TabLink, TabNav } from "./index";

function createTabRouter(initialEntry = "/") {
  const root = createRootRoute({
    component: () => (
      <>
        <TabNav aria-label="Sections" variant="secondary">
          <TabLink to="/" activeOptions={{ exact: true }} icon={<MdSymbol>home</MdSymbol>}>
            Home
          </TabLink>
          <TabLink to="/projects" icon={<MdSymbol>folder</MdSymbol>}>
            Projects
          </TabLink>
          <TabLink to="/music">Music</TabLink>
          <TabLink to="/gigs/{-$breakdown}" params={{ breakdown: "by-artist" }}>
            Artists
          </TabLink>
        </TabNav>
        <Outlet />
      </>
    ),
  });
  return createRouter({
    history: createMemoryHistory({ initialEntries: [initialEntry] }),
    routeTree: root.addChildren([
      createRoute({
        getParentRoute: () => root,
        path: "/",
        component: () => <p>Home content</p>,
      }),
      createRoute({
        getParentRoute: () => root,
        path: "/projects",
        component: () => <p>Project content</p>,
      }),
      createRoute({
        getParentRoute: () => root,
        path: "/music",
        component: () => <p>Music content</p>,
      }),
      createRoute({
        getParentRoute: () => root,
        path: "/gigs/{-$breakdown}/",
        component: () => <p>Gigs content</p>,
      }),
    ]),
  });
}

test("router links navigate and track active state through history without manual state", async () => {
  const router = createTabRouter();
  const result = await page.renderWithProviders(<RouterProvider router={router} />);
  await expect.element(result.getByRole("navigation", { name: "Sections" })).toBeVisible();
  const home = result.getByRole("link", { name: "Home" });
  const projects = result.getByRole("link", { name: "Projects" });
  await expect.element(home).toHaveAttribute("aria-current", "page");
  await expect.element(projects).toHaveAttribute("href", "/projects");
  await projects.click();
  await expect.element(result.getByText("Project content")).toBeVisible();
  await expect.element(projects).toHaveAttribute("aria-current", "page");
  await expect.element(home).not.toHaveAttribute("aria-current");
  expect(router.state.location.pathname).toBe("/projects");
  router.history.back();
  await expect.element(home).toHaveAttribute("aria-current", "page");
  await expect.element(result.getByText("Home content")).toBeVisible();
  router.history.forward();
  await expect.element(projects).toHaveAttribute("aria-current", "page");
  await expect.element(result.getByRole("tablist")).not.toBeInTheDocument();
  await expect.element(result.getByRole("tabpanel")).not.toBeInTheDocument();
});

test("deep links, typed params, and keyboard navigation use native anchors", async () => {
  const router = createTabRouter("/music");
  const result = await page.renderWithProviders(<RouterProvider router={router} />);
  await expect
    .element(result.getByRole("link", { name: "Music" }))
    .toHaveAttribute("aria-current", "page");
  await expect
    .element(result.getByRole("link", { name: "Artists" }))
    .toHaveAttribute("href", "/gigs/by-artist");
  await userEvent.tab();
  await expect.element(result.getByRole("link", { name: "Home" })).toHaveFocus();
  await userEvent.tab();
  await expect.element(result.getByRole("link", { name: "Projects" })).toHaveFocus();
  await userEvent.keyboard("{Enter}");
  await expect.element(result.getByText("Project content")).toBeVisible();
});

test("cancelled and modified clicks do not navigate the current router", async () => {
  const router = createTabRouter();
  const onClick = vi.fn<() => void>();
  const result = await page.renderWithProviders(
    <RouterContextProvider router={router}>
      <TabNav aria-label="Sections">
        <TabLink
          to="/projects"
          onClick={(event) => {
            onClick();
            event.preventDefault();
          }}
        >
          Cancelled
        </TabLink>
        <TabLink to="/music">Music</TabLink>
        <TabLink to="/projects" disabled>
          Unavailable
        </TabLink>
      </TabNav>
    </RouterContextProvider>,
  );
  await result.getByRole("link", { name: "Cancelled" }).click();
  expect(onClick).toHaveBeenCalledOnce();
  expect(router.state.location.pathname).toBe("/");
  await expect
    .element(result.getByRole("link", { name: "Unavailable" }))
    .toHaveAttribute("aria-disabled", "true");
  await expect
    .element(result.getByRole("link", { name: "Unavailable" }))
    .not.toHaveAttribute("href");
  const music = result.getByRole("link", { name: "Music" }).element();
  const click = new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true });
  // Cancel the browser's default after the router has checked the modifier.
  document.addEventListener("click", (event) => event.preventDefault(), { once: true });
  music.dispatchEvent(click);
  expect(router.state.location.pathname).toBe("/");
});
