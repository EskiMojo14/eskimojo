import preview from "#.storybook/preview";

import "./typography.stories.css";

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

const meta = preview.meta({
  title: "Foundations/Typography",
});

export const TypeScale = meta.story({
  render: () => (
    <main className="typography-page">
      {scale.flatMap(({ role, features, sizes }) =>
        sizes.map((size) => {
          const token = `--typo-${role}-${size}`;
          const featuresToken = `--typo-features-${features}`;
          return (
            <section key={token} className="typography-row">
              <code className="typography-label">
                {token}
                <br />
                {featuresToken}
              </code>
              <p
                className="typography-sample"
                style={{
                  "--sample-font": `var(${token})`,
                  "--sample-features": `var(${featuresToken})`,
                }}
              >
                The quick brown fox jumps over the lazy dog. 0123456789
              </p>
            </section>
          );
        }),
      )}
    </main>
  ),
});

export const Weights = meta.story({
  render: () => (
    <main className="typography-page">
      {weights.map((weight) => {
        const token = `--typo-weight-${weight}`;
        return (
          <section key={token} className="typography-row">
            <code className="typography-label">{token}</code>
            <p
              className="typography-sample typography-sample--weight"
              style={{ "--sample-weight": `var(${token})` }}
            >
              The quick brown fox jumps over the lazy dog.
            </p>
          </section>
        );
      })}
    </main>
  ),
});

export const FontFeatures = meta.story({
  render: () => (
    <main className="typography-page">
      {featureSamples.map(({ tag, name, sample }) => (
        <section key={tag} className="typography-row typography-row--features">
          <code className="typography-label">
            {tag}
            <br />
            {name}
          </code>
          {[
            { state: "off", settings: "normal" },
            { state: "on", settings: `"${tag}"` },
          ].map(({ state, settings }) => (
            <figure key={state} className="typography-figure">
              <figcaption className="typography-label">{state}</figcaption>
              <p className="typography-sample" style={{ "--sample-features": settings }}>
                {sample}
              </p>
            </figure>
          ))}
        </section>
      ))}
    </main>
  ),
});
