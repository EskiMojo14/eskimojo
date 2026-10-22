import type { CSSProperties } from "react";

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

const page: CSSProperties = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fill, minmax(17rem, 1fr))",
  gap: "1.5rem",
  padding: "1.5rem",
  color: "var(--md-sys-color-on-surface)",
  background: "var(--md-sys-color-surface)",
};

const caption: CSSProperties = {
  font: "var(--typo-label-medium)",
  fontFeatureSettings: "var(--typo-features-code)",
  color: "var(--md-sys-color-on-surface-variant)",
};

const tile = (radius: string, extra?: CSSProperties): CSSProperties => ({
  height: "6rem",
  borderRadius: radius,
  background: "var(--md-sys-color-primary-container)",
  border: "1px solid var(--md-sys-color-outline-variant)",
  ...extra,
});

export default {
  title: "Foundations/Shape",
};

export const CornerScale = {
  render: () => (
    <main style={page}>
      {corners.map(({ name, dp }) => {
        const token = `--md-sys-shape-corner-${name}`;
        return (
          <figure key={name} style={{ margin: 0, display: "grid", gap: "0.5rem" }}>
            <div style={tile(`var(${token})`)} />
            <figcaption style={caption}>
              {token}
              <br />
              {dp === "full" ? "full" : `${dp}dp`}
            </figcaption>
          </figure>
        );
      })}
    </main>
  ),
};

export const CornerShape = {
  render: () => (
    <main style={page}>
      {(["bevel", "round"] as const).map((shape) => (
        <figure key={shape} style={{ margin: 0, display: "grid", gap: "0.5rem" }}>
          <div
            style={tile("var(--md-sys-shape-corner-extra-large)", {
              cornerShape: shape,
            })}
          />
          <div
            style={tile("var(--md-sys-shape-corner-full)", {
              height: "3rem",
              cornerShape: shape,
            })}
          />
          <figcaption style={caption}>corner-shape: {shape}</figcaption>
        </figure>
      ))}
    </main>
  ),
};
