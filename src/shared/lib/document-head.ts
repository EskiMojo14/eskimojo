import type { StaticDataRouteOption } from "@tanstack/react-router";

import { symbolsUrl } from "#/shared/lib/symbols";

import appCss from "#/shared/styles/index.css?url";

export function getDocumentHead({
  matches,
}: {
  matches: ReadonlyArray<{ staticData: StaticDataRouteOption }>;
}) {
  const title = matches.findLast((match) => match.staticData.title !== undefined)?.staticData.title;

  return {
    meta: [
      {
        charSet: "utf-8",
      },
      {
        name: "viewport",
        content: "width=device-width, initial-scale=1",
      },
      {
        title: title && title !== "eskimojo" ? `${title} | eskimojo` : "eskimojo",
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
        crossOrigin: "anonymous" as const,
      },
      {
        rel: "stylesheet",
        href: symbolsUrl,
        crossOrigin: "anonymous" as const,
      },
      {
        rel: "stylesheet",
        href: appCss,
      },
    ],
  };
}
