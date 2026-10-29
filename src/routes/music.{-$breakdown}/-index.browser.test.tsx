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
import { fromJSON, toCrossJSONAsync } from "seroval";
import * as v from "valibot";
import { network } from "virtual:msw";
import { expect, onTestFinished, test } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { ErrorPage } from "#/shared/components/page-state";
import type { Theme, Contrast, Palette } from "#/shared/constants/prefs";

import { fetchLastfm, getRecentTracks, getUserData } from "./-query";
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

async function serverFnResponse(body: unknown, status = 200) {
  return HttpResponse.json(await toCrossJSONAsync(body), {
    status,
    headers: { "x-tss-serialized": "true" },
  });
}

function isSummaryRequest(request: Request) {
  const payload = new URL(request.url).searchParams.get("payload");
  if (!payload) throw new Error("Missing server-function request payload");
  const { data } = v.parse(
    v.object({ data: v.object({ method: v.string() }) }),
    fromJSON(JSON.parse(payload)),
  );
  return data.method === getUserData.method;
}

function deferred() {
  const { promise, resolve } = Promise.withResolvers<void>();
  onTestFinished(() => resolve());
  return { promise, resolve };
}

async function renderMusic(
  queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  }),
) {
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
    http.get(fetchLastfm.url, async ({ request }) => {
      await (isSummaryRequest(request) ? summary.promise : rankings.promise);
      return serverFnResponse(response);
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
  network.use(http.get(fetchLastfm.url, () => serverFnResponse(response)));
  const result = await renderMusic();
  await result.getByRole("link", { name: "Music", exact: true }).click();
  await expect
    .element(result.getByRole("heading", { name: "Top tracks", exact: true }))
    .toBeVisible();

  const pending = deferred();
  network.use(
    http.get(fetchLastfm.url, async () => {
      await pending.promise;
      return serverFnResponse(response);
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

test("failed summary requests leave rankings usable and can be retried", async () => {
  network.use(
    http.get(fetchLastfm.url, ({ request }) =>
      isSummaryRequest(request)
        ? serverFnResponse({ error: new Error("Service unavailable") }, 503)
        : serverFnResponse(response),
    ),
  );
  const result = await renderMusic();
  await result.getByRole("link", { name: "Music", exact: true }).click();
  await expect
    .element(result.getByRole("heading", { name: "Couldn't load listening statistics" }))
    .toBeVisible();
  await expect
    .element(result.getByRole("heading", { name: "Top tracks", exact: true }))
    .toBeVisible();
  await expect.element(result.getByRole("navigation", { name: "Music breakdown" })).toBeVisible();
  const pending = deferred();
  network.use(
    http.get(fetchLastfm.url, async () => {
      await pending.promise;
      return serverFnResponse(response);
    }),
  );
  await result.getByRole("button", { name: "Retry", exact: true }).click();
  await expect
    .element(result.getByRole("progressbar", { name: "Loading listening summary..." }))
    .toBeInTheDocument();
  pending.resolve();
  await expect.element(result.getByRole("region", { name: "Listening statistics" })).toBeVisible();
  await expect.element(result.getByRole("alert")).not.toBeInTheDocument();
});

test("failed rankings preserve summary and retry without showing empty listening history", async () => {
  network.use(
    http.get(fetchLastfm.url, ({ request }) =>
      isSummaryRequest(request)
        ? serverFnResponse(response)
        : serverFnResponse({ error: new Error("Service unavailable") }, 503),
    ),
  );
  const result = await renderMusic();
  await result.getByRole("link", { name: "Music", exact: true }).click();
  await expect
    .element(result.getByRole("heading", { name: "Couldn't load top music" }))
    .toBeVisible();
  await expect.element(result.getByRole("region", { name: "Listening statistics" })).toBeVisible();
  await expect
    .element(result.getByText("No listening data for this period.").first())
    .not.toBeInTheDocument();
  await result.getByRole("button", { name: "Retry", exact: true }).click();
  await expect
    .element(result.getByRole("heading", { name: "Couldn't load top music" }))
    .toBeVisible();
  network.use(http.get(fetchLastfm.url, () => serverFnResponse(response)));
  await result.getByRole("button", { name: "Retry", exact: true }).click();
  await expect
    .element(result.getByRole("heading", { name: "Top tracks", exact: true }))
    .toBeVisible();
  await expect
    .element(result.getByRole("heading", { name: "Top artists", exact: true }))
    .toBeVisible();
});

test("changing period or tab recovers the active-tab error boundary", async () => {
  network.use(
    http.get(fetchLastfm.url, ({ request }) =>
      isSummaryRequest(request)
        ? serverFnResponse(response)
        : serverFnResponse({ error: new Error("Service unavailable") }, 503),
    ),
  );
  const result = await renderMusic();
  await result.getByRole("link", { name: "Music", exact: true }).click();
  await expect
    .element(result.getByRole("heading", { name: "Couldn't load top music" }))
    .toBeVisible();
  network.use(http.get(fetchLastfm.url, () => serverFnResponse(response)));
  await result.getByRole("link", { name: "7 days", exact: true }).click();
  await expect
    .element(result.getByRole("heading", { name: "Top tracks", exact: true }))
    .toBeVisible();

  network.use(
    http.get(fetchLastfm.url, () =>
      serverFnResponse({ error: new Error("Service unavailable") }, 503),
    ),
  );
  await result.getByRole("link", { name: "Recently played", exact: true }).click();
  await expect
    .element(result.getByRole("heading", { name: "Couldn't load recent tracks" }))
    .toBeVisible();
  await result.getByRole("link", { name: "Top music", exact: true }).click();
  await expect
    .element(result.getByRole("heading", { name: "Top tracks", exact: true }))
    .toBeVisible();
  await expect.element(result.getByRole("alert")).not.toBeInTheDocument();
});

test("simultaneous failures show independent retry controls", async () => {
  network.use(
    http.get(fetchLastfm.url, () =>
      serverFnResponse({ error: new Error("Service unavailable") }, 503),
    ),
  );
  const result = await renderMusic();
  await result.getByRole("link", { name: "Music", exact: true }).click();
  await expect
    .element(result.getByRole("heading", { name: "Couldn't load listening statistics" }))
    .toBeVisible();
  await expect
    .element(result.getByRole("heading", { name: "Couldn't load top music" }))
    .toBeVisible();
  await expect.element(result.getByRole("button", { name: "Retry" })).toHaveLength(2);
  await expect.element(result.getByRole("group", { name: "Listening period" })).toBeVisible();
});

test("failed recent-track refresh keeps cached tracks and retries in place", async () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  network.use(
    http.get(fetchLastfm.url, () =>
      serverFnResponse({
        result: {
          ...response.result,
          recenttracks: {
            track: [
              {
                name: "Let It Happen",
                artist: { "#text": "Tame Impala" },
                album: { "#text": "Currents" },
                image: [],
                "@attr": { nowplaying: "true" },
              },
            ],
          },
        },
      }),
    ),
  );
  const result = await renderMusic(queryClient);
  await result.getByRole("link", { name: "Music", exact: true }).click();
  await result.getByRole("link", { name: "Recently played", exact: true }).click();
  await expect.element(result.getByText("Let It Happen", { exact: true })).toBeVisible();
  network.use(
    http.get(fetchLastfm.url, () =>
      serverFnResponse({ error: new Error("Service unavailable") }, 503),
    ),
  );
  await queryClient.refetchQueries({ queryKey: getRecentTracks({ limit: 10 }).queryKey });
  await expect
    .element(result.getByRole("status"))
    .toHaveTextContent("Couldn't refresh recent tracks. Showing the last loaded results.");
  await expect.element(result.getByText("Let It Happen", { exact: true })).toBeVisible();
  await expect.element(result.getByRole("alert")).not.toBeInTheDocument();
  const pending = deferred();
  network.use(
    http.get(fetchLastfm.url, async () => {
      await pending.promise;
      return serverFnResponse(response);
    }),
  );
  await result.getByRole("button", { name: "Retry", exact: true }).click();
  await expect
    .element(result.getByRole("button", { name: "Retry", exact: true }))
    .toHaveAttribute("aria-busy", "true");
  await expect
    .element(result.getByRole("button", { name: "Retry", exact: true }))
    .toHaveAttribute("aria-disabled", "true");
  await expect.element(result.getByText("Let It Happen", { exact: true })).toBeVisible();
  pending.resolve();
  await expect.element(result.getByRole("status")).not.toBeInTheDocument();
  await expect
    .element(result.getByRole("heading", { name: "No recently played tracks yet." }))
    .toBeVisible();
});
