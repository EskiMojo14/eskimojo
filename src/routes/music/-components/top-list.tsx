import { useId } from "react";

import type { TopArtist, TopTrack } from "#/routes/music/-query";
import { List, ListItem, ListItemContent } from "#/shared/components/list";
import { MdSymbol } from "#/shared/components/symbol";

import { MusicSearchLinks } from "./search-links";

export function MusicTopList({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<TopArtist | TopTrack>;
}) {
  const headingId = useId();
  return (
    <section className="recent-tracks" aria-labelledby={headingId}>
      <h2 id={headingId} className="recent-tracks__heading">
        {title}
      </h2>
      {items.length === 0 ? (
        <p className="recent-tracks__empty">No listening data for this period.</p>
      ) : (
        <List aria-labelledby={headingId}>
          {items.map((item) => (
            <ListItem key={item.rank}>
              <ListItemContent
                leading={
                  <span className="music-top-list__leading">
                    <span aria-label={`Rank ${item.rank}`}>{item.rank}</span>
                    <span className="recent-tracks__placeholder" aria-hidden="true">
                      {"artist" in item ? (
                        <MdSymbol>music_note</MdSymbol>
                      ) : (
                        <MdSymbol>artist</MdSymbol>
                      )}
                    </span>
                  </span>
                }
                headline={item.name}
                supportingText={
                  <>
                    {"artist" in item && <span>{item.artist}</span>}
                    <MusicSearchLinks
                      name={item.name}
                      artist={"artist" in item ? item.artist : undefined}
                    />
                  </>
                }
                trailing={`${item.playcount.toLocaleString("en-GB")} ${item.playcount === 1 ? "play" : "plays"}`}
              />
            </ListItem>
          ))}
        </List>
      )}
    </section>
  );
}
