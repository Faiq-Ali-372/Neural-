'use client';
import { motion } from 'framer-motion';

interface LineChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  fill?: boolean;
  label?: string;
}

export default function LineChart({ data, width = 320, height = 80, color = '#6366F1', fill = true, label }: LineChartProps) {
  if (data.length < 2) return null;
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;
  const pad = { l: 4, r: 4, t: 8, b: 4 };
  const W = width - pad.l - pad.r;
  const H = height - pad.t - pad.b;

  const pts = data.map((v, i) => ({
    x: pad.l + (i / (data.length - 1)) * W,
    y: pad.t + H - ((v - min) / range) * H,
  }));

  const linePath = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
  const areaPath = `${linePath} L ${pts[pts.length-1].x} ${pad.t + H} L ${pts[0].x} ${pad.t + H} Z`;

  const totalLen = pts.reduce((acc, p, i) => {
    if (i === 0) return 0;
    const prev = pts[i-1];
    return acc + Math.sqrt((p.x-prev.x)**2 + (p.y-prev.y)**2);
  }, 0);

  return (
    <svg width={width} height={height} style={{ overflow: 'visible', display: 'block' }}>
      <defs>
        <linearGradient id={`fill-${color.replace('#','')}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {fill && <path d={areaPath} fill={`url(#fill-${color.replace('#','')})`} />}
      <motion.path
        d={linePath}
        fill="none"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.2, ease: 'easeInOut' }}
      />
      {/* Last point dot */}
      <motion.circle
        cx={pts[pts.length-1].x}
        cy={pts[pts.length-1].y}
        r={3.5}
        fill={color}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ delay: 1.1, type: 'spring' }}
        style={{ filter: `drop-shadow(0 0 6px ${color})` }}
      />
    </svg>
  );
}
