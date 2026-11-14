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
import type { TopArtist, TopTrack } from "#/routes/music.{-$breakdown}/-query.ts";
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
      <TabLinkPanel
        id="music-top-tracks-panel"
        tabId="music-top-tracks-tab"
        hidden={type !== "tracks"}
        className="music-top-music music-skeleton"
      >
        <MusicTopListSkeleton title="Top tracks" kind="tracks" />
      </TabLinkPanel>
      <TabLinkPanel
        id="music-top-artists-panel"
        tabId="music-top-artists-tab"
        hidden={type !== "artists"}
        className="music-top-music music-skeleton"
      >
        <MusicTopListSkeleton title="Top artists" kind="artists" />
      </TabLinkPanel>
    </>
  );
}

export function MusicTopMusic({
  tracks,
  artists,
  type = "tracks",
}: {
  tracks: ReadonlyArray<TopTrack>;
  artists: ReadonlyArray<TopArtist>;
  type?: MusicType;
}) {
  return (
    <>
      <TabLinkPanel
        id="music-top-tracks-panel"
        tabId="music-top-tracks-tab"
        hidden={type !== "tracks"}
        className="music-top-music"
      >
        <MusicTopList title="Top tracks" items={tracks} />
      </TabLinkPanel>
      <TabLinkPanel
        id="music-top-artists-panel"
        tabId="music-top-artists-tab"
        hidden={type !== "artists"}
        className="music-top-music"
      >
        <MusicTopList title="Top artists" items={artists} />
      </TabLinkPanel>
    </>
  );
}
