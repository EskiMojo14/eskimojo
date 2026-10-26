# Launch and migration notes

## Hosting

Use the repository's existing Netlify setup for the new site. Do not switch
hosts as part of the design unless that decision is revisited explicitly.

## Domain

The selected public URL is `https://eskimojo.dev`, which is used to resolve
absolute social preview image URLs. Domain registration and DNS/Netlify
configuration still need to be verified before launch. This selection is not
authorization to buy the domain or change production domain settings.

## Relationship to the Neocities site

The new site is intended to be the primary personal site. Keep
`https://eskimojo.neocities.org/` online as a frozen legacy/archive site rather
than redirecting it or maintaining it as a second independently updated site.
The archived site should link visitors to the new primary site.

The archive and new site are intentionally separate destinations. A redirect
from the old address is not part of the agreed plan.

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

Confirm the Netlify production site, environment configuration, and final
domain before launch. Last.fm credentials or other secrets must be supplied
through the deployment's secret/environment configuration, never committed to
the repository or written into these documents.

## Open before launch

- Confirm domain registration, DNS, and Netlify domain configuration.
- Decide how unavailable Last.fm data is presented and whether the existing
  five-minute refresh cadence is retained.
- Supply final About and project copy, project URLs, and any imagery.
- Update the Neocities archive with a link to the new primary site.
- Verify migrated Gigs data and accessibility of the city-view alternative.
