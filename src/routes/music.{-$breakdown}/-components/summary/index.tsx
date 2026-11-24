import {
  useLayoutEffect,
  useRef,
  useState,
  type ComponentPropsWithRef,
  type ReactNode,
} from "react";
import BEMHelper from "react-bem-helper";

import * as copy from "#/routes/music.{-$breakdown}/-copy.tsx";
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
    <section {...props} {...summaryBem({ extra: className })} aria-label={copy.summary.title}>
      <p>{copy.summary.introduction}</p>
      <dl {...summaryBem({ element: "stats" })}>
        <div>
          <dt>
            <MdSymbol>{copy.summary.counts.scrobbles.icon}</MdSymbol>
            {copy.summary.counts.scrobbles.label}
          </dt>
          <dd>{counts.scrobbles}</dd>
        </div>
        <div>
          <dt>
            <MdSymbol>{copy.summary.counts.artists.icon}</MdSymbol>
            {copy.summary.counts.artists.label}
          </dt>
          <dd>{counts.artists}</dd>
        </div>
        <div>
          <dt>
            <MdSymbol>{copy.summary.counts.albums.icon}</MdSymbol>
            {copy.summary.counts.albums.label}
          </dt>
          <dd>{counts.albums}</dd>
        </div>
        <div>
          <dt>
            <MdSymbol>{copy.summary.counts.tracks.icon}</MdSymbol>
            {copy.summary.counts.tracks.label}
          </dt>
          <dd>{counts.tracks}</dd>
        </div>
      </dl>
      <p>{copy.summary.detail(registered, average)}</p>
    </section>
  );
}

export function MusicSummarySkeleton() {
  return (
    <>
      <SkeletonProgress label={copy.summary.loading} />
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
  const frameRef = useRef(-1);
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
    setProgress(0);

    function finish() {
      cancelAnimationFrame(frameRef.current);
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
      frameRef.current = requestAnimationFrame(tick);
    };

    function onMotionChange() {
      if (reducedMotion.matches) finish();
    }

    frameRef.current = requestAnimationFrame(tick);
    reducedMotion.addEventListener("change", onMotionChange);

    return () => {
      cancelAnimationFrame(frameRef.current);
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
