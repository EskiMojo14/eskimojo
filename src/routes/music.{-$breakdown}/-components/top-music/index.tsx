import { MusicTopList } from "#/routes/music.{-$breakdown}/-components/top-list";
import type { TopArtist, TopTrack } from "#/routes/music.{-$breakdown}/-query.ts";

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
