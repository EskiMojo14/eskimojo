# Content and behavior specification

This document records the agreed content and behavior for the new personal
website. Current site content, including project copy, links, and imagery, is
final for now. Further projects may be added over time.

## Home

The home page also serves as the site's About page; do not create a separate
About destination. Its content is arranged as:

- an illustrated hero introducing `eskimojo` through rotating roles;
- a short biography and interests list authored in
  [`-intro.mdx`](../src/routes/_home/-intro.mdx);
- a "Find me elsewhere" section with larger social profile links;
- palette-aware sidebar artwork, fixed behind the content and bottom-aligned
  on phone-sized screens, softened to 15% opacity for text readability.

The home page should:

- introduce `eskimojo` in a concise, friendly first-person voice;
- rely on the persistent navigation for links to Projects, Music, and Gigs
  rather than duplicating those links in the page content;
- avoid opening with a dense dashboard of activity statistics.

The hero's rotating roles can be paused or advanced manually. Screen readers
receive a complete static introduction rather than repeated announcements.
Reduced-motion preferences show that static introduction without animation
or playback controls.

## Projects and contributions

Use a curated set of entries with short descriptions and links, rather than a
comprehensive repository catalogue. The agreed initial scope is:

1. **Keycaplendar:** include the Keycaplendar project, but exclude
   `keycaplendar-next`, which is experimental and unfinished.
2. **Schema benchmarks:** include the schema-benchmarks project.
3. **TypeScript utilities:** give each selected library its own entry and detail
   page:
   - `history-adapter` — undo/redo state utilities;
   - `rad-event-listeners` — grouped event-listener management;
   - `mix-n-matchers` — custom Jest-compatible matchers.
4. **Redux Toolkit:** feature the maintainer contribution separately and also
   mention it on the home page.
5. **Valibot:** include a separate contribution entry; describe this as
   contributing, not maintaining or independently authoring the library.

Each entry is authored in MDX, with validated frontmatter for its title, short
summary, links, ordering, and `kind` (`project`, `package`, or `contribution`).
The overview groups entries under Projects, Packages, and Open-source
contributions, omitting empty sections. Ordering applies within each group.
The overview links to a dedicated
`/projects/<slug>` page, dynamically importing that entry's body on navigation.
A shared-title View Transition connects the two views and respects reduced
motion. See [MDX content](./mdx-content.md) for authoring details.
The detail page has a back-arrow link in the app bar that returns to Projects,
including on direct visits; it replaces the menu action rather than adding a
second control in the page content.

The current selection, descriptions, and destinations are final for now.
Additional projects can be added later. Do not imply that a project is currently
maintained or production-ready unless that is confirmed.

## Contact and public links

Contact links live in the homepage's "Find me elsewhere" section, not in the
footer, a separate Contact page, or a primary-navigation destination:

- GitHub profile: `https://github.com/EskiMojo14`
- Twitter/X: `https://twitter.com/eskimojo`
- Bluesky: `https://bsky.app/profile/eskimojo.bsky.social`

The homepage uses profile cards showing each platform and handle. Links open
in a new tab and communicate that behavior accessibly.

Do not add a public email address. Link to Last.fm from Music, not from the
general social profile group.

