'use client';
import { useEffect, useRef } from 'react';
import { motion, useMotionValue, useSpring } from 'framer-motion';

interface CountUpProps {
  to: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
  style?: React.CSSProperties;
}

export default function CountUp({ to, duration = 1.4, decimals = 0, prefix = '', suffix = '', className = '', style }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const raw = useMotionValue(0);
  const smoothed = useSpring(raw, { duration: duration * 1000, bounce: 0 });

  useEffect(() => {
    raw.set(to);
    const unsub = smoothed.on('change', (v) => {
      if (ref.current) {
        ref.current.textContent = prefix + v.toFixed(decimals) + suffix;
      }
    });
    return unsub;
  }, [to, prefix, suffix, decimals, raw, smoothed]);

  return (
    <motion.span ref={ref} className={className} style={style}>
      {prefix}0{suffix}
    </motion.span>
  );
}
