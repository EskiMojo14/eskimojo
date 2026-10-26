import { useId } from "react";
import BEMHelper from "react-bem-helper";

import type { RecentTrack } from "#/routes/music.{-$breakdown}/-query.ts";
import { List, ListItem, ListItemContent } from "#/shared/components/list";
import { MdSymbol } from "#/shared/components/symbol";

import { MusicSearchLinks } from "./search-links";

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
        <p {...recentTracksBem({ element: "empty" })}>No recently played tracks yet.</p>
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
                        <MdSymbol aria-hidden="true">graphic_eq</MdSymbol>
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
