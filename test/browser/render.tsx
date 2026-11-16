import { type QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  type RegisteredRouter,
  RouterContextProvider,
  type RouterHistory,
} from "@tanstack/react-router";
import { Fragment, type ReactElement, type ReactNode, useEffect, useState } from "react";
import { Provider } from "react-redux";
import { render, type RenderOptions, type RenderResult } from "vitest-browser-react";

import { getRouter } from "#/router";
import { ThemeContext, ContrastContext, PaletteContext } from "#/shared/components/prefs/context";
import {
  themeSchema,
  contrastSchema,
  paletteSchema,
  type Theme,
  type Contrast,
  type Palette,
} from "#/shared/constants/prefs";
import { createQueryClient } from "#/shared/lib/query";
import { type PreloadedState, type AppStore, makeStore } from "#/shared/store";

interface TestPreferences {
  theme: Theme;
  contrast: Contrast;
  palette: Palette;
}

export interface RenderWithProviderOptions extends RenderOptions {
  /** Initial in-memory values. Use false when supplying production providers yourself. */
  preferences?: Partial<TestPreferences> | false;
  /** Sync preferences to <html> and restore its previous attributes on unmount. */
  syncPreferencesToDocument?: boolean;
  queryClient?: QueryClient;
  historyOpts?: {
    initialEntries: Array<string>;
    initialIndex?: number;
  };
  history?: RouterHistory;
  router?: RegisteredRouter;
  preloadedState?: PreloadedState;
  store?: AppStore;
}

interface RenderWithProvidersResult extends RenderResult {
  queryClient: QueryClient;
  history: RouterHistory;
  router: RegisteredRouter;
  store: AppStore;
}

function PreferenceProviders({
  initialPreferences,
  syncToDocument,
  children,
}: {
  initialPreferences: Partial<TestPreferences>;
  syncToDocument: boolean;
  children: ReactNode;
}) {
  const [theme, setTheme] = useState(initialPreferences.theme ?? themeSchema.fallback);
  const [contrast, setContrast] = useState(initialPreferences.contrast ?? contrastSchema.fallback);
  const [palette, setPalette] = useState(initialPreferences.palette ?? paletteSchema.fallback);

  useEffect(() => {
    if (!syncToDocument) return undefined;

    const { dataset } = document.documentElement;
    const previous = { theme: dataset.theme, contrast: dataset.contrast, palette: dataset.palette };
    Object.assign(dataset, { theme, contrast, palette });
    return () => {
      for (const [key, value] of Object.entries(previous)) {
        if (value === undefined) delete dataset[key];
        else dataset[key] = value;
      }
    };
  }, [syncToDocument, theme, contrast, palette]);

  return (
    <ThemeContext value={{ theme, setTheme }}>
      <ContrastContext value={{ contrast, setContrast }}>
        <PaletteContext value={{ palette, setPalette }}>{children}</PaletteContext>
      </ContrastContext>
    </ThemeContext>
  );
}

export async function renderWithProviders(
  ui: ReactElement,
  {
    queryClient: providedQueryClient,
    preloadedState,
    store: providedStore,
    historyOpts,
    history: providedHistory,
    router: providedRouter,
    preferences = {},
    syncPreferencesToDocument = false,
    wrapper: Wrapper = Fragment,
    ...options
  }: RenderWithProviderOptions = {},
): Promise<RenderWithProvidersResult> {
  const queryClient =
    providedQueryClient ?? providedRouter?.options.context.queryClient ?? createQueryClient();
  const store = providedStore ?? makeStore(preloadedState);
  const history = providedHistory ?? providedRouter?.history ?? createMemoryHistory(historyOpts);
  const router = providedRouter ?? getRouter({ history, queryClient, store });

  return {
    queryClient,
    store,
    history,
    router,
    ...(await render(ui, {
      ...options,
      wrapper({ children }) {
        return (
          <RouterContextProvider router={router}>
            <Provider store={store}>
              <QueryClientProvider client={queryClient}>
                {preferences === false ? (
                  <Wrapper>{children}</Wrapper>
                ) : (
                  <PreferenceProviders
                    initialPreferences={preferences}
                    syncToDocument={syncPreferencesToDocument}
                  >
                    <Wrapper>{children}</Wrapper>
                  </PreferenceProviders>
                )}
              </QueryClientProvider>
            </Provider>
          </RouterContextProvider>
        );
      },
    })),
  };
}
