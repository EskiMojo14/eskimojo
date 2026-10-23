import preview from "#.storybook/preview";

import "./state.stories.css";

const states = ["hover", "focus", "pressed", "dragged"] as const;

const meta = preview.meta({
  title: "Foundations/State",
});

export const StateLayers = meta.story({
  render: () => (
    <main className="state-page">
      <h1>State layers</h1>
      <p>Each sample overlays a state colour without fading its text or base surface.</p>
      {(["neutral", "selected"] as const).map((surface) => (
        <section className="state-section" key={surface}>
          <h2>{surface === "neutral" ? "Neutral surface" : "Selected surface"}</h2>
          <div className="state-samples">
            {states.map((state) => (
              <figure className="state-sample" key={state}>
                <div
                  className={`state-sample__surface state-sample__surface--${surface}`}
                  style={{
                    "--state-sample-opacity": `var(--md-sys-state-${state}-state-layer-opacity)`,
                  }}
                >
                  {state}
                </div>
                <figcaption>
                  <code>{`--md-sys-state-${state}-state-layer-opacity`}</code>
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      ))}
    </main>
  ),
});
