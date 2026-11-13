# eskimojo

The source for a personal website about music, live gigs, and projects. The
homepage introduces eskimojo and links to public profiles; Projects showcases
selected work and open-source contributions, while Music and Gigs explore
listening history and live events.

## Preview locally

Install dependencies and start the development server:

```sh
pnpm install
pnpm dev
```

Then open [http://localhost:3000](http://localhost:3000). The Music view
requires `LASTFM_API_KEY` and `LASTFM_USER` in the server environment. Spotify
cover art additionally requires `SPOTIFY_CLIENT_ID` and `SPOTIFY_CLIENT_SECRET`;
keep the secret in the server environment and out of client code. Track covers
prefer Cover Art Archive when MusicBrainz IDs are available, then Spotify, then
Last.fm artwork. Cover Art Archive and MusicBrainz need no API keys. Without
Spotify credentials, listening data and other artwork sources still work.

For product direction, see the [technical documentation catalog](./docs/README.md).
