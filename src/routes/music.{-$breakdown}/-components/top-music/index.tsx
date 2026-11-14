import { getRouteApi } from "@tanstack/react-router";

import {
  MusicTopList,
  MusicTopListSkeleton,
} from "#/routes/music.{-$breakdown}/-components/top-list";
import {
  musicTypeLabels,
  musicTypeSchema,
  type MusicType,
} from "#/routes/music.{-$breakdown}/-constants";
import type { TopAlbum, TopArtist, TopTrack } from "#/routes/music.{-$breakdown}/-query.ts";
import { SkeletonProgress } from "#/shared/components/skeleton";
import { MdSymbol } from "#/shared/components/symbol";
import { TabLink, TabLinkPanel, TabNav } from "#/shared/components/tabs";

const musicRoute = getRouteApi("/music/{-$breakdown}/");

export function MusicTopMusicTabs() {
  return (
    <TabNav aria-label="Top music rankings" variant="secondary" className="music-top-music">
      {musicTypeSchema.options.map((type) => (
        <TabLink
          key={type}
          id={`music-top-${type}-tab`}
          panelId={`music-top-${type}-panel`}
          from={musicRoute.id}
          to="."
          search={(previous) => ({ ...previous, type })}
          activeOptions={{ exact: true }}
          icon={<MdSymbol>{musicTypeLabels[type].icon}</MdSymbol>}
          replace
        >
          {musicTypeLabels[type].label}
        </TabLink>
      ))}
    </TabNav>
  );
}

export function MusicTopMusicSkeleton({ type = "tracks" }: { type?: MusicType }) {
  return (
    <>
      <SkeletonProgress label="Loading top music..." />
      {musicTypeSchema.options.map((value) => (
        <TabLinkPanel
          key={value}
          id={`music-top-${value}-panel`}
          tabId={`music-top-${value}-tab`}
          hidden={type !== value}
          className="music-top-music music-skeleton"
        >
          <MusicTopListSkeleton title={`Top ${value}`} kind={value} />
        </TabLinkPanel>
      ))}
    </>
  );
}

export function MusicTopMusic({
  tracks,
  albums,
  artists,
  type = "tracks",
}: {
  tracks: ReadonlyArray<TopTrack>;
  albums: ReadonlyArray<TopAlbum>;
  artists: ReadonlyArray<TopArtist>;
  type?: MusicType;
}) {
  const rankings = { tracks, albums, artists };
  return (
    <>
      {musicTypeSchema.options.map((value) => (
        <TabLinkPanel
          key={value}
          id={`music-top-${value}-panel`}
          tabId={`music-top-${value}-tab`}
          hidden={type !== value}
          className="music-top-music"
        >
          <MusicTopList title={`Top ${value}`} items={rankings[value]} kind={value} />
        </TabLinkPanel>
      ))}
    </>
  );
}
