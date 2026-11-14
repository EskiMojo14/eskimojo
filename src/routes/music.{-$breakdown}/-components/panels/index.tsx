import { useSuspenseQuery } from "@tanstack/react-query";
import { getRouteApi } from "@tanstack/react-router";
import { useEffect } from "react";

import { MusicRefreshNotice } from "#/routes/music.{-$breakdown}/-components/data-boundary";
import { RecentTracks } from "#/routes/music.{-$breakdown}/-components/recent-tracks";
import { MusicSummary } from "#/routes/music.{-$breakdown}/-components/summary";
import { MusicTopMusic } from "#/routes/music.{-$breakdown}/-components/top-music";
import { periodSchema, recentTracksRefreshInterval } from "#/routes/music.{-$breakdown}/-constants";
import {
  getMusicArtwork,
  getRecentTracks,
  getTopAlbums,
  getTopArtists,
  getTopTracks,
  getUserData,
} from "#/routes/music.{-$breakdown}/-query";

const musicRoute = getRouteApi("/music/{-$breakdown}/");

export function SummaryPanel() {
  const { data: user, dataUpdatedAt } = useSuspenseQuery({
    ...getUserData(),
    staleTime: "static",
  });
  return <MusicSummary user={user} asOf={dataUpdatedAt} />;
}

export function RecentTracksPanel() {
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

export function TopTracksPanel() {
  const { period = periodSchema.fallback } = musicRoute.useSearch();
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
  return <MusicTopMusic tracks={topTracks} />;
}

export function TopAlbumsPanel() {
  const { period = periodSchema.fallback } = musicRoute.useSearch();
  const albums = useSuspenseQuery({
    ...getTopAlbums({ limit: 10, period }),
    staleTime: "static",
  });
  const artworkQuery = useSuspenseQuery(
    getMusicArtwork({
      albums: albums.data.map(({ name, artist, lastfmArtworkUrl }) => ({
        name,
        artist,
        lastfmArtworkUrl,
      })),
    }),
  );
  const topAlbums = albums.data.map((album, index) => {
    const artwork = artworkQuery.data?.albums[index];
    return artwork ? { ...album, artwork: artwork.artwork, palette: artwork.palette } : album;
  });
  useEffect(() => {
    if (artworkQuery.isError) {
      console.error("Failed to load artwork for top music.", artworkQuery.error);
    }
  }, [artworkQuery.error, artworkQuery.isError]);
  return <MusicTopMusic albums={topAlbums} />;
}

export function TopArtistsPanel() {
  const { period = periodSchema.fallback } = musicRoute.useSearch();
  const artists = useSuspenseQuery({
    ...getTopArtists({ limit: 10, period }),
    staleTime: "static",
  });
  const artworkQuery = useSuspenseQuery(
    getMusicArtwork({
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
  return <MusicTopMusic artists={topArtists} />;
}
