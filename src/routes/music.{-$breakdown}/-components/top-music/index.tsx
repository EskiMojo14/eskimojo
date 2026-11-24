import { getRouteApi } from "@tanstack/react-router";

import {
  MusicTopList,
  MusicTopListSkeleton,
} from "#/routes/music.{-$breakdown}/-components/top-list";
import { musicTypeSchema, type MusicType } from "#/routes/music.{-$breakdown}/-constants";
import * as copy from "#/routes/music.{-$breakdown}/-copy.tsx";
import type { TopAlbum, TopArtist, TopTrack } from "#/routes/music.{-$breakdown}/-query.ts";
import { SkeletonProgress } from "#/shared/components/skeleton";
import { MdSymbol } from "#/shared/components/symbol";
import { TabLink, TabLinkPanel, TabNav } from "#/shared/components/tabs";

const musicRoute = getRouteApi("/music/{-$breakdown}/{-$type}");

export function MusicTopMusicTabs() {
  return (
    <TabNav
      aria-label={copy.topTabs.title}
      variant="secondary"
      className="music-top-music"
      responsive
    >
      {musicTypeSchema.options.map((type) => (
        <TabLink
          key={type}
          id={`music-top-${type}-tab`}
          panelId={`music-top-${type}-panel`}
          from={musicRoute.id}
          to="."
          params={(previous) => ({ ...previous, type })}
          search={(previous) => ({ period: previous.period })}
          activeOptions={{ exact: true }}
          icon={<MdSymbol>{copy.topTabs.type[type].icon}</MdSymbol>}
          replace
        >
          {copy.topTabs.type[type].label}
        </TabLink>
      ))}
    </TabNav>
  );
}

export function MusicTopMusicSkeleton({ type = "tracks" }: { type?: MusicType }) {
  return (
    <>
      <SkeletonProgress label={copy.topMusic.loading} />
      {musicTypeSchema.options.map((value) => (
        <TabLinkPanel
          key={value}
          id={`music-top-${value}-panel`}
          tabId={`music-top-${value}-tab`}
          hidden={type !== value}
          className="music-top-music music-skeleton"
        >
          <MusicTopListSkeleton title={copy.topMusic.titles[value]} kind={value} />
        </TabLinkPanel>
      ))}
    </>
  );
}

export function MusicTopMusic({
  tracks,
  albums,
  artists,
}:
  | { tracks: ReadonlyArray<TopTrack>; albums?: never; artists?: never }
  | { tracks?: never; albums: ReadonlyArray<TopAlbum>; artists?: never }
  | { tracks?: never; albums?: never; artists: ReadonlyArray<TopArtist> }) {
  const type = tracks !== undefined ? "tracks" : albums !== undefined ? "albums" : "artists";
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
          <MusicTopList
            title={copy.topMusic.titles[value]}
            items={rankings[value] ?? []}
            kind={value}
          />
        </TabLinkPanel>
      ))}
    </>
  );
}
