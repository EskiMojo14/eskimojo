import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  HeadContent,
  RouterProvider,
} from "@tanstack/react-router";
import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { generateMetadata } from "#/shared/lib/document-head";

import { AppBar } from "./index";

test("keeps subtitles paired with the deepest titled route and removes them on navigation", async () => {
  const root = createRootRoute({
    staticData: { title: "Site", subtitle: "Site subtitle" },
    head: () => generateMetadata({ title: "Site" }),
    component: () => (
      <>
        <HeadContent />
        <AppBar navigationOpen={false} onOpenNavigation={() => {}} />
      </>
    ),
  });
  const home = createRoute({
    getParentRoute: () => root,
    path: "/",
    staticData: { title: "Home", subtitle: "Projects, music, and other interests" },
    head: () => generateMetadata({ title: "Home" }),
  });
  const projects = createRoute({
    getParentRoute: () => root,
    path: "/projects",
    staticData: { title: "Projects" },
    head: () => generateMetadata({ title: "Projects" }),
  });
  const music = createRoute({
    getParentRoute: () => root,
    path: "/music/{-$breakdown}",
  });
  const gigs = createRoute({
    getParentRoute: () => root,
    path: "/gigs",
    staticData: { title: "Gigs", subtitle: "" },
    head: () => generateMetadata({ title: "Gigs" }),
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
  await expect.poll(() => document.title).toBe("Home | eskimojo");
  await expect.element(siteSubtitle).not.toBeInTheDocument();

  await router.navigate({ to: "/projects" });
  await expect.element(banner.getByText("Projects", { exact: true })).toBeVisible();
  await expect.poll(() => document.title).toBe("Projects | eskimojo");
  await expect.element(homeSubtitle).not.toBeInTheDocument();
  await expect.element(siteSubtitle).not.toBeInTheDocument();

  await router.navigate({ to: "/music/{-$breakdown}" });
  await expect.element(banner.getByText("Site", { exact: true })).toBeVisible();
  await expect.poll(() => document.title).toBe("Site | eskimojo");
  await expect.element(siteSubtitle).toBeVisible();

  await router.navigate({ to: "/gigs/{-$breakdown}" });
  await expect.element(banner.getByText("Gigs", { exact: true })).toBeVisible();
  await expect.poll(() => document.title).toBe("Gigs | eskimojo");
  await expect.element(siteSubtitle).not.toBeInTheDocument();

  await router.navigate({ to: "/" });
  await expect.element(homeSubtitle).toBeVisible();
  await expect.poll(() => document.title).toBe("Home | eskimojo");
});
