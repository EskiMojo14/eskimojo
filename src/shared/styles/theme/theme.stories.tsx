import preview from "#.storybook/preview";

import "./theme.stories.css";

type Swatch = {
  /** Role used as the background. */
  bg: string;
  /** Role used for the sample text. Omitted for roles that aren't text backgrounds. */
  fg?: string;
  /** Role drawn as a border instead of a fill. */
  border?: string;
};

const groups: Array<{ title: string; swatches: Array<Swatch> }> = [
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
    title: "Extended: Green",
    swatches: [
      { bg: "green", fg: "on-green" },
      { bg: "green-container", fg: "on-green-container" },
    ],
  },
  {
    title: "Extended: Yellow",
    swatches: [
      { bg: "yellow", fg: "on-yellow" },
      { bg: "yellow-container", fg: "on-yellow-container" },
    ],
  },
  {
    title: "Extended: Teal",
    swatches: [
      { bg: "teal", fg: "on-teal" },
      { bg: "teal-container", fg: "on-teal-container" },
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
  return (
    <figure className="theme-swatch">
      <div
        className={border ? "theme-swatch__tile theme-swatch__tile--border" : "theme-swatch__tile"}
        style={{
          "--swatch-bg": token(bg),
          "--swatch-fg": fg && token(fg),
          "--swatch-border": border && token(border),
        }}
      >
        {fg && "Aa"}
      </div>
      <figcaption className="theme-swatch__caption">
        <strong className="theme-swatch__name">{border ?? bg}</strong>
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

const meta = preview.meta({
  title: "Foundations/Theme",
  parameters: {
    layout: "fullscreen",
  },
});

export const Swatches = meta.story({
  render: () => (
    <div className="theme-page">
      {groups.map(({ title, swatches }) => (
        <section key={title} className="theme-group">
          <h3 className="theme-group__title">{title}</h3>
          <div className="theme-group__swatches">
            {swatches.map((swatch) => (
              <SwatchTile key={`${swatch.bg}-${swatch.fg}-${swatch.border}`} {...swatch} />
            ))}
          </div>
        </section>
      ))}
    </div>
  ),
});
