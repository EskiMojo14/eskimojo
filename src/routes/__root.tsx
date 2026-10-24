import { TanStackDevtools } from "@tanstack/react-devtools";
import type { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtoolsPanel } from "@tanstack/react-query-devtools";
import { HeadContent, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { TanStackRouterDevtoolsPanel } from "@tanstack/react-router-devtools";
import BEMHelper from "react-bem-helper";

import { Footer } from "#/shared/components/footer";
import {
  ThemeProvider,
  ContrastProvider,
  PaletteProvider,
} from "#/shared/components/prefs/provider";
import { Providers } from "#/shared/components/providers.tsx";
import { Sidebar } from "#/shared/components/sidebar";
import { getThemeFn, getContrastFn, getPaletteFn } from "#/shared/lib/prefs.ts";
import { symbolsUrl } from "#/shared/lib/symbols";
import { promiseAllKeyed } from "#/utils/index.ts";

import appCss from "#/shared/styles/index.css?url";

interface MyRouterContext {
  queryClient: QueryClient;
}

const appShellBem = BEMHelper("app-shell");

export const Route = createRootRouteWithContext<MyRouterContext>()({
  loader: () =>
    promiseAllKeyed({
      theme: getThemeFn(),
      contrast: getContrastFn(),
      palette: getPaletteFn(),
    }),
  head: () => ({
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: "TanStack Start Starter",
      },
    ],
    links: [
      {
        rel: "preconnect",
        href: "https://fonts.googleapis.com",
      },
      {
        rel: "preconnect",
        href: "https://fonts.gstatic.com",
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: symbolsUrl,
        crossOrigin: "anonymous",
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  }),
  shellComponent: RootDocument,
});

function RootDocument({ children }: { children: React.ReactNode }) {
  const { theme, contrast, palette } = Route.useLoaderData();
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
            <Sidebar />
            <div {...appShellBem({ element: "main" })}>
              <div {...appShellBem({ element: "content" })}>{children}</div>
              <Footer />
            </div>
          </div>
        </Providers>
        <TanStackDevtools
          config={{
            position: "bottom-right",
            triggerHidden: true,
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
