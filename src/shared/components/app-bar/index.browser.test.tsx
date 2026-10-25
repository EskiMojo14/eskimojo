import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { Route as RootRoute } from "#/routes/__root";
import { Route as GigsRoute } from "#/routes/gigs.{-$breakdown}/index.tsx";
import { Route as HomeRoute } from "#/routes/index";
import { Route as MusicRoute } from "#/routes/music";
import { Route as ProjectsRoute } from "#/routes/projects";

import { AppBar } from "./index";

test("keeps subtitles paired with the deepest titled route and removes them on navigation", async () => {
  const root = createRootRoute({
    staticData: { title: "Site", subtitle: "Site subtitle" },
    component: () => <AppBar navigationOpen={false} onOpenNavigation={() => {}} />,
  });
  const home = createRoute({
    getParentRoute: () => root,
    path: "/",
    staticData: { title: "Home", subtitle: "Projects, music, and other interests" },
  });
  const projects = createRoute({
    getParentRoute: () => root,
    path: "/projects",
    staticData: { title: "Projects" },
  });
  const music = createRoute({
    getParentRoute: () => root,
    path: "/music",
  });
  const gigs = createRoute({
    getParentRoute: () => root,
    path: "/gigs",
    staticData: { title: "Gigs", subtitle: "" },
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree: root.addChildren([home, projects, music, gigs]),
  });
  const result = await page.renderWithProviders(<RouterProvider router={router} />);
  const banner = result.getByRole("banner");
  const homeSubtitle = banner.getByText("Projects, music, and other interests");
  const siteSubtitle = banner.getByText("Site subtitle", { exact: true });

  await expect.element(homeSubtitle).toBeVisible();
  await expect.element(siteSubtitle).not.toBeInTheDocument();

  await router.navigate({ to: "/projects" });
  await expect.element(banner.getByText("Projects", { exact: true })).toBeVisible();
  await expect.element(homeSubtitle).not.toBeInTheDocument();
  await expect.element(siteSubtitle).not.toBeInTheDocument();

  await router.navigate({ to: "/music" });
  await expect.element(banner.getByText("Site", { exact: true })).toBeVisible();
  await expect.element(siteSubtitle).toBeVisible();

  await router.navigate({ to: "/gigs/{-$breakdown}" });
  await expect.element(banner.getByText("Gigs", { exact: true })).toBeVisible();
  await expect.element(siteSubtitle).not.toBeInTheDocument();

  await router.navigate({ to: "/" });
  await expect.element(homeSubtitle).toBeVisible();
});

test("uses route staticData titles and updates the app bar after navigation", async () => {
  const root = createRootRoute({
    staticData: RootRoute.options.staticData,
    component: () => <AppBar navigationOpen={false} onOpenNavigation={() => {}} />,
  });
  const routes = [
    ["/", HomeRoute.options.staticData],
    ["/projects", ProjectsRoute.options.staticData],
    ["/music", MusicRoute.options.staticData],
    ["/gigs", GigsRoute.options.staticData],
  ] as const;
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree: root.addChildren(
      routes.map(([path, staticData]) =>
        createRoute({ getParentRoute: () => root, path, staticData }),
      ),
    ),
  });
  const result = await page.renderWithProviders(<RouterProvider router={router} />);
  const banner = result.getByRole("banner");

  await expect.element(banner.getByText("Home", { exact: true })).toBeVisible();
  for (const [to, title] of [
    ["/projects", "Projects"],
    ["/music", "Music"],
    ["/gigs/{-$breakdown}", "Gigs"],
    ["/", "Home"],
  ] as const) {
    await router.navigate({ to });
    await expect.element(banner.getByText(title, { exact: true })).toBeVisible();
  }
});
