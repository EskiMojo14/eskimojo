import { useState } from "react";
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
  const [failedImageUrl, setFailedImageUrl] = useState<string>();
  const showArtwork = imageUrl && imageUrl !== failedImageUrl;

  if (showArtwork) {
    return (
      <img
        {...recentTracksBem({ element: "artwork" })}
        src={imageUrl}
        alt=""
        width={56}
        height={56}
        loading="lazy"
        onError={() => setFailedImageUrl(imageUrl)}
      />
    );
  }

  return (
    <span {...recentTracksBem({ element: "placeholder" })} aria-hidden="true">
      {fallbackIcon === "artist" ? <MdSymbol>artist</MdSymbol> : <MdSymbol>music_note</MdSymbol>}
    </span>
  );
}
