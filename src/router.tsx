import type { QueryClient } from "@tanstack/react-query";
import {
  createRouter as createTanStackRouter,
  type LinkOptions,
  type RouterHistory,
} from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import type { ReactNode } from "react";

import { ErrorPage, NotFoundPage } from "#/shared/components/page-state";
import { addNavigationTransitions } from "#/shared/lib/view-transitions";
import { makeStore, type AppStore } from "#/shared/store";
import { setupReduxIntegration } from "#/shared/store/router";

import { routeTree } from "./routeTree.gen";
import { createQueryClient } from "./shared/lib/query";

export function getRouter({
  history,
  queryClient = createQueryClient(),
  store = makeStore(),
}: {
  history?: RouterHistory;
  queryClient?: QueryClient;
  store?: AppStore;
} = {}) {
  const router = createTanStackRouter({
    history,
    routeTree,
    context: { queryClient, store },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: ErrorPage,
    defaultNotFoundComponent: NotFoundPage,
  });

  addNavigationTransitions(router);
  setupRouterSsrQueryIntegration({ router, queryClient });
  setupReduxIntegration({ router, store });

  return router;
}

declare module "@tanstack/react-router" {
  interface StaticDataRouteOption {
    title?: string;
    subtitle?: ReactNode;
    backLink?: LinkOptions & { label: string };
  }

  interface Register {
    router: ReturnType<typeof getRouter>;
  }
}
