import preview from "#.storybook/preview";
import { createBem } from "#/shared/lib/bem";

import "./state.stories.css";

const stateSampleBem = createBem("state-sample");
const statePageBem = createBem("state-page");
const stateSectionBem = createBem("state-section");
const stateSamplesBem = createBem("state-samples");
const states = ["hover", "focus", "pressed", "dragged"] as const;

const meta = preview.meta({
  title: "Foundations/State",
});

export const StateLayers = meta.story({
  render: () => (
    <main {...statePageBem()}>
      <h1>State layers</h1>
      <p>Each sample overlays a state colour without fading its text or base surface.</p>
      {(["neutral", "selected"] as const).map((surface) => (
        <section {...stateSectionBem()} key={surface}>
          <h2>{surface === "neutral" ? "Neutral surface" : "Selected surface"}</h2>
          <div {...stateSamplesBem()}>
            {states.map((state) => (
              <figure {...stateSampleBem()} key={state}>
                <div
                  {...stateSampleBem({ element: "surface", modifier: surface })}
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
