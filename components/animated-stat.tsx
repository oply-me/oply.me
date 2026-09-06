"use client";

import { useEffect, useRef, useState } from "react";
import { animate, useInView, useReducedMotion } from "framer-motion";
import { formatNumber } from "@/lib/utils";

const DURATION_S = 1.1;

/**
 * Counts up to `value` once, the first time it scrolls into view. `value` is
 * always a real number supplied by the caller (tool count, price, credits) —
 * this component never fetches or invents data of its own.
 */
export function AnimatedStat({
  value,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-60px" });
  const reduceMotion = useReducedMotion();
  /**
   * Always seeded at 0, never at `value`: `useReducedMotion` reads
   * `matchMedia` and so returns `true` on the client's first render but not
   * during SSR, which made a reduced-motion visitor's first paint disagree
   * with the server's and threw away the hydrated tree. The effect below
   * puts the real number in on mount instead.
   */
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView || reduceMotion) {
      setDisplay(value);
      return;
    }
    const controls = animate(0, value, {
      duration: DURATION_S,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
  }, [inView, reduceMotion, value]);

  return (
    <span ref={ref} className={className}>
      {prefix}
      {formatNumber(display)}
      {suffix}
    </span>
  );
}
