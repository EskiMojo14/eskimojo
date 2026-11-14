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
requires `LASTFM_API_KEY` and `LASTFM_USER` in the server environment.
Keep the API key out of client code. Artwork comes exclusively from Last.fm:
missing track covers use `track.getInfo`, and missing artist images use the
artist's most popular album cover from `artist.getTopAlbums`. Music lists wait
for artwork and dynamic palettes before rendering; missing images use icons.
Spotify and YouTube search links remain available without additional API keys.

For product direction, see the [technical documentation catalog](./docs/README.md).
