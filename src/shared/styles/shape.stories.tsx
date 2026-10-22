import preview from "#.storybook/preview";

import "./shape.stories.css";

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
});

export const CornerScale = meta.story({
  render: () => (
    <main className="shape-page">
      {corners.map(({ name, dp }) => {
        const token = `--md-sys-shape-corner-${name}`;
        return (
          <figure key={name} className="shape-figure">
            <div className="shape-tile" style={{ "--tile-radius": `var(${token})` }} />
            <figcaption className="shape-caption">
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
    <main className="shape-page">
      {(["bevel", "round"] as const).map((shape) => {
        const shapeClass = shape === "round" ? " shape-tile--round" : "";
        return (
          <figure key={shape} className="shape-figure">
            <div className={`shape-tile${shapeClass}`} />
            <div className={`shape-tile shape-tile--pill${shapeClass}`} />
            <figcaption className="shape-caption">corner-shape: {shape}</figcaption>
          </figure>
        );
      })}
    </main>
  ),
});
