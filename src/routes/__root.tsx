import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useState } from "react";
import BEMHelper from "react-bem-helper";
import * as v from "valibot";

import { AppBar } from "#/shared/components/app-bar";
import { Footer } from "#/shared/components/footer";
import { useTheme, useContrast, usePalette } from "#/shared/components/prefs/context";
import {
  ThemeProvider,
  ContrastProvider,
  PaletteProvider,
} from "#/shared/components/prefs/provider";
import { Providers } from "#/shared/components/providers.tsx";
import { Sidebar } from "#/shared/components/sidebar";
import { SnackbarHost } from "#/shared/components/snackbar";
import { isChristmas } from "#/shared/lib/christmas";
import { getDocumentHead } from "#/shared/lib/document-head";
import { getThemeFn, getContrastFn, getPaletteFn } from "#/shared/lib/prefs.ts";
import { promiseAllKeyed } from "#/utils/index.ts";

interface MyRouterContext {
  queryClient: QueryClient;
}

const appShellBem = BEMHelper("app-shell");

export const Route = createRootRouteWithContext<MyRouterContext>()({
  staticData: { title: "eskimojo" },
  validateSearch: v.object({
    christmas: v.optional(v.fallback(v.boolean(), false)),
  }),
  beforeLoad: ({ search: { christmas } }) => ({ christmas: isChristmas(christmas) }),
  loader: () =>
    promiseAllKeyed({
      theme: getThemeFn(),
      contrast: getContrastFn(),
      palette: getPaletteFn(),
    }),
  head: ({ loaderData, match }) => getDocumentHead(loaderData?.palette, match.context.christmas),
  shellComponent: RootDocument,
});

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function RootDocument({ children }: { children: React.ReactNode }) {
  const { theme, contrast, palette } = Route.useLoaderData();
  const { christmas } = Route.useRouteContext();
  return (
    <Providers
      providers={[
        [ThemeProvider, { theme }],
        [ContrastProvider, { contrast }],
        [PaletteProvider, { palette }],
      ]}
    >
      <PreferenceDocument christmas={christmas}>{children}</PreferenceDocument>
    </Providers>
  );
}

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function PreferenceDocument({
  children,
  christmas,
}: {
  children: React.ReactNode;
  christmas: boolean;
}) {
  const { theme } = useTheme();
  const { contrast } = useContrast();
  const { palette } = usePalette();
  const [navigationOpen, setNavigationOpen] = useState(false);
  return (
    <html
      lang="en"
      data-theme={theme}
      data-contrast={contrast}
      data-palette={palette}
      data-christmas={christmas ? "true" : undefined}
    >
      <head>
        <HeadContent />
      </head>
      <body>
        <div {...appShellBem()}>
          <Sidebar
            open={navigationOpen}
            onClose={() => setNavigationOpen(false)}
            christmas={christmas}
          />
          <div {...appShellBem({ element: "main" })}>
            <AppBar
              navigationOpen={navigationOpen}
              onOpenNavigation={() => setNavigationOpen(true)}
            />
            <div {...appShellBem({ element: "content" })}>{children}</div>
            <Footer />
          </div>
        </div>
        <TanStackDevtools
          config={{
            position: "bottom-right",
            triggerHidden: true,
            triggerMode: "fixed",
          }}
          plugins={[
            {
              name: "Tanstack Router",
              render: <TanStackRouterDevtoolsPanel />,
            },
            {
              name: "Tanstack Query",
              render: <ReactQueryDevtoolsPanel />,
            },
          ]}
        />
        <SnackbarHost />
        <Scripts />
      </body>
    </html>
  );
}
