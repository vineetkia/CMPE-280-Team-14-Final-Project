"use client";

/**
 * <MotionButton> — drop-in replacement for high-intent CTAs (sign in, optimize,
 * begin interview, add job). Adds a subtle press scale + shadow shift on top of
 * the existing CSS button styles. Use the regular <button class="btn btn-...">
 * for low-intent buttons; the design system already handles those via :active.
 */
import { motion, type HTMLMotionProps } from "framer-motion";
import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { tween, DUR, EASE } from "@/components/motion";

type Variant = "primary" | "accent" | "secondary" | "destructive";
type Size = "sm" | "default" | "lg";

interface MotionButtonProps extends Omit<HTMLMotionProps<"button">, "ref"> {
  variant?: Variant;
  size?: Size;
}

const VARIANT_CLASS: Record<Variant, string> = {
  primary: "btn-primary",
  accent: "btn-accent",
  secondary: "btn-secondary",
  destructive: "btn-destructive",
};

const SIZE_CLASS: Record<Size, string> = {
  sm: "btn-sm",
  default: "",
  lg: "btn-lg",
};

export const MotionButton = forwardRef<HTMLButtonElement, MotionButtonProps>(function MotionButton(
  { className, variant = "accent", size = "default", children, ...props },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      className={cn("btn", VARIANT_CLASS[variant], SIZE_CLASS[size], className)}
      whileTap={{ scale: 0.985, y: 0 }}
      whileHover={{ y: -0.5 }}
      transition={tween(DUR.fast, EASE)}
      {...props}
    >
      {children}
    </motion.button>
  );
});
