import BEMHelper from "react-bem-helper";

import { MusicArtwork } from "#/routes/music.{-$breakdown}/-components/artwork";
import {
  MusicListLayout,
  MusicListRow,
  MusicListSkeleton,
} from "#/routes/music.{-$breakdown}/-components/music-list";
import { MusicSearchLinks } from "#/routes/music.{-$breakdown}/-components/search-links";
import { type MusicType } from "#/routes/music.{-$breakdown}/-constants";
import * as copy from "#/routes/music.{-$breakdown}/-copy.tsx";
import type { TopArtist, TopTrack } from "#/routes/music.{-$breakdown}/-query.ts";
import { EmptyState } from "#/shared/components/empty-state";
import { MdSymbol } from "#/shared/components/symbol";

const topListBem = BEMHelper("music-top-list");

export function MusicTopListSkeleton({ title, kind }: { title: string; kind: MusicType }) {
  return <MusicListSkeleton title={title} kind={kind} />;
}

export function MusicTopList({
  title,
  items,
  kind,
}: {
  title: string;
  items: ReadonlyArray<TopArtist | TopTrack>;
  kind: MusicType;
}) {
  return (
    <MusicListLayout
      ordered
      title={title}
      {...topListBem()}
      emptyState={
        items.length === 0 ? (
          <EmptyState
            icon={<MdSymbol>{copy.topTabs.type[kind].icon}</MdSymbol>}
            title={copy.topMusic.emptyTitle}
            description={copy.topMusic.emptyDescription}
          />
        ) : undefined
      }
    >
      {items.map((item) => (
        <MusicListRow
          key={item.rank}
          data-artwork-palette={item.palette ? "" : undefined}
          style={item.palette}
          rank={item.rank}
          rankLabel={copy.topMusic.rank(item.rank)}
          artwork={
            <MusicArtwork
              imageUrl={item.artwork?.imageUrl}
              fallbackIcon={copy.topTabs.type[kind].icon}
            />
          }
          headline={item.name}
          supportingText={"artist" in item ? item.artist : undefined}
          actions={
            <MusicSearchLinks
              name={item.name}
              artist={"artist" in item ? item.artist : undefined}
            />
          }
          trailing={copy.topMusic.playCount(item.playcount)}
        />
      ))}
    </MusicListLayout>
  );
}
