import { QueryClient } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRouteWithContext,
  createRoute,
  createRouter,
  Link,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { http, HttpResponse } from "msw";
import { network } from "virtual:msw";
import { expect, onTestFinished, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { ErrorPage } from "#/shared/components/page-state";
import type { Theme, Contrast, Palette } from "#/shared/constants/prefs";

import { Route } from "./index";

const response = {
  result: {
    user: {
      playcount: "100",
      artist_count: "10",
      album_count: "20",
      track_count: "30",
      registered: { unixtime: "1506038400" },
    },
    toptracks: { track: [] },
    topartists: { artist: [] },
    recenttracks: { track: [] },
  },
};

function deferred() {
  const { promise, resolve } = Promise.withResolvers<void>();
  onTestFinished(() => resolve());
  return { promise, resolve };
}

async function renderMusic() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  onTestFinished(() => queryClient.clear());
  const root = createRootRouteWithContext<{ queryClient: QueryClient }>()({
    component: Outlet,
    loader: async (): Promise<{ theme: Theme; contrast: Contrast; palette: Palette }> => ({
      theme: "system",
      contrast: "system",
      palette: "goat",
    }),
  });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    context: { queryClient },
    defaultErrorComponent: ErrorPage,
    routeTree: root.addChildren([
      createRoute({
        getParentRoute: () => root,
        path: "/",
        component: () => <Link to="/music/{-$breakdown}">Music</Link>,
      }),
      createRoute({
        getParentRoute: () => root,
        path: "/music/{-$breakdown}/",
        validateSearch: Route.options.validateSearch,
        loaderDeps: Route.options.loaderDeps,
        loader: Route.options.loader,
        component: Route.options.component,
      }),
    ]),
  });
  return page.renderWithProviders(<RouterProvider router={router} />, { queryClient });
}

test("music navigation shows controls before independent requests finish", async () => {
  const summary = deferred();
  const rankings = deferred();
  network.use(
    http.get("*/_serverFn/*", async ({ request }) => {
      await (request.url.includes("user.getInfo") ? summary.promise : rankings.promise);
      return HttpResponse.json(response);
    }),
  );
  const result = await renderMusic();
  await result.getByRole("link", { name: "Music", exact: true }).click();
  await expect.element(result.getByRole("navigation", { name: "Music breakdown" })).toBeVisible();
  await expect.element(result.getByRole("group", { name: "Listening period" })).toBeVisible();
  await expect
    .element(result.getByRole("progressbar", { name: "Loading listening summary..." }))
    .toBeInTheDocument();
  await expect
    .element(result.getByRole("progressbar", { name: "Loading top music..." }))
    .toBeInTheDocument();

  rankings.resolve();
  await expect
    .element(result.getByRole("heading", { name: "Top tracks", exact: true }))
    .toBeVisible();
  await expect
    .element(result.getByRole("progressbar", { name: "Loading listening summary..." }))
    .toBeInTheDocument();

  summary.resolve();
  await expect.element(result.getByRole("region", { name: "Listening statistics" })).toBeVisible();
  await expect.element(result.getByRole("progressbar")).not.toBeInTheDocument();
});

test("period and tab changes show loading feedback without hiding music controls", async () => {
  network.use(http.get("*/_serverFn/*", () => HttpResponse.json(response)));
  const result = await renderMusic();
  await result.getByRole("link", { name: "Music", exact: true }).click();
  await expect
    .element(result.getByRole("heading", { name: "Top tracks", exact: true }))
    .toBeVisible();

  const pending = deferred();
  network.use(
    http.get("*/_serverFn/*", async () => {
      await pending.promise;
      return HttpResponse.json(response);
    }),
  );
  await result.getByRole("link", { name: "7 days", exact: true }).click();
  await expect
    .element(result.getByRole("progressbar", { name: "Loading top music..." }))
    .toBeInTheDocument();
  await expect
    .element(result.getByRole("link", { name: "7 days", exact: true }))
    .toHaveAttribute("aria-current", "page");
  await expect.element(result.getByRole("region", { name: "Listening statistics" })).toBeVisible();
  await result.getByRole("link", { name: "Recently played", exact: true }).click();
  await expect
    .element(result.getByRole("progressbar", { name: "Loading recent tracks..." }))
    .toBeInTheDocument();
  await expect.element(result.getByRole("navigation", { name: "Music breakdown" })).toBeVisible();

  pending.resolve();
  await expect
    .element(result.getByRole("heading", { name: "No recently played tracks yet." }))
    .toBeVisible();
});

test("failed preloads surface as route errors rather than empty listening history", async () => {
  network.use(
    http.get("*/_serverFn/*", () => HttpResponse.text("Service unavailable", { status: 503 })),
  );
  const result = await renderMusic();
  await result.getByRole("link", { name: "Music", exact: true }).click();
  await expect.element(result.getByRole("heading", { name: "Something went wrong" })).toBeVisible();
  await expect
    .element(result.getByText("No listening data for this period.").first())
    .not.toBeInTheDocument();
});
