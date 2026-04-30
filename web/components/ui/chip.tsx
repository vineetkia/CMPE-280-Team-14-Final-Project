import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

type ChipKind = "default" | "accent" | "positive" | "negative" | "warning" | "ink";

export function Chip({
  children,
  kind = "default",
  className,
  style,
}: {
  children: ReactNode;
  kind?: ChipKind;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={cn("chip", kind !== "default" && `chip-${kind}`, className)} style={style}>
      {children}
    </span>
  );
}
