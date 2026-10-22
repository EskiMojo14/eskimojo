import "react";

// csstype doesn't include corner-shape yet.
declare module "react" {
  interface CSSProperties {
    /** https://developer.mozilla.org/docs/Web/CSS/corner-shape */
    cornerShape?: "round" | "scoop" | "bevel" | "notch" | "square" | "squircle" | (string & {});
  }
}
