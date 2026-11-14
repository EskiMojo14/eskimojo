import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";
import * as v from "valibot";

import {
  MusicDataBoundary,
  MusicRefreshNotice,
} from "#/routes/music.{-$breakdown}/-components/data-boundary";
import { MusicPeriodPicker } from "#/routes/music.{-$breakdown}/-components/period-picker/index";
import {
  RecentTracks,
  RecentTracksSkeleton,
} from "#/routes/music.{-$breakdown}/-components/recent-tracks/index";
import {
  MusicSummary,
  MusicSummarySkeleton,
} from "#/routes/music.{-$breakdown}/-components/summary/index";
import { MusicBreakdownTabs } from "#/routes/music.{-$breakdown}/-components/tabs/index";
import {
  MusicTopMusic,
  MusicTopMusicSkeleton,
  MusicTopMusicTabs,
} from "#/routes/music.{-$breakdown}/-components/top-music/index";
import { musicBreakdownSchema, musicTypeSchema } from "#/routes/music.{-$breakdown}/-constants.ts";
import {
  getRecentTracks,
  getMusicArtwork,
  getTopTracks,
  getTopArtists,
  getUserData,
  periodSchema,
} from "#/routes/music.{-$breakdown}/-query.ts";
import { TabLinkPanel } from "#/shared/components/tabs";
import { generatePageMetadata } from "#/shared/lib/document-head";
import { preloadImage } from "#/shared/lib/query";

import styles from "./index.css?url";

const recentTracksRefreshInterval = 60_000;

function reportPreloadError(error: unknown) {
  console.error("Failed to preload music data.", error);
}

function reportArtworkPreloadError(error: unknown) {
  console.error("Failed to preload music artwork.", error);
}

