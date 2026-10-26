import { QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import * as v from "valibot";
import { expect, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { musicBreakdownSchema } from "#/routes/music/-constants";
import { getRecentTracks, getTopArtists, getTopTracks } from "#/routes/music/-query";
import { createQueryClient } from "#/shared/lib/query";

import { Route } from "./index";

test("switches music views using suspense query data and preserves the selected period", async () => {
  const queryClient = createQueryClient();
  queryClient.setQueryData(getRecentTracks({ limit: 10 }).queryKey, [
    {
      name: "Recent song",
      artist: "Recent artist",
      album: "",
      image: {},
      nowPlaying: true,
    },
  ]);
  queryClient.setQueryData(getTopArtists({ limit: 10, period: "1month" }).queryKey, [
    {
      name: "Favourite artist",
      rank: 1,
      playcount: 42,
      image: {},
    },
  ]);
  queryClient.setQueryData(getTopTracks({ limit: 10, period: "1month" }).queryKey, [
    {
      name: "Favourite song",
      artist: "Favourite artist",
      rank: 1,
      playcount: 7,
      image: {},
    },
  ]);

  queryClient.setQueryData(getTopTracks({ limit: 10, period: "overall" }).queryKey, [
    { name: "All-time favourite", artist: "Artist", rank: 1, playcount: 100, image: {} },
  ]);

  const root = createRootRoute({
    component: () => (
      <QueryClientProvider client={queryClient}>
        <Outlet />
      </QueryClientProvider>
    ),
  });
  const music = createRoute({
    getParentRoute: () => root,
    path: "/music/{-$breakdown}/",
    params: { parse: v.parser(v.object({ breakdown: v.optional(musicBreakdownSchema) })) },
    validateSearch: Route.options.validateSearch,
    component: Route.options.component,
  });
  const router = createRouter({
    routeTree: root.addChildren([music]),
    history: createMemoryHistory({ initialEntries: ["/music?period=1month"] }),
  });
  const result = await page.renderWithProviders(<RouterProvider router={router} />);
  await expect.element(result.getByText("Recent song")).toBeVisible();
  expect(result.getByRole("group", { name: "Listening period" }).query()).toBeNull();
  await result.getByRole("link", { name: "Top artists" }).click();
  await expect.element(result.getByRole("heading", { name: "Top artists" })).toBeVisible();
  await expect.element(result.getByText("Favourite artist")).toBeVisible();
  await expect.element(result.getByText("Recent song")).not.toBeInTheDocument();
  expect(router.state.location.pathname).toBe("/music/top-artists");
  expect(router.state.location.search).toEqual({ period: "1month" });
  await result.getByRole("link", { name: "Top tracks" }).click();
  await expect.element(result.getByText("Favourite song")).toBeVisible();
  await result.getByRole("link", { name: "All time" }).click();
  await expect.element(result.getByText("All-time favourite")).toBeVisible();
  expect(router.state.location.search).toEqual({ period: "overall" });
  await expect
    .element(result.getByRole("link", { name: "All time" }))
    .toHaveAttribute("aria-current", "page");
  await result.getByRole("link", { name: "Recent" }).click();
  await expect.element(result.getByText("Recent song")).toBeVisible();
  expect(router.state.location.pathname).toBe("/music");
  expect(router.state.location.search).toEqual({ period: "overall" });
  expect(result.getByRole("group", { name: "Listening period" }).query()).toBeNull();
});
