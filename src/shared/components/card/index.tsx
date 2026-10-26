import type { ComponentPropsWithRef } from "react";
import BEMHelper from "react-bem-helper";

const cardBem = BEMHelper("card");

export type CardVariant = "elevated" | "filled" | "outlined";

export interface CardProps extends ComponentPropsWithRef<"div"> {
  variant?: CardVariant;
}

export function Card({ variant = "filled", className, ...props }: CardProps) {
  return <div {...props} {...cardBem({ modifier: variant, extra: className })} />;
}
