import { cn } from "@/lib/utils";
import type { CSSProperties, ReactNode } from "react";

export function Eyebrow({ children, style, className }: { children: ReactNode; style?: CSSProperties; className?: string }) {
  return (
    <span className={cn("eyebrow", className)} style={style}>
      {children}
    </span>
  );
}
