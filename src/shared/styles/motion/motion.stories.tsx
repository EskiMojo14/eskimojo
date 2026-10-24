import { useState, type ReactNode } from "react";

import preview from "#.storybook/preview";
import { createBem } from "#/shared/lib/bem";

import "./motion.stories.css";

const motionTrackBem = createBem("motion-track");
const motionDotBem = createBem("motion-dot");
const motionPageBem = createBem("motion-page");
const motionPlayBem = createBem("motion-play");
const motionRowBem = createBem("motion-row");
const motionLabelBem = createBem("motion-label");

const easings = [
  "emphasized",
  "emphasized-decelerate",
  "emphasized-accelerate",
  "standard",
  "standard-decelerate",
  "standard-accelerate",
  "legacy",
  "legacy-decelerate",
  "legacy-accelerate",
  "linear",
] as const;

const durations = (["short", "medium", "long", "extra-long"] as const).flatMap((group) =>
  [1, 2, 3, 4].map((step) => `${group}${step}`),
);

const speeds = ["fast", "default", "slow"] as const;

function Track({
  duration,
  easing,
  effects = false,
}: {
  duration: string;
  easing: string;
  effects?: boolean;
}) {
  return (
    <div
      {...motionTrackBem({ modifiers: { effects } })}
      style={{ "--track-duration": duration, "--track-easing": easing }}
    >
      <div {...motionDotBem()} />
    </div>
  );
}

function Demo({ children }: { children: ReactNode }) {
  const [played, setPlayed] = useState(false);
  return (
    <main {...motionPageBem()} data-played={played || undefined}>
      <button type="button" {...motionPlayBem()} onClick={() => setPlayed((p) => !p)}>
        {played ? "Play back" : "Play"}
      </button>
      {children}
    </main>
  );
}

function Row({ token, children }: { token: string; children: ReactNode }) {
  return (
    <section {...motionRowBem()}>
      <code {...motionLabelBem()}>{token}</code>
      {children}
    </section>
  );
}

const meta = preview.meta({
  title: "Foundations/Motion",
  parameters: {
    layout: "fullscreen",
  },
});

export const Easing = meta.story({
  render: () => (
    <Demo>
      {easings.map((easing) => {
        const token = `--md-sys-motion-easing-${easing}`;
        return (
          <Row key={token} token={token}>
            <Track duration="var(--md-sys-motion-duration-long2)" easing={`var(${token})`} />
          </Row>
        );
      })}
    </Demo>
  ),
});

export const Duration = meta.story({
  render: () => (
    <Demo>
      {durations.map((duration) => {
        const token = `--md-sys-motion-duration-${duration}`;
        return (
          <Row key={token} token={token}>
            <Track duration={`var(${token})`} easing="var(--md-sys-motion-easing-standard)" />
          </Row>
        );
      })}
    </Demo>
  ),
});

export const Springs = meta.story({
  render: () => (
    <Demo>
      {(["spatial", "effects"] as const).flatMap((type) =>
        speeds.map((speed) => {
          const token = `--md-sys-motion-spring-${speed}-${type}`;
          return (
            <Row key={token} token={token}>
              <Track
                duration={`var(${token}-duration)`}
                easing={`var(${token})`}
                effects={type === "effects"}
              />
            </Row>
          );
        }),
      )}
    </Demo>
  ),
});