The shared footer links to the [site's source code](https://github.com/EskiMojo14/eskimojo)
on GitHub and credits the artwork to [Popurri](https://x.com/popurri_arts).
The homepage does not repeat the hero's Mitzi illustration in the footer.

## Snackbars

The app shell mounts one `SnackbarHost`. Import `showSnackbar`,
`dismissSnackbar`, and `clearSnackbars` from `#/shared/lib/snackbar` in any
client-side module; no hook or provider is required:

```ts
const id = showSnackbar("Changes saved.");
showSnackbar({
  message: "Item removed.",
  action: { label: "Undo", onClick: restoreItem },
});
if (id !== undefined) dismissSnackbar(id);
```

Calls queue in arrival order, with only one MD3 snackbar visible at a time.
Plain messages dismiss after five seconds of visible, unhovered, unfocused
time. Action messages persist until acted on or dismissed. `duration` can be
`null` for persistence or 4000-10000 milliseconds for an explicit timeout;
queued messages start their timeout only when displayed. `dismissSnackbar(id)`
also removes queued messages; `clearSnackbars()` clears the queue.
Timed messages hide their close button by default. Set `showCloseButton: true`
to opt in, for example `showSnackbar({ message: "Changes saved.", showCloseButton: true })`.
Persistent messages always show a close button, even if `showCloseButton: false`
is supplied.

Messages use inverse surface colors, body-medium text, an optional inverse-primary
text action, and an optional close affordance. Entry motion uses spring tokens and is
disabled for reduced motion. The manual popover never steals focus or
light-dismisses; keyboard dismissal restores the previous focus. Hidden tabs
and open modal dialogs suspend display and timing. Announcements use
`ariaNotify` when available, with a persistent polite live-region fallback.
`rad-event-listeners` groups document and surface listeners with unsubscribe
functions that run on cleanup.
When compact bottom navigation is present, the snackbar anchors one rem above
its actual top edge. Its maximum height reserves the navigation's measured
height, including safe-area padding. Without navigation, the anchor fallback
places it one rem above the bottom safe area.

Use snackbars only for short, non-critical feedback; keep the information and
any action available elsewhere in the UI.

### Snackbar wording

Follow [Material Design 3's text-label guidance](https://m3.material.io/components/snackbar/guidelines):
write short, clear updates about the process, ideally one line and no more than
two on mobile. Use plain, user-facing verbs such as "save" rather than technical
terms such as "sync", and name the affected item when it clarifies the message.
For example, prefer "Couldn't save theme preference" to
"Couldn't sync your theme preference. Please try again."
Avoid filler such as "Please try again"; if retry is offered in the snackbar,
use a separate, concise "Retry" action button. Do not imply that an action is
available when it is not. These wording choices are project conventions based
on Material's brevity guidance, not prescribed Material strings.

### Snackbar actions and runtime

Action callbacks are synchronous;
handle asynchronous work and its errors in the caller. A successful callback
dismisses the message; thrown errors propagate rather than appearing successful.
The API uses TanStack Start's `createIsomorphicFn().client(...)`. Server calls
are no-ops, return `undefined`, and never queue notifications. `showSnackbar`
returns a message ID in the browser; guard the returned value before passing it
to `dismissSnackbar` in isomorphic code. Empty text and invalid durations throw
in the browser.
Messages queued before hydration wait until the host is hydrated, preserving
the empty server markup and its persistent announcement region.

### Recent-track cover palettes

Each recently played track with cover art uses an image-derived surface, text,
link, and now-playing accent palette. The artwork server function fetches only
HTTPS images from the supported Spotify, Last.fm, and Cover Art Archive hosts,
including Internet Archive image servers, and generates light/dark colors for all
three contrast settings with Sharp and Material Color Utilities. The same
decoder, deterministic seed selection, and readable-color helpers support
build-time project palettes. Image processing libraries remain server-only;
the browser receives color values.

TanStack Start's import protection in [`vite.config.ts`](../vite.config.ts)
rejects client imports of `sharp` and `@material/material-color-utilities`,
including package subpaths, in both development and production builds. These
rules extend Start's default environment boundaries, including `*.server.*`
files. Keep runtime palette processing behind server functions and add any
future server-only dependencies to the client specifier deny list.

Successful palettes are cached by artwork URL for 24 hours in a bounded
128-entry per-process cache. Requests process up to four covers concurrently,
deduplicate repeated artwork, and share a five-second extraction deadline.
Downloads are capped at 1 MB, redirects are rejected, and decoding is bounded
to four million source pixels and two seconds. Missing artwork retains the
site palette; failed extraction is logged and does not hide listening history.
On an uncached load, keep the list skeleton visible until artwork lookup and
palette extraction finish, then render the items with their resolved colors.
Cached results can render immediately; do not seed the artwork query with
unpaletted Last.fm images.
Last.fm's default star image (`2a96cbd8b46e442fc41c2b86b821562f.png`) is
normalized to missing artwork at the API boundary, across image sizes and both
Last.fm CDN hostnames. These rows use the site palette and music-note icon
without downloading or extracting a palette from the placeholder. Genuine
artwork from other providers is unchanged.
Cancelling the request still cancels the operation. The surrounding Music page,
top-music lists, and navigation keep the selected site palette.

## Appearance preferences

An MD3 large flexible top app bar displays the current page title below a
navigation/actions row with a trailing Preferences icon button on all screen sizes.
Without a subtitle, it has a 120px minimum height, display-small title typography,
and 16px title insets. An optional `staticData.subtitle` adds title-medium text
below the title and increases the minimum height to 152px. Long titles and subtitles
wrap and grow the bar rather than being clipped.
The title and subtitle scroll with the page while the navigation/actions row stays
sticky at the top, keeping Preferences available. As the title reaches the
toolbar it collapses into an MD3 small app bar: a CSS scroll-driven animation
scales it from display-small to title-large and moves it beside any leading
icon, with lines after the first clipped away. Once it lines up, an
`aria-hidden` single-line copy in the toolbar (truncated with an ellipsis) takes
over, so the heading is announced once. Reduced motion skips the scaling and
fades the copy in instead. Pages always have room to scroll through the
collapse, and a scroll that ends partway through it settles to whichever end is
nearer (a `scrollend` listener; CSS proximity snapping would also pull nearby
scroll positions on long pages back to the collapse point). Browsers without
scroll-driven animations let the title scroll away under the toolbar.
The toolbar surface changes from `surface` to `surface-container-high` (matching
the raised bottom navigation) and gains a level 1 elevation shadow when stuck,
using CSS scroll-state queries. Both transition with the default effects spring;
reduced motion switches instantly. Browsers without scroll-state query support
keep the flat base surface; no JavaScript scroll listener is used.
On small screens, its leading menu icon opens the
modal navigation drawer; the desktop drawer remains permanent. Preferences is
not available inside either drawer, so opening it never stacks mobile modals.
Page titles are supplied by route `staticData.title`; the app bar uses
`useMatches` to select the deepest matched route with a title and reads both
`title` and `subtitle` from that route. A child route with its own title but no
subtitle does not inherit an ancestor's subtitle; a child without a title retains
the ancestor's title/subtitle pair. For example:

```ts
staticData: { title: "Music", subtitle: "Recent listening and all-time favourites" }
```

Each route declares its browser tab title in `head` using the shared
`tanstack-meta` generator, matching its `staticData.title`. TanStack Router
applies the deepest matched route's metadata on initial load and after navigation.
The shared template appends ` | eskimojo` (for example, `Music | eskimojo`).
Missing or empty titles fall back to `eskimojo`; the site name itself is not
suffixed again. Subtitles are not included in the tab title.

Every route supplies a page-specific description for search and social previews.
Open Graph and Twitter metadata share that description and use the existing
712-by-712 Goat portrait (`/sources/Goat_square-1.jpeg`) with alternative text.
Small on-page portraits use `/Goat-avatar.webp`; social previews retain the
larger JPEG rather than the 144-by-144 avatar.
Preview image URLs resolve against `https://eskimojo.dev`; Twitter uses a
square-image summary card.

During December (UTC), the Goat sidebar artwork, palette-switcher avatar and
favicon, and the Mitzi home hero use their Christmas versions. Adding
`?christmas=true` enables them at other times too; the Arctic palette continues
to use its usual sidebar artwork, avatar and favicon.

The sidebar retains the site
identity. On desktop it stays anchored to the top of the viewport while the page
scrolls, without overlapping the main content. It fills the viewport height;
navigation scrolls independently only when needed to keep links reachable on
short screens. The small-screen modal drawer is unchanged.
No breadcrumbs are needed for the current route hierarchy; Gigs uses
tabs for its internal views.

Client-side navigations, including browser Back and Forward, use the View
Transitions API. Navigation between the projects list and a project detail
page shares the project's title, summary, and links between views. The router
selects transition types from the source and destination locations, so link
clicks and browser history behave consistently. Top-level sections and the
Music/Gigs breakdowns animate in destination order, not history direction.
Music period changes and project filters use their own transition types.
Default breakdown aliases share the same position; selecting an unchanged
location does not animate. Switching directly between two project kinds uses
the generic fade rather than animating the filtered cards.
Other navigations use a generic full-page crossfade
with the slow effects spring and its matching duration. Reduced-motion
preferences disable the animation, and browsers without the API navigate
normally without a fade.

Call `addNavigationTransitions(router)` after constructing a router to install
the transition selector from `src/shared/lib/view-transitions/index.ts`, preserving its other
options. This injects the router's `matchRoutes` method into
`createNavigationTransitionTypes`. It builds route matches and reuses Router's
param parsing, search validation (including inherited validators), and
loader-dependency calculation without executing route loaders. Unknown URLs,
partial matches, and validation errors retain the generic fade.

To add another set of route tabs, add its route pattern, parameter name,
ordered tab values, and default tab to `tabGroups` using `defineTabGroup`.
The factory checks the parameter against the route's parsed params and
constrains both the ordered values and default to that parameter's string
union. Reuse the route's existing schema options and fallback for those
values. The shared logic reads the tab
from the parsed params and uses its option order for direction. Keep
route-specific search transitions, such as the music period, separate from
the tab-group registry. Add transition cases beside the selector when
registering a new group.

For list/detail navigation, add the list and detail route patterns
and transition type to `detailGroups` using `defineDetailGroup` in
`src/shared/lib/view-transitions/constants.ts`. Both patterns must be registered routes, and the
detail pattern must be beneath the list pattern. Patterns
use Router's destination paths (for example, `/projects` and
`/projects/$slug`). The shared matcher handles navigation in either
direction, including filtered lists and trailing-slash URLs. Sibling
details and unregistered nested routes do not match. The named transition still needs its corresponding CSS and shared
element names; registering a group only selects the type.

For query-parameter filters, add an entry to `filterGroups` in
`src/shared/lib/view-transitions/constants.ts` using `defineFilterGroup` with a route pattern,
parameter name, and transition-type callback. No duplicate filter schema is
needed: the factory infers valid parameter names and both callback arguments
from the route's generated `fullSearchSchema` type. It compares validated
match search values, including route-validator defaults. Supply `defaultValue`
only when an optional search value has a separate application-level default,
such as the music period's loader default. With a defined default, both callback
arguments are non-nullish; without one, they retain the route's optional type.
Invalid values are left to route
validation with a generic fade. Tab changes take precedence over filters.
The type callback preserves filter-specific behavior, such as project
kind variants and the generic fade between two selected kinds.

Factory type checks live in `src/shared/lib/view-transitions/factories.test-d.ts`
and run through `vp run test:types`. The types project uses
`config/tsconfig.type-tests.json` without MDX content mappers because Vitest's
compiler invocation does not enable `--runExternalCode`. The normal
`vp run typecheck` still checks MDX through the main configuration.

The app bar's Preferences button opens a modal dialog with connected button
groups for Theme (System, Light, Dark), Contrast (System, Standard, Medium,
High), and Palette (Goat, Arctic). Each group permits one selection. Changes use the existing cookie-backed
preference providers and apply optimistically to the controls and page without
waiting for the cookie save or loader refresh. Rapid changes to each preference
are saved in selection order. A failed update rolls back to the saved value and
is logged to the console and queues a dismissible snackbar naming the preference;
selecting again retries. The snackbar appears after the modal closes, following
the shared notification host's modal behavior.
There is no separate Save action.

Arrow keys move focus without selecting; Enter or Space selects the focused
option. Done, Escape, and clicking the backdrop close the dialog without
reverting changes. System follows the corresponding operating-system preference.

## Music

The Now playing icon and label and listening-summary counts use the theme's
tertiary accent. Summary card surfaces and labels remain neutral.

Provide two listening tabs: Top music (the default) and Recently played.
Top music combines Top tracks and Top artists with one shared listening-period
picker. Show tracks first, then artists: side by side when the content area has
room for two readable columns, and stacked on smaller screens. Each list adapts
its row layout to its own available width.
Use `/music` for the default view, `/music/top-music` for its explicit URL, and
`/music/recent` for Recently played. No redirects for the former separate tabs
are required before launch.

Use current Last.fm-backed data rather than presenting a static historical
snapshot as live. Keep these period choices for Top Tracks and Top Artists:

- 7 days (`7day`);
- 30 days (`1month`);
- 3 months (`3month`);
- 6 months (`6month`);
- 12 months (`12month`);
- all time (`overall`).

Use Last.fm for listening data and prefer its artwork for both tracks and artists.
Only entries without a supported, non-placeholder Last.fm image reach the other
providers. Last.fm artwork still receives an image-derived palette; it does not
trigger MusicBrainz, Cover Art Archive, or Spotify lookups.

For tracks missing Last.fm artwork, try Cover Art Archive: use the album's release
MBID when available (also trying it as a release-group ID if the release has no
cover), or resolve the track's recording MBID to releases through MusicBrainz.
Recording and artist MBIDs are not release IDs. Try up to three releases per
recording, with a shared twelve-second lookup
deadline and up to three concurrent cover lookups. Serialize MusicBrainz requests
with at least one second between requests and identify the application with a
contactable User-Agent. Release mappings and cover hits/misses use bounded
256-entry, six-hour per-process caches; transient errors are not cached.
Merged recording IDs follow at most five redirects, restricted to HTTPS
MusicBrainz recording endpoints; every hop goes through the same rate limiter.
MusicBrainz 429/503 responses pause queued lookups for at least thirty seconds,
or a longer `Retry-After`, and the remaining cooldown contributes to the client
artwork retry delay. Cached mappings and direct cover lookups remain usable.
The original service failure is logged; skips during its cooldown stay marked
incomplete without emitting additional failure logs.

Cover lookups use HEAD requests to verify a 250px front thumbnail exists, following
at most five redirects and validating each HTTPS destination against the Cover Art
Archive / Internet Archive host allowlist. Palette downloads still reject redirects.
If there is no usable MBID or cover, try Spotify's GB catalog, matching both the
normalized track and artist names. Only tracks still missing artwork reach Spotify.
Artist portraits missing Last.fm artwork use Spotify because Cover Art Archive
stores release covers, not artist portraits.

If no provider supplies artwork, or an image fails to load, use the existing
icon fallback. Every provider's artwork can supply a readable palette; only Spotify
matches link directly to Spotify. List content waits for artwork and palette
resolution inside its existing Suspense boundary; the summary, tabs, and period
picker remain independent and usable. Incomplete provider lookups
retry after at least thirty seconds, respecting longer Spotify rate limits;
completed lookups remain fresh for six hours.
If the artwork server-function request fails, log the failure and recover with
validated Last.fm images or icons, retaining successfully loaded listening data.
Retry enrichment after thirty seconds rather than caching this fallback for six
hours. Cancellation still propagates instead of producing fallback data.

Current defaults:

- Top tracks and Top artists: all time, ten results each;
- Recently played: ten tracks.

Link to the Last.fm profile from this section:
`https://www.last.fm/user/eskimojo14`.

Poll recent listening data to keep it current; retain the five-minute freshness
window for top tracks rather than applying it to all Last.fm data. Do not
silently present unavailable data as current.

The route loader starts the summary and active tab's queries in parallel without
waiting for them. Components consume the same cached queries with Suspense, so
navigation can display the tabs and period picker immediately. The summary and
active tab have independent skeleton loaders; changing the listening
period shows loading feedback for that period instead of the previous rankings.
Cached results retain their existing freshness and recent-track polling behavior.
Preload failures are logged. Independent `react-error-boundary` boundaries around
the summary and active tab show contextual errors without hiding successful data,
tabs, or period controls. Retry resets both the component boundary and TanStack
Query's error state. Changing the tab or period resets the active-tab boundary.
Initial query failures never appear as empty listening history. Failed
recent-track background refreshes retain the last loaded results, log the error,
and show a polite refresh notice with Retry; the action is busy while fetching
and the notice clears after a successful refresh. The route-level error page
remains the last resort for failures outside these boundaries.

The shared `CircularProgress` component uses the flat MD3 shape. Where
`corner-shape: bevel` is supported, its active and track strokes end in cut
(pointed) caps to match the app's beveled corners, like the linear indicator;
other browsers keep round caps.
Circular and linear indicators live under `src/shared/components/progress`, with
their stories grouped under `Components/Progress`.
Omit `value` for indeterminate loading; supply `value` and optional `max`
(default `1`) for determinate progress. Native progress semantics provide the
accessible label and completion value; decorative SVG strokes provide rounded
caps and a track gap. Values clamp to 0-max; non-finite values and invalid maxima
throw explicitly. Styles load through the root stylesheet. Reduced motion
disables rotation and sweeping and makes determinate updates immediate.

`LinearProgress` uses the same `label`, `value`, and `max` API and shared numeric
validation. It fills its container's inline width with a flat 4px track, a gap
around the active segment, and a stop marker at the completion end for determinate
progress. Empty progress shows the track and stop; complete progress fills the
track and removes the stop. Indeterminate progress travels from inline start to
inline end, automatically mirroring in RTL. Reduced motion shows a static segment
instead. The root stylesheet includes its styles; `--linear-progress-thickness`
can increase the track and stop size. Place linear progress along a loading
container's edge rather than replacing the compact circular button indicator.

`Button` accepts `loading` to center a flat, trackless circular indicator in place
of its visible content, following
[MD3 button progress guidance](https://m3.material.io/components/progress-indicators/guidelines).
Its original label and dimensions are preserved. The indicator inherits the
button text color rather than disabled coloring; `aria-busy` and `aria-disabled`
communicate state, duplicate activation is blocked, and keyboard focus is retained.
The recent-track retry uses this instead of changing its label to "Retrying...".

Following [Material 3 skeleton-loader guidance](https://m3.material.io/styles/motion/transitions/transition-patterns),
the placeholders reuse the summary card grid and ten-row list layouts, including
artwork, rankings, metadata, and the responsive top-music columns. Neutral surface
tokens and a staggered opacity pulse indicate loading; reduced motion disables
the pulse and content reveal. Each fallback has one named, indeterminate progress
element for assistive technology, while decorative placeholders are hidden and
never keyboard-focusable.

Loaded content and skeletons share `MusicSummaryLayout`, `MusicListLayout`,
`MusicListRow`, and `MusicTopMusicLayout`. These own the summary copy, card
labels, heading/list structure, row slots, and responsive columns. Data formatting,
count animation, interactive search links, and inert placeholders stay in their
respective consumers, so loading states never need fake listening data.
Each component's skeleton and layout live alongside its loaded implementation in
the same file. Shared `Skeleton` and `SkeletonProgress` components live in
`src/shared/components/skeleton`, with neutral placeholder styling, a
reduced-motion-aware pulse, and a named indeterminate loading announcement.
`Skeleton` accepts standard span props for sizing and classes; its decorative
content is always hidden from assistive technology. The root stylesheet includes
the shared skeleton styles. Music-specific widths, action sizing,
row and column stagger timing, and content reveal remain local, as does the shared
music-list structure. The pulse reads inherited `--skeleton-delay` and
`--skeleton-column-delay` custom properties, both defaulting to zero.
Loading stories live in each owning component's story file beside its loaded
and empty states.

## Gigs

Migrate the existing 74-event archive and plan to maintain its structured data
manually. The source archive currently spans **2015-08-09 through 2026-10-07**.
Its event records contain:

- `artists` — main or co-billed artists, excluding support acts;
- `venue` — venue name;
- `date` — `YYYY-MM-DD`;
- `city`;
- optional `support` artists.

Keep one Gigs archive with internal views for:

1. Year / month;
2. Artist;
3. Venue;
4. City.

Open on Year / month. Keep the existing artist and venue breakdowns, and keep
the city visualization, where circle area represents event count. The city view
must also provide an accessible text/list alternative.
The shared intro blurb includes the total number of recorded gigs, calculated
from the archive, so the count appears above every breakdown rather than only
inside the monthly heatmap.

The Gigs page uses router-backed primary tabs with stacked icons labelled
By month, By artist, By venue, and By city. These tabs opt into `responsive` sizing.
Tabs otherwise fill the available width at all screen sizes. Above 48rem, responsive horizontal tabs are
content-sized and aligned to the start; smaller screens retain expanding tabs
with horizontal scrolling when needed.
The optional `breakdown` path parameter selects the view:
`/gigs` defaults to By month, with `/gigs/by-month` also selecting that tab;
the other destinations are `/gigs/by-artist`, `/gigs/by-venue`, and
`/gigs/by-city`. Selection follows the URL and browser Back/Forward history.
The `artist`, `city`, and `venue` search filters combine across all breakdowns.
Artist filters include both main and support appearances. Venue filters use the
same "Venue, City" value as the venue chart so equally named venues in different
cities remain distinct.
The Year / month view uses TanStack Charts to display a heatmap with January
through December as columns and ascending years as rows. It counts events, not
artists, and includes all months and intervening years between the first and last
recorded event. Zero counts remain visible. Cells show exact counts alongside a
theme-aware colour intensity scale, and a screen-reader-only semantic table
provides the same values without duplicating the visible chart. The table is
visually clipped, not hidden from assistive technology. The chart and its cells
shrink to fit the available width on narrow screens without horizontal scrolling.
An empty archive displays "No gigs recorded yet."
Hovering or keyboard-focusing a cell shows a custom tooltip listing that month's
events in date order, including main/co-billed artists, support when recorded,
date, and venue. Its surface, typography, spacing, rounded corners, elevation,
and text action match the site's rich tooltips. Empty months explicitly say no gigs are recorded. Clicking,
tapping, or pressing Enter pins the details so long lists can be scrolled.
Escape, clicking outside, or Close details dismisses pinned details. Dates use
UTC so calendar dates cannot shift with the visitor's time zone.
All four charts show a secondary-theme-coloured outline only on `:focus-visible`;
pointer focus does not show it. The city map's clip margin leaves room for its
outer outline. The heatmap's active cell has a contrasting border
instead of a circular marker.
Count labels are decorative chart marks, so each cell contributes only one
keyboard navigation stop rather than separate stops for its rectangle and text.
Left/Right move to the adjacent month in the same year; Up/Down move to the
adjacent year in the same month. Movement follows the rendered chart geometry
and stops at the edges without wrapping. Home/End retain first/last-cell
navigation, and Enter/Escape retain tooltip pinning/dismissal.
The artist view uses a horizontal stacked bar chart with Main and Support
segments per artist, sorted by Main appearances descending, then Support
appearances descending, then alphabetically for ties.
Bar colours use existing primary and tertiary theme tones with contrasting
outlines to keep the series distinct across themes and contrast settings.
Each main/co-billed artist and each recorded support act counts once
per event in its respective role. Support-only artists are included. Hovering or
keyboard-focusing a segment shows both role counts, the total, and a chronological
list of actual events with dates and venues. Support appearances also name the
main/co-billed artists they supported. Clicking or pressing Enter pins the tooltip
so long event lists can be scrolled; Escape or Close details dismisses it. A labelled
legend identifies the segments, and a screen-reader-only semantic table provides
exact counts. An empty archive displays "No artists recorded yet."
Whenever a venue is displayed, its city follows as "Venue, City", including chart
labels, tooltip headings and event details, and accessible table rows.
On the venue chart's axis, venue names and cities instead occupy separate lines,
with cities beneath in smaller, alpha-muted text.
The venue view uses a horizontal bar chart counting events per standardised venue
and city, sorted by count descending and alphabetically for ties. Tooltips list that
venue's events chronologically with main/co-billed artists, dates, and optional
support acts. Support acts use smaller, alpha-muted text. Clicking or pressing
Enter pins the scrollable rich tooltip; Escape or Close details dismisses it.
A screen-reader-only semantic table provides exact venue counts. Empty archives
display "No venues recorded yet."
The city view plots event cities on a locally bundled Natural Earth 1:50m
England outline (public domain), using a shared Mercator projection for coastline
and city-centre coordinates. TanStack Charts' `geoShape` layers project both the
decorative outline and interactive city points responsively. Dot area is proportional
to event count. The chart shows rich tooltips with the city name and chronological events
including artists, dates, venues/cities, and support acts. Hover, focus, or click
shows details; Enter or click pins them, and Escape or Close details dismisses them.
Arrow keys explore the cities, including overlapping dots. A screen-reader-only table gives city counts
without extra visible information. The map crops to the event dots with padding,
rather than showing unvisited northern England. The projection clips land geometry
to the map frame so the outline closes along cropped edges as well as the coastline.
Unknown cities raise an
explicit missing-coordinate error rather than being silently omitted. An empty
archive displays "No cities recorded yet." Map data makes no runtime network
requests and requires no API key.

Source data and the exact visual design should be verified during migration.
The counts and date range above describe the inspected legacy archive; they
should not be treated as permanent values after new events are added.
