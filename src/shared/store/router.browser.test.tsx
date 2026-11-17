import { createListenerMiddleware } from "@reduxjs/toolkit";
import {
  createMemoryHistory,
  createRootRoute,
  createRouter,
  RouterProvider,
} from "@tanstack/react-router";
import type { ReactNode } from "react";
import { expect, test, vi } from "vite-plus/test";
import { page } from "vite-plus/test/browser";

import { snackbarAdded } from "#/shared/lib/snackbar";

import { useAppSelector } from "./hooks";
import { makeStore } from "./index";
import { hydrated, setupReduxIntegration, type DehydratedReduxOpts } from "./router";

function ExistingWrap({ children }: { children: ReactNode }) {
  return <section aria-label="Existing router wrapper">{children}</section>;
}

function SnackbarCount() {
  const count = useAppSelector((state) => state.snackbar.length);
  return <p>Snackbar count: {count}</p>;
}

test("router rendering preserves its wrapper and provides the integrated store", async () => {
  const store = makeStore();
  store.dispatch(
    snackbarAdded({
      id: "integrated",
      message: "Integrated store",
      duration: null,
      showCloseButton: true,
    }),
  );
  const outerStore = makeStore();
  const rootRoute = createRootRoute({ component: SnackbarCount });
  const router = createRouter({
    history: createMemoryHistory({ initialEntries: ["/"] }),
    routeTree: rootRoute,
    Wrap: ExistingWrap,
  });
  if (router.isServer) throw new Error("Expected a browser router.");

  setupReduxIntegration({ router, store });

  const result = await page.renderWithProviders(<RouterProvider router={router} />, {
    store: outerStore,
    preferences: false,
  });

  await expect
    .element(result.getByRole("region", { name: "Existing router wrapper" }))
    .toBeVisible();
  await expect.element(result.getByText("Snackbar count: 1")).toBeVisible();
});

test("client hydration waits for router hydration before dispatching Redux hydration", async () => {
  const events: Array<string> = [];
  const receivedReduxPayloads: Array<DehydratedReduxOpts> = [];
  const listenerMiddleware = createListenerMiddleware();
  listenerMiddleware.startListening({
    actionCreator: hydrated,
    effect: (action) => {
      events.push("redux");
      receivedReduxPayloads.push(action.payload);
    },
  });
  const store = makeStore(undefined, listenerMiddleware);
  const originalHydrate = vi.fn<() => Promise<void>>(async () => {
    events.push("router:start");
    await Promise.resolve();
    events.push("router:complete");
  });
  const router = createRouter({
    routeTree: createRootRoute(),
    hydrate: originalHydrate,
  });
  if (router.isServer) throw new Error("Expected a browser router.");

  setupReduxIntegration({ router, store });

  const hydrate = router.options.hydrate;
  if (!hydrate) throw new Error("Expected Redux integration to add a hydrate callback.");
  const reduxOpts = { state: {} };

  await hydrate({ redux: reduxOpts });
  await expect.poll(() => events.length).toBe(3);

  expect(events).toEqual(["router:start", "router:complete", "redux"]);
  expect(receivedReduxPayloads).toEqual([reduxOpts]);
  expect(originalHydrate).toHaveBeenCalledOnce();
});

test("client hydration skips Redux dispatch when there is no Redux payload", async () => {
  const router = createRouter({ routeTree: createRootRoute() });
  if (router.isServer) throw new Error("Expected a browser router.");
  const store = makeStore();
  const dispatch = vi.spyOn(store, "dispatch");

  setupReduxIntegration({ router, store });

  const hydrate = router.options.hydrate;
  if (!hydrate) throw new Error("Expected Redux integration to add a hydrate callback.");

  await hydrate({});

  expect(dispatch).not.toHaveBeenCalled();
});
