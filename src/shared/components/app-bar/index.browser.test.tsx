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
import { Route as GigsRoute } from "#/routes/gigs/{-$breakdown}.tsx";
import { Route as HomeRoute } from "#/routes/index";
import { Route as MusicRoute } from "#/routes/music";
import { Route as ProjectsRoute } from "#/routes/projects";

import { AppBar } from "./index";

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
