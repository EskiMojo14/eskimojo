import { createMetadataGenerator } from "tanstack-meta";

import type { Palette } from "#/shared/constants/prefs";
import { symbolsUrl } from "#/shared/lib/symbols";

import appCss from "#/shared/styles/index.css?url";

export const generateMetadata = createMetadataGenerator({
  baseUrl: "https://eskimojo.dev",
  titleTemplate: {
    default: "eskimojo",
    template: (title) => (title && title !== "eskimojo" ? `${title} | eskimojo` : "eskimojo"),
  },
});

export function generatePageMetadata({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  const image = {
    url: "/Goat_square-1.jpeg",
    width: 712,
    height: 712,
    alt: "eskimojo's Goat portrait",
  };

  return generateMetadata({
    title,
    description,
    openGraph: {
      type: "website",
      siteName: "eskimojo",
      title,
      description,
      images: [image],
    },
    twitter: {
      card: "summary",
      title,
      description,
      images: [image],
    },
  });
}

export function getDocumentHead(palette: Palette = "goat") {
  const metadata = generatePageMetadata({
    title: "eskimojo",
    description: "eskimojo's personal website: projects, music, and live gigs.",
  });
  return {
    ...metadata,
    meta: [
      ...metadata.meta,
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
    ],
    links: [
      ...metadata.links,
      {
        rel: "icon",
        href: palette === "goat" ? "/favicon.png" : "/favicon-arctic.png",
        type: "image/png",
        sizes: "64x64",
      },
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
