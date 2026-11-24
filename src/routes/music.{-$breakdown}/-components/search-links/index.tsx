import BEMHelper from "react-bem-helper";

import * as copy from "#/routes/music.{-$breakdown}/-copy.tsx";
import SpotifyIcon from "#/routes/music.{-$breakdown}/-icons/spotify.svg?react";
import YouTubeIcon from "#/routes/music.{-$breakdown}/-icons/youtube.svg?react";
import { ExternalLinkButton } from "#/shared/components/buttons/link-button";

const searchLinksBem = BEMHelper("music-search-links");

export function MusicSearchLinks({ name, artist }: { name: string; artist?: string }) {
  const query = artist ? `${name} ${artist}` : name;

  return (
    <span {...searchLinksBem()}>
      <ExternalLinkButton
        variant="text"
        href={`https://open.spotify.com/search/${encodeURIComponent(query)}`}
        aria-label={copy.search.spotify.accessibleLabel(query)}
        icon={<SpotifyIcon />}
      >
        {copy.search.spotify.label}
      </ExternalLinkButton>
      <ExternalLinkButton
        variant="text"
        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
        aria-label={copy.search.youtube.accessibleLabel(query)}
        icon={<YouTubeIcon />}
      >
        {copy.search.youtube.label}
      </ExternalLinkButton>
    </span>
  );
}
