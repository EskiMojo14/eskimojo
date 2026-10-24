import BEMHelper from "react-bem-helper";

import preview from "#.storybook/preview";

import "./shape.stories.css";

const shapeTileBem = BEMHelper("shape-tile");
const shapePageBem = BEMHelper("shape-page");
const shapeFigureBem = BEMHelper("shape-figure");
const shapeCaptionBem = BEMHelper("shape-caption");

const corners = [
  { name: "none", dp: "0" },
  { name: "extra-small", dp: "4" },
  { name: "small", dp: "8" },
  { name: "medium", dp: "12" },
  { name: "large", dp: "16" },
  { name: "large-increased", dp: "20" },
  { name: "extra-large", dp: "28" },
  { name: "extra-large-increased", dp: "32" },
  { name: "extra-extra-large", dp: "48" },
  { name: "full", dp: "full" },
] as const;

const meta = preview.meta({
  title: "Foundations/Shape",
  parameters: {
    layout: "fullscreen",
  },
});

export const CornerScale = meta.story({
  render: () => (
    <main {...shapePageBem()}>
      {corners.map(({ name, dp }) => {
        const token = `--md-sys-shape-corner-${name}`;
        return (
          <figure key={name} {...shapeFigureBem()}>
            <div {...shapeTileBem()} style={{ "--tile-radius": `var(${token})` }} />
            <figcaption {...shapeCaptionBem()}>
              {token}
              <br />
              {dp === "full" ? "full" : `${dp}dp`}
            </figcaption>
          </figure>
        );
      })}
    </main>
  ),
});

export const CornerShape = meta.story({
  render: () => (
    <main {...shapePageBem()}>
      {(["bevel", "round"] as const).map((shape) => {
        return (
          <figure key={shape} {...shapeFigureBem()}>
            <div {...shapeTileBem({ modifiers: { round: shape === "round" } })} />
            <div {...shapeTileBem({ modifiers: { pill: true, round: shape === "round" } })} />
            <figcaption {...shapeCaptionBem()}>corner-shape: {shape}</figcaption>
          </figure>
        );
      })}
    </main>
  ),
});
