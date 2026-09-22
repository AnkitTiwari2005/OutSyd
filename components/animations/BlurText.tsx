'use client';
// Inspired by reactbits.dev/react/blur-text
// Animates each word in from blur + translateY on scroll-into-view
import { motion, useInView } from 'motion/react';
import { useRef, useMemo } from 'react';

interface BlurTextProps {
  text: string;
  className?: string;
  delay?: number;        // ms between each word
  direction?: 'top' | 'bottom';
  tag?: 'h1' | 'h2' | 'h3' | 'p' | 'span';
  once?: boolean;
}

export function BlurText({
  text,
  className = '',
  delay = 80,
  direction = 'bottom',
  tag: Tag = 'p',
  once = true,
}: BlurTextProps) {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref as React.RefObject<Element>, { once, margin: '-40px' });

  const words = useMemo(() => text.split(' '), [text]);

  const yFrom = direction === 'bottom' ? 18 : -18;

  return (
    <Tag ref={ref as React.RefObject<HTMLElement & HTMLHeadingElement & HTMLParagraphElement>} className={className} style={{ display: 'inline' }}>
      {words.map((word, i) => (
        <motion.span
          key={i}
          style={{ display: 'inline-block', marginRight: '0.28em' }}
          initial={{ opacity: 0, y: yFrom, filter: 'blur(8px)' }}
          animate={inView ? { opacity: 1, y: 0, filter: 'blur(0px)' } : {}}
          transition={{
            duration: 0.55,
            delay: i * (delay / 1000),
            ease: [0.16, 1, 0.3, 1],
          }}
        >
          {word}
        </motion.span>
      ))}
    </Tag>
  );
}