export const Route = createFileRoute("/music/{-$breakdown}/")({
  params: {
    parse: (params) => v.parse(v.object({ breakdown: v.optional(musicBreakdownSchema) }), params),
  },
  staticData: {
    title: "Music",
    subtitle: (
      <>
        Powered by{" "}
        <a href="https://www.last.fm/user/eskimojo14" target="_blank" rel="noopener noreferrer">
          Last.fm
        </a>
      </>
    ),
  },
  validateSearch: v.object({
    period: v.optional(periodSchema),
    type: v.optional(musicTypeSchema, musicTypeSchema.fallback),
  }),
  loaderDeps: ({ search: { period, type } }) => ({ period, type }),
  loader: ({
    context: { queryClient },
    params: { breakdown = musicBreakdownSchema.fallback },
    deps: { period = periodSchema.fallback, type },
  }) => {
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
        [...params.tracks, ...params.artists].map(({ lastfmArtworkUrl }) => lastfmArtworkUrl),
      );
      void queryClient
        .query(getMusicArtwork(params))
        .then(({ tracks, artists }) =>
          preloadImages([...tracks, ...artists].map(({ artwork }) => artwork?.imageUrl)),
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
              artists: [],
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
                tracks: [],
                artists: artists.map(({ name, lastfmArtworkUrl }) => ({ name, lastfmArtworkUrl })),
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
                artists: [],
              }),
            )
            .catch(reportPreloadError);
        }
        break;
      }
    }
  },
  head: () => {
    const metadata = generatePageMetadata({
      title: "Music",
      description:
        "See what eskimojo is listening to, with recent tracks and top music from Last.fm.",
    });
    return {
      ...metadata,
      links: [...metadata.links, { rel: "stylesheet", href: styles }],
    };
  },
  component: RouteComponent,
});

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function RouteComponent() {
  const { breakdown = musicBreakdownSchema.fallback } = Route.useParams();
  const { period = periodSchema.fallback, type } = Route.useSearch();
  return (
    <main>
      <MusicDataBoundary
        loading={<MusicSummarySkeleton />}
        errorTitle="Couldn't load listening statistics"
      >
        <SummaryPanel />
      </MusicDataBoundary>
      <MusicBreakdownTabs />
      {musicBreakdownSchema.options.map((value) => (
        <TabLinkPanel
          key={value}
          id={`music-${value}-panel`}
          tabId={`music-${value}-tab`}
          hidden={breakdown !== value}
          className="music-panel tabs__route-content"
        >
          {breakdown === value && (
            <>
              {breakdown === "recent" ? (
                <MusicDataBoundary
                  resetKey={breakdown}
                  loading={<RecentTracksSkeleton />}
                  errorTitle="Couldn't load recent tracks"
                >
                  <RecentTracksPanel />
                </MusicDataBoundary>
              ) : (
                <>
                  <MusicPeriodPicker />
                  <MusicTopMusicTabs />
                  <MusicDataBoundary
                    resetKey={`${breakdown}:${period}:${type}`}
                    loading={<MusicTopMusicSkeleton type={type} />}
                    errorTitle="Couldn't load top music"
                  >
                    {type === "artists" ? <TopArtistsPanel /> : <TopTracksPanel />}
                  </MusicDataBoundary>
                </>
              )}
            </>
          )}
        </TabLinkPanel>
      ))}
    </main>
  );
}

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function SummaryPanel() {
  const { data: user, dataUpdatedAt } = useSuspenseQuery({
    ...getUserData(),
    staleTime: "static",
  });
  return <MusicSummary user={user} asOf={dataUpdatedAt} />;
}

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function RecentTracksPanel() {
  const {
    data: recentTracks,
    error,
    isRefetchError,
    isFetching,
    refetch,
  } = useSuspenseQuery({
    ...getRecentTracks({ limit: 10 }),
    staleTime: recentTracksRefreshInterval,
    refetchInterval: recentTracksRefreshInterval,
    refetchIntervalInBackground: false,
    refetchOnWindowFocus: "always",
  });
  const artworkQuery = useSuspenseQuery(
    getMusicArtwork({
      tracks: recentTracks.map(({ name, artist, lastfmArtworkUrl }) => ({
        name,
        artist,
        lastfmArtworkUrl,
      })),
      artists: [],
    }),
  );
  const tracks = recentTracks.map((track, index) => {
    const artwork = artworkQuery.data?.tracks[index];
    return artwork ? { ...track, artwork: artwork.artwork, palette: artwork.palette } : track;
  });
  useEffect(() => {
    if (isRefetchError) console.error("Failed to refresh recent tracks.", error);
    if (artworkQuery.isError) {
      console.error("Failed to load artwork for recent tracks.", artworkQuery.error);
    }
  }, [artworkQuery.error, artworkQuery.isError, error, isRefetchError]);
  return (
    <>
      {isRefetchError && (
        <MusicRefreshNotice
          isFetching={isFetching}
          onRetry={() => {
            refetch().catch((retryError: unknown) =>
              console.error("Failed to retry recent tracks.", retryError),
            );
          }}
        />
      )}
      <RecentTracks tracks={tracks} />
    </>
  );
}

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function TopTracksPanel() {
  const { period = periodSchema.fallback } = Route.useSearch();
  const tracks = useSuspenseQuery({
    ...getTopTracks({ limit: 10, period }),
    staleTime: "static",
  });
  const artworkQuery = useSuspenseQuery(
    getMusicArtwork({
      tracks: tracks.data.map(({ name, artist, lastfmArtworkUrl }) => ({
        name,
        artist,
        lastfmArtworkUrl,
      })),
      artists: [],
    }),
  );
  const topTracks = tracks.data.map((track, index) => {
    const artwork = artworkQuery.data?.tracks[index];
    return artwork ? { ...track, artwork: artwork.artwork, palette: artwork.palette } : track;
  });
  useEffect(() => {
    if (artworkQuery.isError) {
      console.error("Failed to load artwork for top music.", artworkQuery.error);
    }
  }, [artworkQuery.error, artworkQuery.isError]);
  return <MusicTopMusic tracks={topTracks} artists={[]} type="tracks" />;
}

// oxlint-disable-next-line react/only-export-components -- TanStack route modules export route objects.
function TopArtistsPanel() {
  const { period = periodSchema.fallback } = Route.useSearch();
  const artists = useSuspenseQuery({
    ...getTopArtists({ limit: 10, period }),
    staleTime: "static",
  });
  const artworkQuery = useSuspenseQuery(
    getMusicArtwork({
      tracks: [],
      artists: artists.data.map(({ name, lastfmArtworkUrl }) => ({ name, lastfmArtworkUrl })),
    }),
  );
  const topArtists = artists.data.map((artist, index) => {
    const artwork = artworkQuery.data?.artists[index];
    return artwork ? { ...artist, artwork: artwork.artwork, palette: artwork.palette } : artist;
  });
  useEffect(() => {
    if (artworkQuery.isError) {
      console.error("Failed to load artwork for top music.", artworkQuery.error);
    }
  }, [artworkQuery.error, artworkQuery.isError]);
  return <MusicTopMusic tracks={[]} artists={topArtists} type="artists" />;
}
