import BEMHelper from "react-bem-helper";

import type { UserData } from "#/routes/music/-query";
import { MdSymbol } from "#/shared/components/symbol";

const summaryBem = BEMHelper("music-summary");
const numberFormat = new Intl.NumberFormat("en-GB");
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

export function MusicSummary({ user, asOf }: { user: UserData; asOf: number }) {
  const registered = new Date(user.registered.unixtime * 1000);
  const days = Math.max(1, Math.floor((asOf - registered.getTime()) / 86_400_000));
  const average = Math.round(user.playcount / days);
  return (
    <section {...summaryBem()} aria-label="Listening statistics">
      <p {...summaryBem({ element: "attribution" })}>
        Powered by <a href="https://www.last.fm">Last.fm</a>
      </p>
      <p>I love music! So far I've listened to:</p>
      <dl {...summaryBem({ element: "stats" })}>
        <div>
          <dt>
            <MdSymbol aria-hidden="true">music_history</MdSymbol>Scrobbles
          </dt>
          <dd>{numberFormat.format(user.playcount)}</dd>
        </div>
        <div>
          <dt>
            <MdSymbol aria-hidden="true">artist</MdSymbol>Artists
          </dt>
          <dd>{numberFormat.format(user.artist_count)}</dd>
        </div>
        <div>
          <dt>
            <MdSymbol aria-hidden="true">album</MdSymbol>Albums
          </dt>
          <dd>{numberFormat.format(user.album_count)}</dd>
        </div>
        <div>
          <dt>
            <MdSymbol aria-hidden="true">music_note</MdSymbol>Tracks
          </dt>
          <dd>{numberFormat.format(user.track_count)}</dd>
        </div>
      </dl>
      <p>
        since <time dateTime={registered.toISOString()}>{dateFormat.format(registered)}</time> (an
        average of {numberFormat.format(average)} scrobbles per day), and that's just the ones
        Last.fm knows about.
      </p>
    </section>
  );
}
