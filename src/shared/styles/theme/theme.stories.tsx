import BEMHelper from "react-bem-helper";

import preview from "#.storybook/preview";
import { darkSyntaxOptions, lightSyntaxOptions, syntaxLabels } from "#/shared/constants/prefs";

import "./theme.stories.css";

const themePageBem = BEMHelper("theme-page");
const themeGroupBem = BEMHelper("theme-group");
const themeSchemeBem = BEMHelper("theme-scheme");
const themeRoleBem = BEMHelper("theme-role");

const token = (role: string) => `var(--md-sys-color-${role})`;

type ColorRole = {
  role: string;
  foreground: string;
  label: string;
};

const labelForRole = (role: string) =>
  role
    .split("-")
    .map((word) => word.slice(0, 1).toUpperCase() + word.slice(1))
    .join(" ");

const colorRole = (role: string, foreground = "on-surface", label = labelForRole(role)) => ({
  role,
  foreground,
  label,
});

const accentSwatches = (accent: string) => [
  colorRole(accent, `on-${accent}`),
  colorRole(`on-${accent}`, accent),
  colorRole(`${accent}-container`, `on-${accent}-container`),
  colorRole(`on-${accent}-container`, `${accent}-container`),
];

const accentGroups = ["primary", "secondary", "tertiary"].map((accent) => ({
  accent,
  swatches: accentSwatches(accent),
}));

const errorGroup = { accent: "error", swatches: accentSwatches("error") };

const surfaceTones = [colorRole("surface-dim"), colorRole("surface"), colorRole("surface-bright")];

const surfaceContainers = [
  colorRole("surface-container-lowest", "on-surface", "Surf. Container Lowest"),
  colorRole("surface-container-low", "on-surface", "Surf. Container Low"),
  colorRole("surface-container", "on-surface", "Surf. Container"),
  colorRole("surface-container-high", "on-surface", "Surf. Container High"),
  colorRole("surface-container-highest", "on-surface", "Surf. Container Highest"),
];

const surfaceRoles = [
  colorRole("on-surface", "surface"),
  colorRole("on-surface-variant", "surface", "On Surface Var."),
  colorRole("outline"),
  colorRole("outline-variant"),
];

const inverseRoles = [
  colorRole("inverse-surface", "inverse-on-surface"),
  colorRole("inverse-on-surface", "inverse-surface"),
  colorRole("inverse-primary", "inverse-surface"),
];

const overlays = [colorRole("scrim", "white"), colorRole("shadow", "white")];

const additionalGroups: Array<{ id: string; roles: Array<ColorRole> }> = [
  {
    id: "background",
    roles: [colorRole("background", "on-background"), colorRole("on-background", "background")],
  },
  {
    id: "surface-variant",
    roles: [
      colorRole("surface-variant", "on-surface-variant"),
      colorRole("on-surface-variant", "surface-variant"),
    ],
  },
  { id: "surface-tint", roles: [colorRole("surface-tint")] },
  {
    id: "primary-fixed",
    roles: [
      colorRole("primary-fixed", "on-primary-fixed"),
      colorRole("on-primary-fixed", "primary-fixed"),
    ],
  },
  {
    id: "primary-fixed-dim",
    roles: [
      colorRole("primary-fixed-dim", "on-primary-fixed-variant"),
      colorRole("on-primary-fixed-variant", "primary-fixed-dim"),
    ],
  },
  {
    id: "secondary-fixed",
    roles: [
      colorRole("secondary-fixed", "on-secondary-fixed"),
      colorRole("on-secondary-fixed", "secondary-fixed"),
    ],
  },
  {
    id: "secondary-fixed-dim",
    roles: [
      colorRole("secondary-fixed-dim", "on-secondary-fixed-variant"),
      colorRole("on-secondary-fixed-variant", "secondary-fixed-dim"),
    ],
  },
  {
    id: "tertiary-fixed",
    roles: [
      colorRole("tertiary-fixed", "on-tertiary-fixed"),
      colorRole("on-tertiary-fixed", "tertiary-fixed"),
    ],
  },
  {
    id: "tertiary-fixed-dim",
    roles: [
      colorRole("tertiary-fixed-dim", "on-tertiary-fixed-variant"),
      colorRole("on-tertiary-fixed-variant", "tertiary-fixed-dim"),
    ],
  },
];

function ColorSwatch({ role, foreground, label }: ColorRole) {
  return (
    <div
      {...themeRoleBem()}
      data-color-role={role}
      style={{
        "--swatch-bg": token(role),
        "--swatch-fg": token(foreground),
      }}
    >
      {label}
    </div>
  );
}

