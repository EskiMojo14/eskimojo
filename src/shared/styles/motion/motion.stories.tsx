import { useState, type CSSProperties, type ReactNode } from "react";
import preview from "#.storybook/preview";

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

const page: CSSProperties = {
  display: "grid",
  gap: "1rem",
  padding: "1.5rem",
  color: "var(--md-sys-color-on-surface)",
  background: "var(--md-sys-color-surface)",
};

const label: CSSProperties = {
  font: "var(--typo-label-medium)",
  fontFeatureSettings: "var(--typo-features-code)",
  color: "var(--md-sys-color-on-surface-variant)",
};

const row: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "22rem minmax(0, 1fr)",
  alignItems: "center",
  gap: "1rem",
};

const dotSize = "1.5rem";

function Track({
  played,
  transition,
  style,
}: {
  played: boolean;
  transition: string;
  style?: CSSProperties;
}) {
  return (
    <div
      style={{
        containerType: "inline-size",
        background: "var(--md-sys-color-surface-container)",
        borderRadius: "var(--md-sys-shape-corner-full)",
      }}
    >
      <div
        style={{
          width: dotSize,
          height: dotSize,
          borderRadius: "var(--md-sys-shape-corner-full)",
          background: "var(--md-sys-color-primary)",
          translate: played ? `calc(100cqi - ${dotSize})` : "0",
          transition,
          ...style,
        }}
      />
    </div>
  );
}

function Demo({ children }: { children: (played: boolean) => ReactNode }) {
  const [played, setPlayed] = useState(false);
  return (
    <main style={page}>
      <button
        type="button"
        onClick={() => setPlayed((p) => !p)}
        style={{
          justifySelf: "start",
          padding: "0.625rem 1.5rem",
          border: "none",
          borderRadius: "var(--md-sys-shape-corner-full)",
          background: "var(--md-sys-color-primary)",
          color: "var(--md-sys-color-on-primary)",
          font: "var(--typo-label-large)",
          fontFeatureSettings: "var(--typo-features-body)",
          cursor: "pointer",
        }}
      >
        {played ? "Play back" : "Play"}
      </button>
      {children(played)}
    </main>
  );
}

const meta = preview.meta({
  title: "Foundations/Motion",
});

export const Easing = meta.story({
  render: () => (
    <Demo>
      {(played) =>
        easings.map((easing) => {
          const token = `--md-sys-motion-easing-${easing}`;
          return (
            <section key={easing} style={row}>
              <code style={label}>{token}</code>
              <Track
                played={played}
                transition={`translate var(--md-sys-motion-duration-long2) var(${token})`}
              />
            </section>
          );
        })
      }
    </Demo>
  ),
});

export const Duration = meta.story({
  render: () => (
    <Demo>
      {(played) =>
        durations.map((duration) => {
          const token = `--md-sys-motion-duration-${duration}`;
          return (
            <section key={duration} style={row}>
              <code style={label}>{token}</code>
              <Track
                played={played}
                transition={`translate var(${token}) var(--md-sys-motion-easing-standard)`}
              />
            </section>
          );
        })
      }
    </Demo>
  ),
});

export const Springs = meta.story({
  render: () => (
    <Demo>
      {(played) => [
        ...speeds.map((speed) => {
          const token = `--md-sys-motion-spring-${speed}-spatial`;
          return (
            <section key={token} style={row}>
              <code style={label}>{token}</code>
              <Track
                played={played}
                transition={`translate var(${token}-duration) var(${token})`}
              />
            </section>
          );
        }),
        ...speeds.map((speed) => {
          const token = `--md-sys-motion-spring-${speed}-effects`;
          return (
            <section key={token} style={row}>
              <code style={label}>{token}</code>
              <Track
                played={played}
                transition={`opacity var(${token}-duration) var(${token}), background-color var(${token}-duration) var(${token})`}
                style={{
                  translate: "0",
                  width: "100%",
                  opacity: played ? 1 : 0.2,
                  background: played
                    ? "var(--md-sys-color-tertiary)"
                    : "var(--md-sys-color-primary)",
                }}
              />
            </section>
          );
        }),
      ]}
    </Demo>
  ),
});
