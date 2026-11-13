import BEMHelper from "react-bem-helper";

import { MdSymbol } from "#/shared/components/symbol";

const recentTracksBem = BEMHelper("recent-tracks");

export function MusicArtwork({
  imageUrl,
  fallbackIcon,
}: {
  imageUrl?: string;
  fallbackIcon: "artist" | "music_note";
}) {
  return imageUrl ? (
    <img
      {...recentTracksBem({ element: "artwork" })}
      src={imageUrl}
      alt=""
      width={56}
      height={56}
      loading="lazy"
    />
  ) : (
    <span {...recentTracksBem({ element: "placeholder" })} aria-hidden="true">
      {fallbackIcon === "artist" ? <MdSymbol>artist</MdSymbol> : <MdSymbol>music_note</MdSymbol>}
    </span>
  );
}
