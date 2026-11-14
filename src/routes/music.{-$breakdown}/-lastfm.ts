import { createServerOnlyFn } from "@tanstack/react-start";
import * as v from "valibot";

import { upfetch } from "#/utils";
import { getServerEnv } from "#/utils/env";

import type { Artwork } from "./-query";

export const fetchLastfm = createServerOnlyFn(
  <T extends v.GenericSchema>({
    method,
    params,
    schema,
    signal,
    onResponse,
  }: {
    method: string;
    params?: Record<string, unknown>;
    schema: T;
    signal?: AbortSignal;
    onResponse?: (response: Response) => void;
  }) => {
    const { LASTFM_API_KEY, LASTFM_USER } = getServerEnv();
    return upfetch("https://ws.audioscrobbler.com/2.0/", {
      params: {
        api_key: LASTFM_API_KEY,
        format: "json",
        user: LASTFM_USER,
        ...params,
        method,
      },
      signal,
      schema,
      onResponse,
    });
  },
);

const imageSizeSchema = v.picklist(["small", "medium", "large", "extralarge", "mega"]);
type ImageSize = v.InferOutput<typeof imageSizeSchema>;

const artworkHosts = new Set(["lastfm-img.freetls.fastly.net", "lastfm.freetls.fastly.net"]);
const placeholderFilename = "2a96cbd8b46e442fc41c2b86b821562f.png";

function normalizeArtworkUrl(src: string | undefined) {
  if (!src || src.length > 2048 || !URL.canParse(src)) return undefined;
  const url = new URL(src);
  if (
    url.protocol !== "https:" ||
    !artworkHosts.has(url.hostname) ||
    url.port ||
    url.username ||
    url.password ||
    url.pathname.endsWith(`/${placeholderFilename}`)
  ) {
    return undefined;
  }
  if (url.hostname === "lastfm-img.freetls.fastly.net") {
    // The legacy hostname can serve stale cached 404s for otherwise available artwork.
    url.hostname = "lastfm.freetls.fastly.net";
  }
  return url.href;
}

export const imageSchema = v.pipe(
  v.array(v.object({ size: imageSizeSchema, "#text": v.string() })),
  v.transform((images) =>
    images.reduce<Partial<Record<ImageSize, string>>>((acc, image) => {
      const src = normalizeArtworkUrl(image["#text"]);
      if (src) acc[image.size] = src;
      return acc;
    }, {}),
  ),
);

export function bestLastfmArtwork(image: Partial<Record<ImageSize, string>> | undefined) {
  return image?.mega ?? image?.extralarge ?? image?.large ?? image?.medium ?? image?.small;
}

export function withLastfmArtwork<T extends { image?: Partial<Record<ImageSize, string>> }>(
  item: T,
): Omit<T, "image"> & { lastfmArtworkUrl?: string } {
  const { image, ...rest } = item;
  const lastfmArtworkUrl = bestLastfmArtwork(image);
  return lastfmArtworkUrl ? { ...rest, lastfmArtworkUrl } : rest;
}

export function addLastfmArtworkFallback<
  T extends { artwork?: Artwork; lastfmArtworkUrl?: string },
>(items: Array<T>): Array<Omit<T, "artwork" | "lastfmArtworkUrl"> & { artwork?: Artwork }> {
  return items.map(({ artwork, lastfmArtworkUrl, ...item }) => {
    if (artwork) return { ...item, artwork };
    const imageUrl = normalizeArtworkUrl(lastfmArtworkUrl);
    return imageUrl ? { ...item, artwork: { imageUrl } } : item;
  });
}
