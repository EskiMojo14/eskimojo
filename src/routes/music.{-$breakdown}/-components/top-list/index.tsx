import BEMHelper from "react-bem-helper";

import {
  MusicListLayout,
  MusicListRow,
  MusicListSkeleton,
} from "#/routes/music.{-$breakdown}/-components/music-list";
import { MusicSearchLinks } from "#/routes/music.{-$breakdown}/-components/search-links";
import type { TopArtist, TopTrack } from "#/routes/music.{-$breakdown}/-query.ts";
import { EmptyState } from "#/shared/components/empty-state";
import { MdSymbol } from "#/shared/components/symbol";

const recentTracksBem = BEMHelper("recent-tracks");
const topListBem = BEMHelper("music-top-list");

export function MusicTopListSkeleton({
  title,
  kind,
}: {
  title: string;
  kind: "tracks" | "artists";
}) {
  return <MusicListSkeleton title={title} kind={kind} />;
}

export function MusicTopList({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<TopArtist | TopTrack>;
}) {
  return (
    <MusicListLayout
      title={title}
      {...topListBem()}
      emptyState={
        items.length === 0 ? (
          <EmptyState
            icon={<MdSymbol>music_note</MdSymbol>}
            title="No listening data for this period."
            description="Try choosing a different time period."
          />
        ) : undefined
      }
    >
      {items.map((item) => (
        <MusicListRow
          key={item.rank}
          rank={item.rank}
          rankLabel={`Rank ${item.rank}`}
          artwork={
            <span {...recentTracksBem({ element: "placeholder" })} aria-hidden="true">
              {"artist" in item ? <MdSymbol>music_note</MdSymbol> : <MdSymbol>artist</MdSymbol>}
            </span>
          }
          headline={item.name}
          supportingText={"artist" in item ? item.artist : undefined}
          actions={
            <MusicSearchLinks
              name={item.name}
              artist={"artist" in item ? item.artist : undefined}
            />
          }
          trailing={`${item.playcount.toLocaleString("en-GB")} ${item.playcount === 1 ? "play" : "plays"}`}
        />
      ))}
    </MusicListLayout>
  );
}
