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

Source data and the exact visual design should be verified during migration.
The counts and date range above describe the inspected legacy archive; they
should not be treated as permanent values after new events are added.
