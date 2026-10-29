import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import BEMHelper from "react-bem-helper";

import type { UserData } from "#/routes/music.{-$breakdown}/-query.ts";
import { Skeleton, SkeletonProgress } from "#/shared/components/skeleton";
import { MdSymbol } from "#/shared/components/symbol";

const summaryBem = BEMHelper("music-summary");
const skeletonBem = BEMHelper("music-skeleton");
const numberFormat = new Intl.NumberFormat("en-GB");
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

function MusicSummaryLayout({
  counts,
  registered,
  average,
  className,
  ...props
}: Omit<ComponentPropsWithRef<"section">, "children"> & {
  counts: { scrobbles: ReactNode; artists: ReactNode; albums: ReactNode; tracks: ReactNode };
  registered: ReactNode;
  average: ReactNode;
}) {
  return (
    <section {...props} {...summaryBem({ extra: className })} aria-label="Listening statistics">
      <p>I love music! So far I've listened to:</p>
      <dl {...summaryBem({ element: "stats" })}>
        <div>
          <dt>
            <MdSymbol>music_history</MdSymbol>Scrobbles
          </dt>
          <dd>{counts.scrobbles}</dd>
        </div>
        <div>
          <dt>
            <MdSymbol>artist</MdSymbol>Artists
          </dt>
          <dd>{counts.artists}</dd>
        </div>
        <div>
          <dt>
            <MdSymbol>album</MdSymbol>Albums
          </dt>
          <dd>{counts.albums}</dd>
        </div>
        <div>
          <dt>
            <MdSymbol>music_note</MdSymbol>Tracks
          </dt>
          <dd>{counts.tracks}</dd>
        </div>
      </dl>
      <p>
        since {registered} (an average of {average} scrobbles per day), and that's just the ones
        Last.fm knows about.
      </p>
    </section>
  );
}

export function MusicSummarySkeleton() {
  return (
    <>
      <SkeletonProgress label="Loading listening summary..." />
      <MusicSummaryLayout
        {...skeletonBem()}
        aria-hidden="true"
        counts={{
          scrobbles: <Skeleton {...skeletonBem({ element: "line", modifier: "count" })} />,
          artists: <Skeleton {...skeletonBem({ element: "line", modifier: "count" })} />,
          albums: <Skeleton {...skeletonBem({ element: "line", modifier: "count" })} />,
          tracks: <Skeleton {...skeletonBem({ element: "line", modifier: "count" })} />,
        }}
        registered={<Skeleton {...skeletonBem({ element: "line", modifier: "date" })} />}
        average={<Skeleton {...skeletonBem({ element: "line", modifier: "average" })} />}
      />
    </>
  );
}

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
    <MusicSummaryLayout
      ref={summaryRef}
      counts={{
        scrobbles: <SummaryCount value={user.playcount} progress={progress} />,
        artists: <SummaryCount value={user.artist_count} progress={progress} />,
        albums: <SummaryCount value={user.album_count} progress={progress} />,
        tracks: <SummaryCount value={user.track_count} progress={progress} />,
      }}
      registered={<time dateTime={registered.toISOString()}>{dateFormat.format(registered)}</time>}
      average={numberFormat.format(average)}
    />
  );
}

function SummaryCount({ value, progress }: { value: number; progress: number }) {
  const start = Math.ceil(value * 0.95);
  return (
    <>
      <span {...summaryBem({ element: "count-final" })}>{numberFormat.format(value)}</span>
      <span {...summaryBem({ element: "count-animated" })} aria-hidden="true">
        {numberFormat.format(Math.round(start + (value - start) * progress))}
      </span>
    </>
  );
}
