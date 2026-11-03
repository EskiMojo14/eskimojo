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

import { TabLink, TabLinkPanel, TabNav } from "./index";

function createTabRouter(
  initialEntry = "/",
  {
    orientation = "horizontal",
    direction = "ltr",
  }: { orientation?: "horizontal" | "vertical"; direction?: "ltr" | "rtl" } = {},
) {
  const root = createRootRoute({
    component: () => (
      <>
        <TabNav aria-label="Sections" variant="secondary" orientation={orientation} dir={direction}>
          <TabLink
            id="home-tab"
            panelId="home-panel"
            to="/"
            activeOptions={{ exact: true }}
            icon={<MdSymbol>home</MdSymbol>}
          >
            Home
          </TabLink>
          <TabLink
            id="projects-tab"
            panelId="projects-panel"
            to="/projects"
            icon={<MdSymbol>folder</MdSymbol>}
          >
            Projects
          </TabLink>
          <TabLink
            id="music-tab"
            panelId="music-panel"
            to="/music/{-$breakdown}"
            params={{ breakdown: undefined }}
          >
            Music
          </TabLink>
          <TabLink
            id="gigs-tab"
            panelId="gigs-panel"
            to="/gigs/{-$breakdown}"
            params={{ breakdown: "by-artist" }}
          >
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
        component: () => (
          <TabLinkPanel id="home-panel" tabId="home-tab">
            Home content
          </TabLinkPanel>
        ),
      }),
      createRoute({
        getParentRoute: () => root,
        path: "/projects",
        component: () => (
          <TabLinkPanel id="projects-panel" tabId="projects-tab">
            Project content
          </TabLinkPanel>
        ),
      }),
      createRoute({
        getParentRoute: () => root,
        path: "/music/{-$breakdown}",
        component: () => (
          <TabLinkPanel id="music-panel" tabId="music-tab">
            Music content
          </TabLinkPanel>
        ),
      }),
      createRoute({
        getParentRoute: () => root,
        path: "/gigs/{-$breakdown}/",
        component: () => (
          <TabLinkPanel id="gigs-panel" tabId="gigs-tab">
            Gigs content
          </TabLinkPanel>
        ),
      }),
    ]),
  });
}

test("router links navigate and track active state through history without manual state", async () => {
  const router = createTabRouter();
  const result = await page.renderWithProviders(<RouterProvider router={router} />);
  await expect.element(result.getByRole("navigation", { name: "Sections" })).toBeVisible();
  const home = result.getByRole("tab", { name: "Home" });
  const projects = result.getByRole("tab", { name: "Projects" });
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
  await expect.element(result.getByRole("tablist", { name: "Sections" })).toBeVisible();
  await expect
    .element(result.getByRole("tabpanel", { name: "Projects" }))
    .toHaveTextContent("Project content");
  await expect.element(projects).toHaveAttribute("aria-selected", "true");
  await expect.element(home).toHaveAttribute("aria-selected", "false");
});

test("deep links, typed params, and keyboard navigation use native anchors", async () => {
  const router = createTabRouter("/music");
  const result = await page.renderWithProviders(<RouterProvider router={router} />);
  await expect
    .element(result.getByRole("tab", { name: "Music" }))
    .toHaveAttribute("aria-current", "page");
  await expect
    .element(result.getByRole("tab", { name: "Artists" }))
    .toHaveAttribute("href", "/gigs/by-artist");
  await userEvent.tab();
  await expect.element(result.getByRole("tab", { name: "Music" })).toHaveFocus();
  await userEvent.keyboard("{Home}{ArrowRight}");
  await expect.element(result.getByRole("tab", { name: "Projects" })).toHaveFocus();
  expect(router.state.location.pathname).toBe("/music");
  await userEvent.keyboard("{Enter}");
  await expect.element(result.getByText("Project content")).toBeVisible();
  await expect
    .element(result.getByRole("tab", { name: "Projects" }))
    .toHaveAttribute("aria-selected", "true");
  await userEvent.keyboard("{End}");
  await expect.element(result.getByRole("tab", { name: "Artists" })).toHaveFocus();
  await userEvent.keyboard("{Space}");
  await expect
    .element(result.getByRole("tabpanel", { name: "Artists" }))
    .toHaveTextContent("Gigs content");
  await expect
    .element(result.getByRole("tab", { name: "Artists" }))
    .toHaveAttribute("aria-controls", "gigs-panel");
  await expect
    .element(result.getByRole("tabpanel", { name: "Artists" }))
    .toHaveAttribute("aria-labelledby", "gigs-tab");
});

