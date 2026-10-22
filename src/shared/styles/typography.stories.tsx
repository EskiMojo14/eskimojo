import "./typography.css";

const typographyTokens = [
  { name: "Display / Large", token: "--typo-display-large" },
  { name: "Display / Medium", token: "--typo-display-medium" },
  { name: "Display / Small", token: "--typo-display-small" },
  { name: "Headline / Large", token: "--typo-headline-large" },
  { name: "Headline / Medium", token: "--typo-headline-medium" },
  { name: "Headline / Small", token: "--typo-headline-small" },
  { name: "Title / Large", token: "--typo-title-large" },
  { name: "Title / Medium", token: "--typo-title-medium" },
  { name: "Title / Small", token: "--typo-title-small" },
  { name: "Body / Large", token: "--typo-body-large" },
  { name: "Body / Medium", token: "--typo-body-medium" },
  { name: "Body / Small", token: "--typo-body-small" },
  { name: "Label / Large", token: "--typo-label-large" },
  { name: "Label / Medium", token: "--typo-label-medium" },
  { name: "Label / Small", token: "--typo-label-small" },
] as const;

export default {
  title: "Typography/Type Scale",
};

export const AllTokens = {
  render: () => (
    <main
      style={{
        display: "grid",
        gap: "1.5rem",
        padding: "1.5rem",
        color: "var(--md-sys-color-on-surface)",
        background: "var(--md-sys-color-surface)",
      }}
    >
      {typographyTokens.map(({ name, token }) => (
        <section
          key={token}
          style={{
            display: "grid",
            gridTemplateColumns: "12rem minmax(0, 1fr)",
            alignItems: "baseline",
            gap: "1rem",
            borderBottom: "1px solid var(--md-sys-color-outline-variant)",
            paddingBottom: "1rem",
          }}
        >
          <code style={{ font: "var(--typo-label-medium)" }}>
            {name}
            <br />
            {token}
          </code>
          <p style={{ font: `var(${token})`, margin: 0 }}>
            The quick brown fox jumps over the lazy dog. 0123456789
          </p>
        </section>
      ))}
    </main>
  ),
};
