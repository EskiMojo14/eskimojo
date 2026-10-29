import type { ComponentPropsWithRef } from "react";
import BEMHelper from "react-bem-helper";

import {
  MusicTopList,
  MusicTopListSkeleton,
} from "#/routes/music.{-$breakdown}/-components/top-list";
import type { TopArtist, TopTrack } from "#/routes/music.{-$breakdown}/-query.ts";
import { SkeletonProgress } from "#/shared/components/skeleton";

const topMusicBem = BEMHelper("music-top-music");
const skeletonBem = BEMHelper("music-skeleton");

function MusicTopMusicLayout({ className, ...props }: ComponentPropsWithRef<"div">) {
  return <div {...props} {...topMusicBem({ extra: className })} />;
}

export function MusicTopMusicSkeleton() {
  return (
    <>
      <SkeletonProgress label="Loading top music..." />
      <MusicTopMusicLayout {...skeletonBem()}>
        <MusicTopListSkeleton title="Top tracks" kind="tracks" />
        <MusicTopListSkeleton title="Top artists" kind="artists" />
      </MusicTopMusicLayout>
    </>
  );
}

export function MusicTopMusic({
  tracks,
  artists,
}: {
  tracks: ReadonlyArray<TopTrack>;
  artists: ReadonlyArray<TopArtist>;
}) {
  return (
    <MusicTopMusicLayout>
      <MusicTopList title="Top tracks" items={tracks} />
      <MusicTopList title="Top artists" items={artists} />
    </MusicTopMusicLayout>
  );
}