function AccentGroup({ accent, swatches }: { accent: string; swatches: Array<ColorRole> }) {
  return (
    <section
      {...themeGroupBem({ modifiers: { accent: true, [accent]: true } })}
      data-accent={accent}
      aria-label={labelForRole(accent)}
    >
      {swatches.map((swatch) => (
        <ColorSwatch key={swatch.role} {...swatch} />
      ))}
    </section>
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
    <div {...themePageBem({ modifiers: { swatches: true } })}>
      <main {...themeSchemeBem()}>
        <div {...themeSchemeBem({ element: "grid" })}>
          <div {...themeSchemeBem({ element: "accents" })}>
            {accentGroups.map(({ accent, swatches }) => (
              <AccentGroup key={accent} accent={accent} swatches={swatches} />
            ))}
          </div>
          <AccentGroup {...errorGroup} />
          <section {...themeGroupBem({ modifiers: { surface: true } })} aria-label="Surface">
            <div {...themeGroupBem({ element: "surface-tones" })}>
              {surfaceTones.map((swatch) => (
                <ColorSwatch key={swatch.role} {...swatch} />
              ))}
            </div>
            <div {...themeGroupBem({ element: "surface-containers" })}>
              {surfaceContainers.map((swatch) => (
                <ColorSwatch key={swatch.role} {...swatch} />
              ))}
            </div>
            <div {...themeGroupBem({ element: "surface-roles" })}>
              {surfaceRoles.map((swatch) => (
                <ColorSwatch key={swatch.role} {...swatch} />
              ))}
            </div>
          </section>
          <section {...themeGroupBem({ modifiers: { inverse: true } })} aria-label="Inverse">
            {inverseRoles.map((swatch) => (
              <ColorSwatch key={swatch.role} {...swatch} />
            ))}
            <div {...themeGroupBem({ element: "overlays" })}>
              {overlays.map((swatch) => (
                <ColorSwatch key={swatch.role} {...swatch} />
              ))}
            </div>
          </section>
        </div>
        <section {...themeGroupBem({ modifiers: { additional: true } })}>
          <h2 {...themeGroupBem({ element: "title" })}>Additional roles</h2>
          <div {...themeGroupBem({ element: "additional-swatches" })}>
            {additionalGroups.map(({ id, roles }) => (
              <div
                key={id}
                {...themeGroupBem({ element: "additional-pair" })}
                data-single={roles.length === 1 ? "true" : undefined}
              >
                {roles.map((swatch) => (
                  <ColorSwatch key={swatch.role} {...swatch} />
                ))}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  ),
});

const syntaxGroups = [
  { title: "Light", palettes: lightSyntaxOptions.options },
  { title: "Dark", palettes: darkSyntaxOptions.options },
];

const syntaxSwatchGroups = [
  {
    title: "Roles",
    roles: ["background", "selection", "comment", "current-line", "foreground"],
  },
  {
    title: "Colors",
    roles: ["pink", "green", "cyan", "yellow", "orange", "purple", "red"],
  },
];

const fixedSyntaxColors = [
  "fixed-pink",
  "fixed-green",
  "fixed-cyan",
  "fixed-yellow",
  "fixed-orange",
  "fixed-purple",
  "fixed-red",
];

function SyntaxSwatchGroup({ roles }: { roles: Array<string> }) {
  return (
    <div {...themeGroupBem({ element: "syntax-swatches" })}>
      {roles.map((role) => (
        <div
          key={role}
          {...themeRoleBem({ modifiers: { syntax: true } })}
          style={{ "--swatch-bg": `var(--${role})` }}
        >
          <span {...themeRoleBem({ element: "syntax-label" })}>{role}</span>
        </div>
      ))}
    </div>
  );
}

export const SyntaxSwatches = meta.story({
  render: () => (
    <div {...themePageBem()}>
      <SyntaxSwatchGroup roles={fixedSyntaxColors} />
      {syntaxGroups.map(({ title, palettes }) => (
        <section key={title} {...themeGroupBem()}>
          <h2 {...themeGroupBem({ element: "title" })}>{title} syntax themes</h2>
          {palettes.map((palette) => (
            <section key={palette} {...themeGroupBem()} data-syntax-swatch={palette}>
              <h3 {...themeGroupBem({ element: "title" })}>{syntaxLabels[palette].label}</h3>
              {syntaxSwatchGroups.map(({ title: groupTitle, roles }) => (
                <SyntaxSwatchGroup key={groupTitle} roles={roles} />
              ))}
            </section>
          ))}
        </section>
      ))}
    </div>
  ),
});
