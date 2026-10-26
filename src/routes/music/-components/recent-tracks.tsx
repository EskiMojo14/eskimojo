import { useId } from "react";

import type { RecentTrack } from "#/routes/music/-query";
import { List, ListItem, ListItemContent } from "#/shared/components/list";
import { MdSymbol } from "#/shared/components/symbol";

const playedAt = new Intl.DateTimeFormat("en-GB", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

export function RecentTracks({ tracks }: { tracks: ReadonlyArray<RecentTrack> }) {
  const headingId = useId();

  return (
    <section className="recent-tracks" aria-labelledby={headingId}>
      <h2 id={headingId} className="recent-tracks__heading">
        Recently played
      </h2>
      {tracks.length === 0 ? (
        <p className="recent-tracks__empty">No recently played tracks yet.</p>
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
                      <span className="recent-tracks__placeholder" aria-hidden="true">
                        <MdSymbol>music_note</MdSymbol>
                      </span>
                    )
                  }
                  headline={track.name}
                  supportingText={[track.artist, track.album].filter(Boolean).join(" / ")}
                  trailing={
                    track.nowPlaying ? (
                      <span className="recent-tracks__now-playing">
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
