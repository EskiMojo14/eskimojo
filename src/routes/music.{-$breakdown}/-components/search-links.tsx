import BEMHelper from "react-bem-helper";

import { ExternalLinkButton } from "#/shared/components/buttons/link-button";

const searchLinksBem = BEMHelper("music-search-links");

export function MusicSearchLinks({ name, artist }: { name: string; artist?: string }) {
  const query = artist ? `${name} ${artist}` : name;
  return (
    <span {...searchLinksBem()}>
      <ExternalLinkButton
        variant="text"
        href={`https://open.spotify.com/search/${encodeURIComponent(query)}`}
        aria-label={`Search Spotify for ${query}`}
      >
        Spotify
      </ExternalLinkButton>
      <ExternalLinkButton
        variant="text"
        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
        aria-label={`Search YouTube for ${query}`}
      >
        YouTube
      </ExternalLinkButton>
    </span>
  );
}
