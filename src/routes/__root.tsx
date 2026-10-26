import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import { useState } from "react";
import BEMHelper from "react-bem-helper";

import { AppBar } from "#/shared/components/app-bar";
import { Footer } from "#/shared/components/footer";
import {
  ThemeProvider,
  ContrastProvider,
  PaletteProvider,
} from "#/shared/components/prefs/provider";
import { Providers } from "#/shared/components/providers.tsx";
import { Sidebar } from "#/shared/components/sidebar";
import { getDocumentHead } from "#/shared/lib/document-head";
import { getThemeFn, getContrastFn, getPaletteFn } from "#/shared/lib/prefs.ts";
import { promiseAllKeyed } from "#/utils/index.ts";

interface MyRouterContext {
  queryClient: QueryClient;
}

const appShellBem = BEMHelper("app-shell");

export const Route = createRootRouteWithContext<MyRouterContext>()({
  staticData: { title: "eskimojo" },
  loader: () =>
    promiseAllKeyed({
      theme: getThemeFn(),
      contrast: getContrastFn(),
      palette: getPaletteFn(),
    }),
  head: getDocumentHead,
  shellComponent: RootDocument,
});

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function RootDocument({ children }: { children: React.ReactNode }) {
  const { theme, contrast, palette } = Route.useLoaderData();
  const [navigationOpen, setNavigationOpen] = useState(false);
  return (
    <html lang="en" data-theme={theme} data-contrast={contrast} data-palette={palette}>
      <head>
        <HeadContent />
      </head>
      <body>
        <Providers
          providers={[
            [ThemeProvider, { theme }],
            [ContrastProvider, { contrast }],
            [PaletteProvider, { palette }],
          ]}
        >
          <div {...appShellBem()}>
            <Sidebar open={navigationOpen} onClose={() => setNavigationOpen(false)} />
            <div {...appShellBem({ element: "main" })}>
              <AppBar
                navigationOpen={navigationOpen}
                onOpenNavigation={() => setNavigationOpen(true)}
              />
              <div {...appShellBem({ element: "content" })}>{children}</div>
              <Footer />
            </div>
          </div>
        </Providers>
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
        <Scripts />
      </body>
    </html>
  );
}
