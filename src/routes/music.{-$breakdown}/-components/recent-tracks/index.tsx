import { useId } from "react";
import BEMHelper from "react-bem-helper";

import { MusicSearchLinks } from "#/routes/music.{-$breakdown}/-components/search-links";
import type { RecentTrack } from "#/routes/music.{-$breakdown}/-query.ts";
import { EmptyState } from "#/shared/components/empty-state";
import { List, ListItem, ListItemContent } from "#/shared/components/list";
import { MdSymbol } from "#/shared/components/symbol";

const recentTracksBem = BEMHelper("recent-tracks");
const playedAt = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function RecentTracks({ tracks }: { tracks: ReadonlyArray<RecentTrack> }) {
  const headingId = useId();

  return (
    <section {...recentTracksBem()} aria-labelledby={headingId}>
      <h2 id={headingId} {...recentTracksBem({ element: "heading" })}>
        Recently played
      </h2>
      {tracks.length === 0 ? (
        <EmptyState
          icon={<MdSymbol>music_note</MdSymbol>}
          title="No recently played tracks yet."
          description="Your recently played tracks will appear here once you start listening."
        />
      ) : (
        <List aria-labelledby={headingId}>
          {tracks.map((track, index) => {
            const artwork =
              track.image.extralarge ||
              track.image.large ||
              track.image.medium ||
              track.image.small;
            return (
              <ListItem key={`${track.name}-${track.artist}-${track.date ?? "now"}-${index}`}>
                <ListItemContent
                  leading={
                    artwork ? (
                      <img src={artwork} alt="" width={56} height={56} loading="lazy" />
                    ) : (
                      <span {...recentTracksBem({ element: "placeholder" })} aria-hidden="true">
                        <MdSymbol>music_note</MdSymbol>
                      </span>
                    )
                  }
                  headline={track.name}
                  supportingText={
                    <>
                      <span>{[track.artist, track.album].filter(Boolean).join(" / ")}</span>
                      <MusicSearchLinks name={track.name} artist={track.artist} />
                    </>
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
              </ListItem>
            );
          })}
        </List>
      )}
    </section>
  );
}
