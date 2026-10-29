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

import { routeTree } from "./routeTree.gen";
import { createQueryClient } from "./shared/lib/query";

export function getRouter({
  history,
  queryClient = createQueryClient(),
}: {
  history?: RouterHistory;
  queryClient?: QueryClient;
} = {}) {
  const router = createTanStackRouter({
    history,
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: ErrorPage,
    defaultNotFoundComponent: NotFoundPage,
  });

  addNavigationTransitions(router);
  setupRouterSsrQueryIntegration({ router, queryClient });

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
