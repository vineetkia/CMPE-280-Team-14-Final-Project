"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import { tween, DUR, EASE_OUT } from "@/components/motion";

/**
 * Per-route fade-up wrapper.
 *
 * IMPORTANT — what we deliberately do NOT do:
 *   - No AnimatePresence keyed on pathname. That pattern breaks SSR
 *     hydration in App Router (React error #418) because the client tries
 *     to re-mount the whole subtree on the first paint; the SSR HTML and
 *     CSR HTML diverge, React bails on the tree, page goes blank until reload.
 *
 * What we DO:
 *   - Render children server-side as-is. After hydration, key the motion
 *     wrapper on pathname so a fresh fade runs on every client navigation.
 *   - Use `mounted` to skip the first animation (the SSR HTML already painted),
 *     and only animate on subsequent navigations triggered by `<Link>`.
 */
export function AppRouteTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // First paint: render the SSR tree statically. No motion wrapper, no
  // hidden initial state. The page appears the moment HTML lands.
  if (!mounted) {
    return <div style={{ minHeight: "100%" }}>{children}</div>;
  }

  // Subsequent client-side navigations: keyed motion wrapper fades the
  // new route in. The unmount of the previous route is a hard cut, which
  // is fine — exit animations on full-page transitions are imperceptible.
  return (
    <motion.div
      key={pathname}
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={tween(DUR.slow, EASE_OUT)}
      style={{ minHeight: "100%" }}
    >
      {children}
    </motion.div>
  );
}
