# Content and behavior specification

This document records the agreed content and behavior for the new personal
website. Exact copy and final project descriptions still need to be supplied or
written.

## Home and About

The home page should:

- introduce `eskimojo` in a concise, friendly first-person voice;
- make it immediately clear where visitors can find About, Projects, Music,
  and Gigs;
- avoid opening with a dense dashboard of activity statistics.

The About section should cover:

- interests and hobbies;
- creative and technical work;
- current role or professional background;
- the fact that `eskimojo` is a Redux Toolkit maintainer.

The site should not publish a direct email address. The exact biography and
introductory copy are **Open**.

## Projects and contributions

Use a curated set of entries with short descriptions and links, rather than a
comprehensive repository catalogue. The agreed initial scope is:

1. **Keycaplendar:** include the Keycaplendar project, but exclude
   `keycaplendar-next`, which is experimental and unfinished.
2. **Schema benchmarks:** include the schema-benchmarks project.
3. **TypeScript utilities:** group selected utilities into one entry, linking
   to:
   - `history-adapter` — undo/redo state utilities;
   - `rad-event-listeners` — grouped event-listener management;
   - `mix-n-matchers` — custom Jest-compatible matchers.
4. **Redux Toolkit:** feature the maintainer contribution separately and also
   mention it in About.

The exact project descriptions, destinations, ordering, and visual treatment
are **Open**. Do not imply that a project is currently maintained or
production-ready unless that is confirmed.

## Contact and public links

Provide a Contact destination with these selected public profiles:

- GitHub profile: `https://github.com/EskiMojo14`
- Twitter/X: `https://twitter.com/eskimojo`
- Bluesky: `https://bsky.app/profile/eskimojo.bsky.social`

Do not add a public email address. Link to Last.fm from Music, not from the
general Contact group.

The shared site footer also links to GitHub, Twitter/X, and Bluesky, with the
transparent Mitzi illustration centered behind the profile links as decoration.
It credits the artwork to [Popurri](https://x.com/popurri_arts).

## Appearance preferences

An MD3 large flexible top app bar displays the current page title below a
navigation/actions row with a trailing Preferences icon button on all screen sizes.
Without a subtitle, it has a 120px minimum height, display-small title typography,
and 16px title insets. An optional `staticData.subtitle` adds title-medium text
below the title and increases the minimum height to 152px. Long titles and subtitles
wrap and grow the bar rather than being clipped.
The bar scrolls with the page; scroll-driven collapse is not enabled.
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

The browser tab title uses the same deepest matched `staticData.title`, both
on initial load and after navigation, followed by ` | eskimojo` (for example,
`Music | eskimojo`). Missing or empty titles fall back to `eskimojo`; the site
name itself is not suffixed again. Subtitles are not included in the tab title.

The sidebar retains the site
identity. On desktop it stays anchored to the top of the viewport while the page
scrolls, without overlapping the main content. It fills the viewport height;
navigation scrolls independently only when needed to keep links reachable on
short screens. The small-screen modal drawer is unchanged.
No breadcrumbs are needed for the current route hierarchy; Gigs uses
tabs for its internal views.

Client-side navigations, including browser Back and Forward, use a generic
full-page crossfade through the View Transitions API. The fade uses the slow
effects spring and its matching duration. Reduced-motion preferences disable
the animation, and browsers without the API navigate normally without a fade.

The app bar's Preferences button opens a modal dialog with connected button
groups for Theme (System, Light, Dark), Contrast (System, Standard, Medium,
High), and Palette (Goat, Arctic). Each group permits one selection. Changes use the existing cookie-backed
preference providers and apply without a separate Save action.

Arrow keys move focus without selecting; Enter or Space selects the focused
option. Done, Escape, and clicking the backdrop close the dialog without
reverting changes. System follows the corresponding operating-system preference.

## Music

Keep the three listening views:

- Top Tracks;
- Top Artists;
- Recents.

Use current Last.fm-backed data rather than presenting a static historical
snapshot as live. Keep these period choices for Top Tracks and Top Artists:

- 7 days (`7day`);
- 30 days (`1month`);
- 3 months (`3month`);
- 6 months (`6month`);
- 12 months (`12month`);
- all time (`overall`).

Preserve the current defaults:

- Top Tracks: all time, five results;
- Top Artists: all time, five results;
- Recents: five tracks.

Link to the Last.fm profile from this section:
`https://www.last.fm/user/eskimojo14`.

The existing site queries Last.fm with a five-minute query freshness window.
Whether to preserve that exact refresh cadence and how to handle unavailable
Last.fm data are **Open implementation decisions**. Do not silently present
stale or unavailable data as current.

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

The Gigs page uses router-backed primary tabs with stacked icons labelled
By month, By artist, By venue, and By city. These tabs opt into `responsive` sizing.
Tabs otherwise fill the available width at all screen sizes. Above 48rem, responsive horizontal tabs are
content-sized and aligned to the start; smaller screens retain expanding tabs
with horizontal scrolling when needed.
The optional `breakdown` path parameter selects the view:
`/gigs` defaults to By month, with `/gigs/by-month` also selecting that tab;
the other destinations are `/gigs/by-artist`, `/gigs/by-venue`, and
`/gigs/by-city`. Selection follows the URL and browser Back/Forward history.
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
Keyboard focus adds a theme-coloured outline around the chart. The active cell
has a contrasting border instead of a circular marker; clicking the chart does
not show the outer keyboard-focus outline.
Count labels are decorative chart marks, so each cell contributes only one
keyboard navigation stop rather than separate stops for its rectangle and text.
Left/Right move to the adjacent month in the same year; Up/Down move to the
adjacent year in the same month. Movement follows the rendered chart geometry
and stops at the edges without wrapping. Home/End retain first/last-cell
navigation, and Enter/Escape retain tooltip pinning/dismissal.
The artist, venue, and city views remain to be implemented.

Source data and the exact visual design should be verified during migration.
The counts and date range above describe the inspected legacy archive; they
should not be treated as permanent values after new events are added.
