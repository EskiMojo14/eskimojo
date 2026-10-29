import type { QueryClient } from "@tanstack/react-query";
import {
  createRouter as createTanStackRouter,
  type LinkOptions,
  type RouterHistory,
} from "@tanstack/react-router";
import { setupRouterSsrQueryIntegration } from "@tanstack/react-router-ssr-query";
import type { ReactNode } from "react";

import { ErrorPage, NotFoundPage } from "#/shared/components/page-state";

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
    defaultViewTransition: {
      types: ({ fromLocation, toLocation }) => {
        const paths = [fromLocation?.pathname, toLocation.pathname];
        const includesList = paths.some((path) => path === "/projects" || path === "/projects/");
        const includesDetail = paths.some(
          (path) => path !== undefined && /^\/projects\/[^/]+\/?$/.test(path),
        );
        return includesList && includesDetail ? ["project"] : [];
      },
    },
    defaultPreload: "intent",
    defaultPreloadStaleTime: 0,
    defaultErrorComponent: ErrorPage,
    defaultNotFoundComponent: NotFoundPage,
  });

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
