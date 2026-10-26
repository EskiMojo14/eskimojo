import type { TopArtist, TopTrack } from "#/routes/music.{-$breakdown}/-query.ts";

import { MusicTopList } from "./top-list";

export function MusicTopMusic({
  tracks,
  artists,
}: {
  tracks: ReadonlyArray<TopTrack>;
  artists: ReadonlyArray<TopArtist>;
}) {
  return (
    <div className="music-top-music">
      <MusicTopList title="Top tracks" items={tracks} />
      <MusicTopList title="Top artists" items={artists} />
    </div>
  );
}
