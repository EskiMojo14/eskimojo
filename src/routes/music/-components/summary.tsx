import { useLayoutEffect, useRef, useState } from "react";
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
  const summaryRef = useRef<HTMLElement>(null);
  const [progress, setProgress] = useState(1);
  useLayoutEffect(() => {
    const element = summaryRef.current;
    const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
    if (!element || reducedMotion.matches) return undefined;

    const style = getComputedStyle(element);
    // Let the browser sample the same spring curve used by CSS transitions.
    const animation = element.animate([], {
      duration: Number.parseFloat(
        style.getPropertyValue("--md-sys-motion-spring-default-effects-duration"),
      ),
      easing: style.getPropertyValue("--md-sys-motion-spring-default-effects").trim(),
      fill: "both",
    });
    const effect = animation.effect;
    if (!effect) throw new Error("Summary count animation requires an animation effect");
    let frame: number;
    setProgress(0);
    function finish() {
      cancelAnimationFrame(frame);
      animation.cancel();
      setProgress(1);
    }
    const tick = () => {
      if (animation.playState === "finished") {
        finish();
        return;
      }
      const eased = effect.getComputedTiming().progress;
      if (typeof eased === "number") setProgress(Math.min(1, Math.max(0, eased)));
      frame = requestAnimationFrame(tick);
    };
    function onMotionChange() {
      if (reducedMotion.matches) finish();
    }
    frame = requestAnimationFrame(tick);
    reducedMotion.addEventListener("change", onMotionChange);
    return () => {
      cancelAnimationFrame(frame);
      animation.cancel();
      reducedMotion.removeEventListener("change", onMotionChange);
    };
  }, []);
  const registered = new Date(user.registered.unixtime * 1000);
  const days = Math.max(1, Math.floor((asOf - registered.getTime()) / 86_400_000));
  const average = Math.round(user.playcount / days);
  return (
    <section ref={summaryRef} {...summaryBem()} aria-label="Listening statistics">
      <p {...summaryBem({ element: "attribution" })}>
        Powered by <a href="https://www.last.fm">Last.fm</a>
      </p>
      <p>I love music! So far I've listened to:</p>
      <dl {...summaryBem({ element: "stats" })}>
        <div>
          <dt>
            <MdSymbol aria-hidden="true">music_history</MdSymbol>Scrobbles
          </dt>
          <SummaryCount value={user.playcount} progress={progress} />
        </div>
        <div>
          <dt>
            <MdSymbol aria-hidden="true">artist</MdSymbol>Artists
          </dt>
          <SummaryCount value={user.artist_count} progress={progress} />
        </div>
        <div>
          <dt>
            <MdSymbol aria-hidden="true">album</MdSymbol>Albums
          </dt>
          <SummaryCount value={user.album_count} progress={progress} />
        </div>
        <div>
          <dt>
            <MdSymbol aria-hidden="true">music_note</MdSymbol>Tracks
          </dt>
          <SummaryCount value={user.track_count} progress={progress} />
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

function SummaryCount({ value, progress }: { value: number; progress: number }) {
  const start = Math.ceil(value * 0.95);
  return (
    <dd>
      <span {...summaryBem({ element: "count-final" })}>{numberFormat.format(value)}</span>
      <span {...summaryBem({ element: "count-animated" })} aria-hidden="true">
        {numberFormat.format(Math.round(start + (value - start) * progress))}
      </span>
    </dd>
  );
}
