import type { ComponentPropsWithRef } from "react";

import { createBem } from "#/shared/lib/bem";

const symbolBem = createBem("md-symbol");

export interface MdSymbolProps extends ComponentPropsWithRef<"span"> {
  children: string;
  flipRtl?: boolean;
  fill?: boolean;
  weight?: number;
  grade?: number;
  opticalSize?: number;
  size?: number;
}

/**
 * Literal children are extracted at build time. Register interpolated icon names
 * in materialSymbols({ knownSymbols }) in vite.config.ts.
 */
export function MdSymbol({
  children,
  fill,
  weight,
  grade,
  opticalSize,
  size,
  flipRtl,
  className,
  style,
  "aria-label": ariaLabel,
  "aria-labelledby": ariaLabelledBy,
  role,
  ...props
}: MdSymbolProps) {
  const labelled = Boolean(ariaLabel || ariaLabelledBy);
  return (
    <span
      {...props}
      {...symbolBem({ extra: ["material-symbols-sharp", className ?? ""] })}
      aria-hidden={!labelled}
      aria-label={ariaLabel}
      aria-labelledby={ariaLabelledBy}
      role={role ?? (labelled ? "img" : undefined)}
      data-flip-rtl={flipRtl || undefined}
      style={{
        "--icon-fill": typeof fill === "boolean" ? Number(fill) : undefined,
        "--icon-weight": weight,
        "--icon-grade": grade,
        "--icon-optical-size": opticalSize,
        "--icon-size": size,
        ...style,
      }}
    >
      {children}
    </span>
  );
}
