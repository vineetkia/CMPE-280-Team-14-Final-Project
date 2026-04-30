"use client";

/**
 * Editorial motion primitives for Hyrd.
 *
 * The design system specifies two easing curves and four durations:
 *   --ease     : cubic-bezier(0.32, 0.72, 0, 1)    (Linear's curve)
 *   --ease-out : cubic-bezier(0.16, 1, 0.3, 1)     (Apple's curve)
 *   durations  : 120 / 200 / 360 / 600 ms
 *
 * Anti-patterns we are NOT supporting (from the handoff):
 *   - bouncy springs
 *   - scale-pop / scale-bounce
 *   - slide-and-bounce page transitions
 *
 * Defaults below pick a quiet tween (not a spring), staggers stay under 80ms,
 * and the longest enter is 360ms unless the surface is large (drawer / page).
 */
import { motion, type Variants, type Transition, type HTMLMotionProps } from "framer-motion";
import { forwardRef, type ReactNode } from "react";

// ─── Curves and durations ───────────────────────────────────
export const EASE = [0.32, 0.72, 0, 1] as const; // primary
export const EASE_OUT = [0.16, 1, 0.3, 1] as const; // apple

export const DUR = {
  fast: 0.12,
  base: 0.2,
  slow: 0.36,
  slower: 0.6,
} as const;

// ─── Tweens ─────────────────────────────────────────────────
export const tween = (
  duration: number = DUR.slow,
  easing: readonly [number, number, number, number] = EASE_OUT,
): Transition => ({
  type: "tween",
  duration,
  ease: easing as unknown as number[],
});

// ─── Variants ───────────────────────────────────────────────
export const fadeUp: Variants = {
  hidden: { opacity: 0, y: 4 },
  visible: { opacity: 1, y: 0, transition: tween(DUR.slow, EASE_OUT) },
  exit: { opacity: 0, y: -2, transition: tween(DUR.base, EASE) },
};

export const fade: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: tween(DUR.slow, EASE_OUT) },
  exit: { opacity: 0, transition: tween(DUR.base, EASE) },
};

export const cardEnter: Variants = {
  hidden: { opacity: 0, y: 6 },
  visible: { opacity: 1, y: 0, transition: tween(DUR.slow, EASE_OUT) },
};

export const drawerEnter: Variants = {
  hidden: { opacity: 0, x: 24 },
  visible: { opacity: 1, x: 0, transition: tween(DUR.slow, EASE_OUT) },
  exit: { opacity: 0, x: 12, transition: tween(DUR.base, EASE) },
};

export const modalEnter: Variants = {
  hidden: { opacity: 0, y: 8, scale: 0.992 },
  visible: { opacity: 1, y: 0, scale: 1, transition: tween(DUR.slow, EASE_OUT) },
  exit: { opacity: 0, y: 4, scale: 0.992, transition: tween(DUR.base, EASE) },
};

export const scrim: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: tween(DUR.base, EASE) },
  exit: { opacity: 0, transition: tween(DUR.fast, EASE) },
};

// ─── <FadeIn> · single-element fade-up ──────────────────────
export const FadeIn = forwardRef<HTMLDivElement, HTMLMotionProps<"div"> & { delay?: number }>(
  function FadeIn({ children, delay = 0, ...rest }, ref) {
    return (
      <motion.div
        ref={ref}
        initial="hidden"
        animate="visible"
        exit="exit"
        variants={fadeUp}
        transition={{ ...tween(DUR.slow, EASE_OUT), delay }}
        {...rest}
      >
        {children}
      </motion.div>
    );
  },
);

// ─── <Stagger> · parent that staggers children ──────────────
const staggerParent: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04, delayChildren: 0.04 } },
};

export function Stagger({
  children,
  className,
  style,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={staggerParent}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}

// ─── <StaggerItem> · child that fades-up under a Stagger ────
export function StaggerItem({
  children,
  className,
  style,
  asListItem,
}: {
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  asListItem?: boolean;
}) {
  const Comp = (asListItem ? motion.li : motion.div) as typeof motion.div;
  return (
    <Comp variants={cardEnter} className={className} style={style}>
      {children}
    </Comp>
  );
}

// ─── <PageTransition> · App-Router-friendly route transition ─
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -2 }}
      transition={tween(DUR.slow, EASE_OUT)}
      style={{ minHeight: "100%" }}
    >
      {children}
    </motion.div>
  );
}

// ─── Press behavior for interactive surfaces ────────────────
// Use this on cards, kanban cards, table rows. Buttons handle their own
// press in CSS via translateY(0.5px) to keep the design-system feel.
export const pressable = {
  whileHover: { y: -1, transition: tween(DUR.base, EASE) },
  whileTap: { y: 0, scale: 0.997, transition: tween(DUR.fast, EASE) },
} as const;

// ─── Re-export motion + AnimatePresence so callers don't need framer-motion directly
export { motion, AnimatePresence } from "framer-motion";
