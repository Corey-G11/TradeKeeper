import React, { useEffect, useState, useRef } from 'react';

let uid = 0;
const useId = (prefix) => {
  const ref = useRef(null);
  if (ref.current == null) {
    uid += 1;
    ref.current = `${prefix}-${uid}`;
  }
  return ref.current;
};

// SVG equity sparkline. points: [{value}]; green if it ends up, red if down.
// Draws itself in with a stroke-dash animation.
export function Sparkline({ points, height = 60, color }) {
  const fillId = useId('spark');
  if (!points || points.length < 2) {
    return (
      <div
        style={{
          height,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'var(--faint)',
          fontSize: 12,
        }}
      >
        Log a couple of trades to see your curve
      </div>
    );
  }
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals, 0);
  const span = max - min || 1;
  const w = 300;
  const stepX = w / (points.length - 1);
  const y = (v) => height - ((v - min) / span) * (height - 8) - 4;
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(' ');
  const last = vals[vals.length - 1];
  const stroke = color || (last >= 0 ? 'var(--green)' : 'var(--red)');
  const zeroY = y(0);
  const lastX = (points.length - 1) * stepX;
  const lastY = y(last);
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height, display: 'block', overflow: 'visible' }}
    >
      <defs>
        <linearGradient id={fillId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.32" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0" />
        </linearGradient>
      </defs>
      <line
        x1="0"
        x2={w}
        y1={zeroY}
        y2={zeroY}
        stroke="var(--border)"
        strokeWidth="1"
        strokeDasharray="3 5"
      />
      <path d={`${d} L ${w} ${height} L 0 ${height} Z`} fill={`url(#${fillId})`} />
      <path
        d={d}
        fill="none"
        stroke={stroke}
        strokeWidth="2.5"
        strokeLinejoin="round"
        strokeLinecap="round"
        style={{
          strokeDasharray: 1000,
          strokeDashoffset: 1000,
          animation: 'spark-draw 1.1s var(--ease) forwards',
        }}
      />
      <circle cx={lastX} cy={lastY} r="3.5" fill={stroke} />
      <circle cx={lastX} cy={lastY} r="6.5" fill={stroke} opacity="0.25">
        <animate attributeName="r" values="5;9;5" dur="2.4s" repeatCount="indefinite" />
        <animate attributeName="opacity" values="0.35;0;0.35" dur="2.4s" repeatCount="indefinite" />
      </circle>
      <style>{`@keyframes spark-draw{to{stroke-dashoffset:0}}`}</style>
    </svg>
  );
}

// Circular progress gauge (0..1). Animates from 0 on mount.
export function Ring({ value = 0, size = 104, stroke = 10, color = 'var(--cyan)', label, sub }) {
  const gradId = useId('ring');
  const target = Math.max(0, Math.min(1, value));
  const [v, setV] = useState(0);
  useEffect(() => {
    const t = setTimeout(() => setV(target), 60);
    return () => clearTimeout(t);
  }, [target]);

  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - v);
  return (
    <div style={{ position: 'relative', width: size, height: size, flex: '0 0 auto' }}>
      <svg width={size} height={size}>
        <defs>
          <linearGradient id={gradId} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="var(--cyan)" />
            <stop offset="100%" stopColor="var(--green)" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--surface-2)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color === 'var(--cyan)' ? `url(#${gradId})` : color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.9s var(--ease)' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span className="mono" style={{ fontSize: 26, fontWeight: 800, lineHeight: 1 }}>
          {label}
        </span>
        {sub && (
          <span
            style={{
              fontSize: 9.5,
              color: 'var(--muted)',
              marginTop: 4,
              textTransform: 'uppercase',
              letterSpacing: '0.1em',
              fontWeight: 700,
            }}
          >
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}
