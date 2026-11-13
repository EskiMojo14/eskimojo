import BEMHelper from "react-bem-helper";

import SpotifyIcon from "#/routes/music.{-$breakdown}/-icons/spotify.svg?react";
import YouTubeIcon from "#/routes/music.{-$breakdown}/-icons/youtube.svg?react";
import { ExternalLinkButton } from "#/shared/components/buttons/link-button";

const searchLinksBem = BEMHelper("music-search-links");

export function MusicSearchLinks({
  name,
  artist,
  spotifyUrl,
}: {
  name: string;
  artist?: string;
  spotifyUrl?: string;
}) {
  const query = artist ? `${name} ${artist}` : name;
  return (
    <span {...searchLinksBem()}>
      <ExternalLinkButton
        variant="text"
        href={spotifyUrl ?? `https://open.spotify.com/search/${encodeURIComponent(query)}`}
        aria-label={spotifyUrl ? `Open ${query} on Spotify` : `Search Spotify for ${query}`}
        icon={<SpotifyIcon />}
      >
        Spotify
      </ExternalLinkButton>
      <ExternalLinkButton
        variant="text"
        href={`https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`}
        aria-label={`Search YouTube for ${query}`}
        icon={<YouTubeIcon />}
      >
        YouTube
      </ExternalLinkButton>
    </span>
  );
}
