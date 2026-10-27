# Launch and migration notes

## Hosting

Use the repository's existing Netlify setup for the new site. Do not switch
hosts as part of the design unless that decision is revisited explicitly.

### Storybook

Deploy Storybook as a separate Netlify project using `pnpm run build-storybook`
and the `storybook-static` publish directory. Ensure that this project's
effective build settings use those values rather than the application build.
Settings in a `netlify.toml` override the Netlify UI.

Storybook sets `STORYBOOK=true`. The shared Vite configuration uses that flag
to exclude the TanStack Start and Netlify application plugins, as well as the
application MDX plugin. Keep these plugins enabled for normal application
builds; Storybook's framework handles its own routing and server-code mocks.

## Domain

`eskimojo.dev` is owned by the site owner and registered through Namecheap.
DNS remains managed at Namecheap, with separate Netlify projects for:

- Main site: [eskimojo.dev](https://eskimojo.dev).
- Storybook: [storybook.eskimojo.dev](https://storybook.eskimojo.dev), a subdomain
  of the same owned domain, not a separate registration.

The main site's `www.eskimojo.dev` alias redirects to `eskimojo.dev`.
Absolute social preview image URLs resolve against `https://eskimojo.dev`.
Do not change production domain settings without explicit authorization.

### Verification status

Checked 2026-10-27: domain purchase is confirmed. The main site's DNS resolves
to Netlify, HTTPS serves the site successfully, and its Let's Encrypt
certificate covers both `eskimojo.dev` and `www.eskimojo.dev`. Netlify manages
certificate renewal.

The Storybook subdomain's CNAME points to `storybook-eskimojo.netlify.app`.
Its deployment remains pending verification after the Storybook build fix;
the corrected build succeeds locally, but the deployed Storybook content and
its HTTPS certificate still need checking.

## Relationship to the Neocities site

The new site is intended to be the primary personal site. Keep
`https://eskimojo.neocities.org/` online as a frozen legacy/archive site rather
than redirecting it or maintaining it as a second independently updated site.
The archived site should link visitors to the new primary site.

The archive and new site are intentionally separate destinations. A redirect
from the old address is not part of the agreed plan.

The Neocities homepage was reachable on 2026-10-26, but the fetched page did
not show a link to the new primary site. Keep that migration item open until
the archive is updated and checked.

## Migration references

The current Neocities site and its public source are references for content and
behavior:

- Existing site: `https://eskimojo.neocities.org/`
- Existing source: `https://github.com/EskiMojo14/neocities`

Migration priorities:

1. Preserve the Gigs event records and their artist, venue, and city
   relationships.
2. Recreate the Music views using current Last.fm-backed data.
3. Carry forward the selected visual identity while improving the site's
   orientation and readability.
4. Keep the legacy site available and add a clear link to the new primary
   site.

## Deployment and secrets

Verify the deployment environment configuration before launch.
Last.fm credentials or other secrets must be supplied
through the deployment's secret/environment configuration, never committed to
the repository or written into these documents.

CSS minification can rewrite duration tokens from milliseconds to seconds
(for example, `450ms` to `.45s`). Ripple timings read from computed styles must
convert either unit to milliseconds before passing values to the Web
Animations API. The ripple browser tests cover the production representation.

## Open before launch

- Verify the Storybook deployment and HTTPS at `storybook.eskimojo.dev`.
- Decide how unavailable Last.fm data is presented and whether the existing
  five-minute refresh cadence is retained.
- Supply final About and project copy, project URLs, and any imagery.
- Update the Neocities archive with a link to the new primary site.
- Verify migrated Gigs data and accessibility of the city-view alternative.