test("tab navigation preserves the current scroll position", async () => {
  const router = createTabRouter();
  router.update({ scrollRestoration: true });
  const result = await page.renderWithProviders(
    <div style={{ minBlockSize: "3000px" }}>
      <RouterProvider router={router} />
    </div>,
  );
  await expect.element(result.getByRole("tab", { name: "Projects" })).toBeVisible();
  const projects = result.getByRole("tab", { name: "Projects" }).element();
  if (!(projects instanceof HTMLAnchorElement)) throw new Error("Tab link must be an anchor");
  window.scrollTo({ top: 200, behavior: "instant" });
  expect(window.scrollY).toBe(200);
  try {
    projects.click();
    await expect.element(result.getByText("Project content")).toBeInTheDocument();
    await expect.poll(() => router.state.status).toBe("idle");
    expect(window.scrollY).toBe(200);
  } finally {
    window.scrollTo({ top: 0, behavior: "instant" });
  }
});

test("vertical linked tabs wrap focus without navigating until activation", async () => {
  const router = createTabRouter("/", { orientation: "vertical" });
  const result = await page.renderWithProviders(<RouterProvider router={router} />);

  await expect.element(result.getByRole("tablist")).toHaveAttribute("aria-orientation", "vertical");
  await userEvent.tab();
  await userEvent.keyboard("{ArrowUp}");
  await expect.element(result.getByRole("tab", { name: "Artists" })).toHaveFocus();
  await userEvent.keyboard("{ArrowDown}");
  await expect.element(result.getByRole("tab", { name: "Home" })).toHaveFocus();
  expect(router.state.location.pathname).toBe("/");
  await userEvent.keyboard("{ArrowDown}{Enter}");
  await expect.element(result.getByRole("tabpanel", { name: "Projects" })).toBeVisible();
});

test("horizontal linked tabs follow RTL reading direction", async () => {
  const router = createTabRouter("/", { direction: "rtl" });
  const result = await page.renderWithProviders(<RouterProvider router={router} />);

  await userEvent.tab();
  await userEvent.keyboard("{ArrowLeft}");
  await expect.element(result.getByRole("tab", { name: "Projects" })).toHaveFocus();
  await userEvent.keyboard("{ArrowRight}");
  await expect.element(result.getByRole("tab", { name: "Home" })).toHaveFocus();
  expect(router.state.location.pathname).toBe("/");
});

test("cancelled and modified clicks do not navigate the current router", async () => {
  const router = createTabRouter();
  const onClick = vi.fn<() => void>();
  const result = await page.renderWithProviders(
    <RouterContextProvider router={router}>
      <TabNav aria-label="Sections">
        <TabLink
          id="cancelled-tab"
          panelId="cancelled-panel"
          to="/projects"
          onClick={(event) => {
            onClick();
            event.preventDefault();
          }}
        >
          Cancelled
        </TabLink>
        <TabLink
          id="music-tab"
          panelId="music-panel"
          to="/music/{-$breakdown}"
          params={{ breakdown: undefined }}
        >
          Music
        </TabLink>
        <TabLink id="disabled-tab" panelId="disabled-panel" to="/projects" disabled>
          Unavailable
        </TabLink>
      </TabNav>
    </RouterContextProvider>,
  );
  await result.getByRole("tab", { name: "Cancelled" }).click();
  expect(onClick).toHaveBeenCalledOnce();
  expect(router.state.location.pathname).toBe("/");
  await expect
    .element(result.getByRole("tab", { name: "Unavailable" }))
    .toHaveAttribute("aria-disabled", "true");
  await expect
    .element(result.getByRole("tab", { name: "Unavailable" }))
    .not.toHaveAttribute("href");
  await userEvent.keyboard("{End}");
  await expect.element(result.getByRole("tab", { name: "Music" })).toHaveFocus();
  const music = result.getByRole("tab", { name: "Music" }).element();
  const click = new MouseEvent("click", { bubbles: true, cancelable: true, ctrlKey: true });
  // Cancel the browser's default after the router has checked the modifier.
  document.addEventListener("click", (event) => event.preventDefault(), { once: true });
  music.dispatchEvent(click);
  expect(router.state.location.pathname).toBe("/");
});
