type Swatch = {
  /** Role used as the background. */
  bg: string;
  /** Role used for the sample text. Omitted for roles that aren't text backgrounds. */
  fg?: string;
  /** Role drawn as a border instead of a fill. */
  border?: string;
};

const groups: { title: string; swatches: Swatch[] }[] = [
  {
    title: "Primary",
    swatches: [
      { bg: "primary", fg: "on-primary" },
      { bg: "primary-container", fg: "on-primary-container" },
    ],
  },
  {
    title: "Secondary",
    swatches: [
      { bg: "secondary", fg: "on-secondary" },
      { bg: "secondary-container", fg: "on-secondary-container" },
    ],
  },
  {
    title: "Tertiary",
    swatches: [
      { bg: "tertiary", fg: "on-tertiary" },
      { bg: "tertiary-container", fg: "on-tertiary-container" },
    ],
  },
  {
    title: "Error",
    swatches: [
      { bg: "error", fg: "on-error" },
      { bg: "error-container", fg: "on-error-container" },
    ],
  },
  {
    title: "Surface",
    swatches: [
      { bg: "surface", fg: "on-surface" },
      { bg: "surface", fg: "on-surface-variant" },
      { bg: "surface-variant", fg: "on-surface-variant" },
      { bg: "surface-dim", fg: "on-surface" },
      { bg: "surface-bright", fg: "on-surface" },
      { bg: "background", fg: "on-background" },
    ],
  },
  {
    title: "Surface containers",
    swatches: [
      { bg: "surface-container-lowest", fg: "on-surface" },
      { bg: "surface-container-low", fg: "on-surface" },
      { bg: "surface-container", fg: "on-surface" },
      { bg: "surface-container-high", fg: "on-surface" },
      { bg: "surface-container-highest", fg: "on-surface" },
    ],
  },
  {
    title: "Inverse",
    swatches: [
      { bg: "inverse-surface", fg: "inverse-on-surface" },
      { bg: "inverse-surface", fg: "inverse-primary" },
    ],
  },
  {
    title: "Primary fixed",
    swatches: [
      { bg: "primary-fixed", fg: "on-primary-fixed" },
      { bg: "primary-fixed-dim", fg: "on-primary-fixed-variant" },
    ],
  },
  {
    title: "Secondary fixed",
    swatches: [
      { bg: "secondary-fixed", fg: "on-secondary-fixed" },
      { bg: "secondary-fixed-dim", fg: "on-secondary-fixed-variant" },
    ],
  },
  {
    title: "Tertiary fixed",
    swatches: [
      { bg: "tertiary-fixed", fg: "on-tertiary-fixed" },
      { bg: "tertiary-fixed-dim", fg: "on-tertiary-fixed-variant" },
    ],
  },
  {
    title: "Lines and overlays",
    swatches: [
      { bg: "surface", fg: "on-surface", border: "outline" },
      { bg: "surface", fg: "on-surface", border: "outline-variant" },
      { bg: "surface-tint" },
      { bg: "shadow" },
      { bg: "scrim" },
    ],
  },
];

const token = (role: string) => `var(--md-sys-color-${role})`;

function SwatchTile({ bg, fg, border }: Swatch) {
  const label = border ?? bg;
  return (
    <figure style={{ margin: 0, display: "grid", gap: "0.5rem" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: "4.5rem",
          padding: "0 1rem",
          borderRadius: "var(--md-sys-shape-corner-medium)",
          background: token(bg),
          color: fg && token(fg),
          border: `${border ? "3px" : "1px"} solid ${token(border ?? "outline-variant")}`,
          font: "var(--typo-title-medium)",
        }}
      >
        {fg && "Aa"}
      </div>
      <figcaption style={{ font: "var(--typo-label-medium)", color: token("on-surface-variant") }}>
        <strong style={{ color: token("on-surface") }}>{label}</strong>
        {fg && !border && (
          <>
            <br />
            text: {fg}
          </>
        )}
        {border && (
          <>
            <br />
            border
          </>
        )}
      </figcaption>
    </figure>
  );
}

export default {
  title: "Foundations/Theme",
};

export const Swatches = {
  render: () => (
    <div
      style={{
        display: "grid",
        gap: "2rem",
        padding: "1.5rem",
        background: token("surface"),
        color: token("on-surface"),
      }}
    >
      {groups.map(({ title, swatches }) => (
        <section key={title} style={{ display: "grid", gap: "0.75rem" }}>
          <h3 style={{ font: "var(--typo-title-small)", margin: 0 }}>{title}</h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(11rem, 1fr))",
              gap: "1rem",
            }}
          >
            {swatches.map((swatch) => (
              <SwatchTile key={`${swatch.bg}-${swatch.fg}-${swatch.border}`} {...swatch} />
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
};
