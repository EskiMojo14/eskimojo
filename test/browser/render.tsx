import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  type RegisteredRouter,
  RouterContextProvider,
  type RouterHistory,
} from "@tanstack/react-router";
import { Fragment, type ReactElement } from "react";
import { render, type RenderOptions, type RenderResult } from "vitest-browser-react";

import { getRouter } from "#/router";
import { createQueryClient } from "#/shared/lib/query";

export interface RenderWithProviderOptions extends RenderOptions {
  queryClient?: QueryClient;
  historyOpts?: {
    initialEntries: Array<string>;
    initialIndex?: number;
  };
  history?: RouterHistory;
  router?: RegisteredRouter;
}

interface RenderWithProvidersResult extends RenderResult {
  queryClient: QueryClient;
  history: RouterHistory;
  router: RegisteredRouter;
}

export async function renderWithProviders(
  ui: ReactElement,
  {
    queryClient: providedQueryClient,
    historyOpts,
    history: providedHistory,
    router: providedRouter,
    wrapper: Wrapper = Fragment,
    ...options
  }: RenderWithProviderOptions = {},
): Promise<RenderWithProvidersResult> {
  const queryClient =
    providedQueryClient ?? providedRouter?.options.context.queryClient ?? createQueryClient();
  const history = providedHistory ?? providedRouter?.history ?? createMemoryHistory(historyOpts);
  const router = providedRouter ?? getRouter({ history, queryClient });

  return {
    queryClient,
    history,
    router,
    ...(await render(ui, {
      ...options,
      wrapper({ children }) {
        return (
          <RouterContextProvider router={router}>
            <QueryClientProvider client={queryClient}>
              <Wrapper>{children}</Wrapper>
            </QueryClientProvider>
          </RouterContextProvider>
        );
      },
    })),
  };
}
