import { createRootRoute, createRouter } from "@tanstack/react-router";
import { expect, test, vi } from "vite-plus/test";

import { makeStore } from "./index";
import { setupReduxIntegration } from "./router";

test("server dehydration preserves router data and adds Redux data", async () => {
  const originalDehydrate = vi.fn<() => Promise<{ query: { dehydrated: boolean } }>>(async () => ({
    query: { dehydrated: true },
  }));

  const router = createRouter({
    routeTree: createRootRoute(),
    dehydrate: originalDehydrate,
  });

  if (!router.isServer) throw new Error("Expected a server router.");

  setupReduxIntegration({ router, store: makeStore() });

  const dehydrate = router.options.dehydrate;

  if (!dehydrate) throw new Error("Expected Redux integration to add a dehydrate callback.");

  await expect(dehydrate()).resolves.toEqual({
    query: { dehydrated: true },
    redux: { state: {} },
  });
  expect(originalDehydrate).toHaveBeenCalledOnce();
});

test("server dehydration adds Redux data when there is no router callback", async () => {
  const router = createRouter({ routeTree: createRootRoute() });

  if (!router.isServer) throw new Error("Expected a server router.");

  setupReduxIntegration({ router, store: makeStore() });

  const dehydrate = router.options.dehydrate;

  if (!dehydrate) throw new Error("Expected Redux integration to add a dehydrate callback.");

  await expect(dehydrate()).resolves.toEqual({ redux: { state: {} } });
});
