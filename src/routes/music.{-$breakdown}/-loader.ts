import type { QueryClient } from "@tanstack/react-query";

import { preloadImage } from "#/shared/lib/query";

import {
  recentTracksRefreshInterval,
  type MusicBreakdown,
  type MusicType,
  type Period,
} from "./-constants";
import {
  getMusicArtwork,
  getRecentTracks,
  getTopAlbums,
  getTopArtists,
  getTopTracks,
  getUserData,
} from "./-query";

function reportPreloadError(error: unknown) {
  console.error("Failed to preload music data.", error);
}

function reportArtworkPreloadError(error: unknown) {
  console.error("Failed to preload music artwork.", error);
}

export function preloadMusic({
  queryClient,
  breakdown,
  period,
  type,
}: {
  queryClient: QueryClient;
  breakdown: MusicBreakdown;
  period: Period;
  type: MusicType;
}) {
  const preloadedImages = new Set<string>();
  const preloadImages = (urls: Array<string | undefined>) => {
    for (const url of urls) {
      if (!url || preloadedImages.has(url)) continue;
      preloadedImages.add(url);
      void preloadImage(url).catch((error: unknown) =>
        console.error("Failed to preload music artwork image.", url, error),
      );
    }
  };
  const preloadArtwork = (params: Parameters<typeof getMusicArtwork>[0]) => {
    preloadImages(
      [...(params.tracks ?? []), ...(params.albums ?? []), ...(params.artists ?? [])].map(
        ({ lastfmArtworkUrl }) => lastfmArtworkUrl,
      ),
    );
    void queryClient
      .query(getMusicArtwork(params))
      .then(({ tracks, albums, artists }) =>
        preloadImages([...tracks, ...albums, ...artists].map(({ artwork }) => artwork?.imageUrl)),
      )
      .catch(reportArtworkPreloadError);
  };
  queryClient.query({ ...getUserData(), staleTime: "static" }).catch(reportPreloadError);
  switch (breakdown) {
    case "recent":
      void queryClient
        .query({
          ...getRecentTracks({ limit: 10 }),
          staleTime: recentTracksRefreshInterval,
        })
        .then((tracks) =>
          preloadArtwork({
            tracks: tracks.map(({ name, artist, lastfmArtworkUrl }) => ({
              name,
              artist,
              lastfmArtworkUrl,
            })),
          }),
        )
        .catch(reportPreloadError);
      break;
    case "top-music": {
      if (type === "artists") {
        void queryClient
          .query({
            ...getTopArtists({ limit: 10, period }),
            staleTime: "static",
          })
          .then((artists) =>
            preloadArtwork({
              artists: artists.map(({ name, lastfmArtworkUrl }) => ({ name, lastfmArtworkUrl })),
            }),
          )
          .catch(reportPreloadError);
      } else if (type === "albums") {
        void queryClient
          .query({
            ...getTopAlbums({ limit: 10, period }),
            staleTime: "static",
          })
          .then((albums) =>
            preloadArtwork({
              albums: albums.map(({ name, artist, lastfmArtworkUrl }) => ({
                name,
                artist,
                lastfmArtworkUrl,
              })),
            }),
          )
          .catch(reportPreloadError);
      } else {
        void queryClient
          .query({
            ...getTopTracks({ limit: 10, period }),
            staleTime: "static",
          })
          .then((tracks) =>
            preloadArtwork({
              tracks: tracks.map(({ name, artist, lastfmArtworkUrl }) => ({
                name,
                artist,
                lastfmArtworkUrl,
              })),
            }),
          )
          .catch(reportPreloadError);
      }
      break;
    }
  }
}
