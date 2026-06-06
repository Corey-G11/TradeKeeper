import React from 'react';

// Simple SVG equity sparkline. points: [{value}], green if ends up.
export function Sparkline({ points, height = 56, color }) {
  if (!points || points.length < 2) {
    return <div style={{ height, color: 'var(--muted)', fontSize: 12 }} />;
  }
  const vals = points.map((p) => p.value);
  const min = Math.min(...vals, 0);
  const max = Math.max(...vals, 0);
  const span = max - min || 1;
  const w = 300;
  const stepX = w / (points.length - 1);
  const y = (v) => height - ((v - min) / span) * (height - 6) - 3;
  const d = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${(i * stepX).toFixed(1)} ${y(p.value).toFixed(1)}`)
    .join(' ');
  const last = vals[vals.length - 1];
  const stroke = color || (last >= 0 ? 'var(--green)' : 'var(--red)');
  const zeroY = y(0);
  return (
    <svg
      viewBox={`0 0 ${w} ${height}`}
      preserveAspectRatio="none"
      style={{ width: '100%', height }}
    >
      <defs>
        <linearGradient id="spark-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.28" />
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
        strokeDasharray="4 4"
      />
      <path d={`${d} L ${w} ${height} L 0 ${height} Z`} fill="url(#spark-fill)" />
      <path d={d} fill="none" stroke={stroke} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

// Circular progress gauge (0..1). Used for confidence calibration.
export function Ring({ value = 0, size = 96, stroke = 9, color = 'var(--cyan)', label, sub }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const off = c * (1 - Math.max(0, Math.min(1, value)));
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke="var(--border)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={off}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dashoffset 0.5s ease' }}
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
        <span className="mono" style={{ fontSize: 22, fontWeight: 800 }}>
          {label}
        </span>
        {sub && (
          <span style={{ fontSize: 10, color: 'var(--muted)', marginTop: 1 }}>
            {sub}
          </span>
        )}
      </div>
    </div>
  );
}
