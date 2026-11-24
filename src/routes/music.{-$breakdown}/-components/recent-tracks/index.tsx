import BEMHelper from "react-bem-helper";

import { MusicArtwork } from "#/routes/music.{-$breakdown}/-components/artwork";
import {
  MusicListLayout,
  MusicListRow,
  MusicListSkeleton,
} from "#/routes/music.{-$breakdown}/-components/music-list";
import { MusicSearchLinks } from "#/routes/music.{-$breakdown}/-components/search-links";
import * as copy from "#/routes/music.{-$breakdown}/-copy.tsx";
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
      <SkeletonProgress label={copy.recentTracks.loading} />
      <MusicListSkeleton title={copy.tabs.breakdown.recent.label} kind="recent" />
    </>
  );
}

export function RecentTracks({ tracks }: { tracks: ReadonlyArray<RecentTrack> }) {
  return (
    <MusicListLayout
      title={copy.tabs.breakdown.recent.label}
      emptyState={
        tracks.length === 0 ? (
          <EmptyState
            icon={<MdSymbol>music_note</MdSymbol>}
            title={copy.recentTracks.emptyTitle}
            description={copy.recentTracks.emptyDescription}
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
            actions={<MusicSearchLinks name={track.name} artist={track.artist} />}
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
                  <span>{copy.recentTracks.nowPlaying}</span>
                </span>
              ) : (
                <time dateTime={track.date}>
                  {copy.recentTracks.playedAt(playedAt.format(new Date(track.date)))}
                </time>
              )
            }
          />
        );
      })}
    </MusicListLayout>
  );
}
