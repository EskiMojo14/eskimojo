import type { CSSProperties } from "react";

type Features = "heading" | "body" | "code";

const scale: { role: string; features: Features; sizes: string[] }[] = [
  { role: "display", features: "heading", sizes: ["large", "medium", "small"] },
  { role: "headline", features: "heading", sizes: ["large", "medium", "small"] },
  { role: "title", features: "heading", sizes: ["large", "medium", "small"] },
  { role: "body", features: "body", sizes: ["large", "medium", "small"] },
  { role: "label", features: "body", sizes: ["large", "medium", "small"] },
];

const weights = [
  "thin",
  "extra-light",
  "light",
  "regular",
  "medium",
  "semibold",
  "bold",
  "extra-bold",
] as const;

const featureSamples = [
  { tag: "ss01", name: "Coding ligatures", sample: "=> -> != === <= >= ::" },
  { tag: "ss02", name: "Duospace glyphs", sample: "mmm www iii lll" },
  { tag: "ss03", name: "Narrow space", sample: "a b c d e f" },
  { tag: "ss04", name: "Small arrows", sample: "← → ↑ ↓" },
  { tag: "cv01", name: "Single-storey a", sample: "banana" },
  { tag: "zero", name: "Slashed zero", sample: "0O 1000" },
] as const;

const text = (font: string, featureSettings: string): CSSProperties => ({
  font: `var(${font})`,
  // Must come after font: the shorthand resets font-feature-settings.
  fontFeatureSettings: featureSettings,
  margin: 0,
});

const label = text("--typo-label-medium", "var(--typo-features-code)");

const page: CSSProperties = {
  display: "grid",
  gap: "1.5rem",
  padding: "1.5rem",
  color: "var(--md-sys-color-on-surface)",
  background: "var(--md-sys-color-surface)",
};

const row: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "14rem minmax(0, 1fr)",
  alignItems: "baseline",
  gap: "1rem",
  borderBottom: "1px solid var(--md-sys-color-outline-variant)",
  paddingBottom: "1rem",
};

export default {
  title: "Foundations/Typography",
};

export const TypeScale = {
  render: () => (
    <main style={page}>
      {scale.flatMap(({ role, features, sizes }) =>
        sizes.map((size) => {
          const token = `--typo-${role}-${size}`;
          const featuresToken = `--typo-features-${features}`;
          return (
            <section key={token} style={row}>
              <code style={{ ...label, color: "var(--md-sys-color-on-surface-variant)" }}>
                {token}
                <br />
                {featuresToken}
              </code>
              <p style={text(token, `var(${featuresToken})`)}>
                The quick brown fox jumps over the lazy dog. 0123456789
              </p>
            </section>
          );
        }),
      )}
    </main>
  ),
};

export const Weights = {
  render: () => (
    <main style={page}>
      {weights.map((weight) => {
        const token = `--typo-weight-${weight}`;
        return (
          <section key={token} style={row}>
            <code style={{ ...label, color: "var(--md-sys-color-on-surface-variant)" }}>
              {token}
            </code>
            <p
              style={{
                ...text("--typo-headline-small", "var(--typo-features-heading)"),
                fontWeight: `var(${token})`,
              }}
            >
              The quick brown fox jumps over the lazy dog.
            </p>
          </section>
        );
      })}
    </main>
  ),
};

export const FontFeatures = {
  render: () => (
    <main style={page}>
      {featureSamples.map(({ tag, name, sample }) => (
        <section
          key={tag}
          style={{ ...row, gridTemplateColumns: "14rem repeat(2, minmax(0, 1fr))" }}
        >
          <code style={{ ...label, color: "var(--md-sys-color-on-surface-variant)" }}>
            {tag}
            <br />
            {name}
          </code>
          {[
            { state: "off", settings: "normal" },
            { state: "on", settings: `"${tag}"` },
          ].map(({ state, settings }) => (
            <figure key={state} style={{ margin: 0, display: "grid", gap: "0.25rem" }}>
              <figcaption style={{ ...label, color: "var(--md-sys-color-on-surface-variant)" }}>
                {state}
              </figcaption>
              <p style={text("--typo-headline-small", settings)}>{sample}</p>
            </figure>
          ))}
        </section>
      ))}
    </main>
  ),
};
