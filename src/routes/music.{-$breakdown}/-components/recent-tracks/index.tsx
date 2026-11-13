import BEMHelper from "react-bem-helper";

import { MusicArtwork } from "#/routes/music.{-$breakdown}/-components/artwork";
import {
  MusicListLayout,
  MusicListRow,
  MusicListSkeleton,
} from "#/routes/music.{-$breakdown}/-components/music-list";
import { MusicSearchLinks } from "#/routes/music.{-$breakdown}/-components/search-links";
import type { RecentTrack } from "#/routes/music.{-$breakdown}/-query.ts";
import { EmptyState } from "#/shared/components/empty-state";
import { SkeletonProgress } from "#/shared/components/skeleton";
import { MdSymbol } from "#/shared/components/symbol";

const recentTracksBem = BEMHelper("recent-tracks");
const playedAt = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function RecentTracksSkeleton() {
  return (
    <>
      <SkeletonProgress label="Loading recent tracks..." />
      <MusicListSkeleton title="Recently played" kind="recent" />
    </>
  );
}

export function RecentTracks({ tracks }: { tracks: ReadonlyArray<RecentTrack> }) {
  return (
    <MusicListLayout
      title="Recently played"
      emptyState={
        tracks.length === 0 ? (
          <EmptyState
            icon={<MdSymbol>music_note</MdSymbol>}
            title="No recently played tracks yet."
            description="Your recently played tracks will appear here once you start listening."
          />
        ) : undefined
      }
    >
      {tracks.map((track, index) => {
        return (
          <MusicListRow
            key={`${track.name}-${track.artist}-${track.date ?? "now"}-${index}`}
            data-artwork-palette={track.palette ? "" : undefined}
            style={track.palette}
            artwork={<MusicArtwork imageUrl={track.artwork?.imageUrl} fallbackIcon="music_note" />}
            headline={track.name}
            supportingText={[track.artist, track.album].filter(Boolean).join(" / ")}
            actions={
              <MusicSearchLinks
                name={track.name}
                artist={track.artist}
                spotifyUrl={track.artwork?.spotifyUrl}
              />
            }
            trailing={
              track.nowPlaying ? (
                <span {...recentTracksBem({ element: "now-playing" })}>
                  <svg
                    {...recentTracksBem({ element: "equalizer" })}
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    focusable="false"
                  >
                    <rect x="3" y="10" width="2" height="4" />
                    <rect x="7" y="6" width="2" height="12" />
                    <rect x="11" y="2" width="2" height="20" />
                    <rect x="15" y="6" width="2" height="12" />
                    <rect x="19" y="10" width="2" height="4" />
                  </svg>
                  <span>Now playing</span>
                </span>
              ) : (
                <time dateTime={track.date}>{playedAt.format(new Date(track.date))} UTC</time>
              )
            }
          />
        );
      })}
    </MusicListLayout>
  );
}
