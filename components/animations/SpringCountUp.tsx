'use client';
// Inspired by reactbits.dev/react/count-up
// Spring-physics CountUp — smooth, natural feel
import { useInView, useMotionValue, useSpring } from 'motion/react';
import { useEffect, useRef } from 'react';

interface CountUpProps {
  to: number;
  from?: number;
  duration?: number;
  suffix?: string;
  className?: string;
  startWhen?: boolean;
}

export function SpringCountUp({
  to,
  from = 0,
  duration = 2,
  suffix = '',
  className = '',
  startWhen = true,
}: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const animatedRef = useRef(false);
  const motionValue = useMotionValue(from);
  const damping = 20 + 40 * (1 / duration);
  const stiffness = 100 * (1 / duration);
  const springValue = useSpring(motionValue, { damping, stiffness });
  const isInView = useInView(ref as React.RefObject<Element>, { once: true, margin: '0px' });

  useEffect(() => {
    if (isInView && startWhen && !animatedRef.current) {
      animatedRef.current = true;
      motionValue.set(from);
      requestAnimationFrame(() => {
        motionValue.set(to);
      });
    }
  }, [isInView, startWhen, motionValue, from, to]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = Math.round(latest).toString() + suffix;
      }
    });
    return unsubscribe;
  }, [springValue, suffix]);

  return (
    <span ref={ref} className={className}>
      {to}{suffix}
    </span>
  );
}
