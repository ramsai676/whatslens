'use client';

import { useEffect, useRef } from 'react';
import {
  motion,
  useInView,
  useMotionValue,
  useReducedMotion,
  useSpring,
  useTransform,
} from 'motion/react';

/** Springy count-up that starts when the number scrolls into view. */
export function AnimatedNumber({
  value,
  className,
  style,
}: {
  value: number;
  className?: string;
  style?: React.CSSProperties;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const reduced = useReducedMotion();
  const mv = useMotionValue(0);
  const spring = useSpring(mv, { stiffness: 80, damping: 22 });
  const rounded = useTransform(spring, (v) => Math.round(v).toLocaleString('en-IN'));

  useEffect(() => {
    if (inView) mv.set(value);
  }, [inView, value, mv]);

  if (reduced) {
    return (
      <span className={className} style={style}>
        {value.toLocaleString('en-IN')}
      </span>
    );
  }
  return (
    <motion.span ref={ref} className={className} style={style}>
      {rounded}
    </motion.span>
  );
}

/** Scroll-triggered reveal with a strong ease-out — for below-the-fold sections. */
export function Reveal({
  children,
  delay = 0,
  className,
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduced = useReducedMotion();
  return (
    <motion.div
      className={className}
      initial={reduced ? false : { opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.55, delay, ease: [0.23, 1, 0.32, 1] }}
    >
      {children}
    </motion.div>
  );
}
