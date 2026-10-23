import "react";

// Lets style={{ "--name": value }} pass values to CSS custom properties.
declare module "react" {
  interface CSSProperties {
    [property: `--${string}`]: string | number | undefined;
  }
}
