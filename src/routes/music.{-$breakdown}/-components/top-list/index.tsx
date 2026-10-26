import { useId } from "react";
import BEMHelper from "react-bem-helper";

import { MusicSearchLinks } from "#/routes/music.{-$breakdown}/-components/search-links";
import type { TopArtist, TopTrack } from "#/routes/music.{-$breakdown}/-query.ts";
import { EmptyState } from "#/shared/components/empty-state";
import { List, ListItem, ListItemContent } from "#/shared/components/list";
import { MdSymbol } from "#/shared/components/symbol";

const recentTracksBem = BEMHelper("recent-tracks");
const topListBem = BEMHelper("music-top-list");

export function MusicTopList({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<TopArtist | TopTrack>;
}) {
  const headingId = useId();
  return (
    <section {...recentTracksBem({ extra: topListBem().className })} aria-labelledby={headingId}>
      <h2 id={headingId} {...recentTracksBem({ element: "heading" })}>
        {title}
      </h2>
      {items.length === 0 ? (
        <EmptyState
          icon={<MdSymbol>music_note</MdSymbol>}
          title="No listening data for this period."
          description="Try choosing a different time period."
        />
      ) : (
        <List aria-labelledby={headingId}>
          {items.map((item) => (
            <ListItem key={item.rank}>
              <ListItemContent
                leading={
                  <span {...topListBem({ element: "leading" })}>
                    <span {...topListBem({ element: "rank" })} aria-label={`Rank ${item.rank}`}>
                      {item.rank}
                    </span>
                    <span {...recentTracksBem({ element: "placeholder" })} aria-hidden="true">
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
