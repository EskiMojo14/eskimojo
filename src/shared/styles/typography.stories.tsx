import { useState } from "react";

import preview from "#.storybook/preview";
import { createBem } from "#/shared/lib/bem";

import "./typography.stories.css";

const typographyPageBem = createBem("typography-page");
const typographyRowBem = createBem("typography-row");
const typographyWeightDemoBem = createBem("typography-weight-demo");
const typographyLabelBem = createBem("typography-label");
const typographySampleBem = createBem("typography-sample");
const typographyFigureBem = createBem("typography-figure");

type Features = "heading" | "body" | "code";

const scale: Array<{ role: string; features: Features; sizes: Array<string> }> = [
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
  parameters: {
    layout: "fullscreen",
  },
});

function WeightTransitionDemo() {
  const [heavy, setHeavy] = useState(false);
  return (
    <main {...typographyPageBem()}>
      <section
        {...typographyRowBem({ extra: typographyWeightDemoBem().className })}
        data-heavy={heavy || undefined}
      >
        <code {...typographyLabelBem()}>--typo-weight-regular → --typo-weight-bold</code>
        <div {...typographyWeightDemoBem({ element: "content" })}>
          <button
            type="button"
            {...typographyWeightDemoBem({ element: "toggle" })}
            aria-pressed={heavy}
            onClick={() => setHeavy((current) => !current)}
          >
            {heavy ? "Make lighter" : "Make heavier"}
          </button>
          <p
            {...typographySampleBem({
              extra: typographyWeightDemoBem({ element: "sample" }).className,
            })}
          >
            The quick brown fox jumps over the lazy dog.
          </p>
        </div>
      </section>
    </main>
  );
}

export const TypeScale = meta.story({
  render: () => (
    <main {...typographyPageBem()}>
      {scale.flatMap(({ role, features, sizes }) =>
        sizes.map((size) => {
          const token = `--typo-${role}-${size}`;
          const featuresToken = `--typo-features-${features}`;
          return (
            <section key={token} {...typographyRowBem()}>
              <code {...typographyLabelBem()}>
                {token}
                <br />
                {featuresToken}
              </code>
              <p
                {...typographySampleBem()}
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
    <main {...typographyPageBem()}>
      {weights.map((weight) => {
        const token = `--typo-weight-${weight}`;
        return (
          <section key={token} {...typographyRowBem()}>
            <code {...typographyLabelBem()}>{token}</code>
            <p
              {...typographySampleBem({ modifiers: { weight: true } })}
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

export const WeightTransition = meta.story({
  render: () => <WeightTransitionDemo />,
});

export const FontFeatures = meta.story({
  render: () => (
    <main {...typographyPageBem()}>
      {featureSamples.map(({ tag, name, sample }) => (
        <section key={tag} {...typographyRowBem({ modifiers: { features: true } })}>
          <code {...typographyLabelBem()}>
            {tag}
            <br />
            {name}
          </code>
          {[
            { state: "off", settings: "normal" },
            { state: "on", settings: `"${tag}"` },
          ].map(({ state, settings }) => (
            <figure key={state} {...typographyFigureBem()}>
              <figcaption {...typographyLabelBem()}>{state}</figcaption>
              <p {...typographySampleBem()} style={{ "--sample-features": settings }}>
                {sample}
              </p>
            </figure>
          ))}
        </section>
      ))}
    </main>
  ),
});
