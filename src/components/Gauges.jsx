import React from 'react';

/**
 * Renders a high-fidelity glowing SVG ring gauge
 */
export function RingGauge({ value, max, label, unit, color }) {
  // SVG ring properties
  const radius = 50;
  const strokeWidth = 8;
  const circumference = 2 * Math.PI * radius;
  
  // Constrain value
  const constrainedVal = Math.max(0, Math.min(max, value));
  // 3/4 gauge effect (angle starts at 135 deg and spans 270 deg)
  const arcSpanFraction = 0.75; 
  const strokeDashoffset = circumference - (constrainedVal / max) * circumference * arcSpanFraction;
  const strokeDasharray = circumference;

  // Color mapping
  const colorHex = {
    cyan: "#00e5ff",
    green: "#39ff14",
    orange: "#ff7b00",
    red: "#ff003c"
  }[color] || "#00e5ff";

  return (
    <div className="glass-panel" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
      <svg className="gauge-svg" viewBox="0 0 120 120">
        <defs>
          <radialGradient id={`glow-${label}`} cx="50%" cy="50%" r="50%">
            <stop offset="60%" stopColor="#0c0c0e" stopOpacity="1" />
            <stop offset="100%" stopColor={colorHex} stopOpacity="0.05" />
          </radialGradient>
          <filter id={`blur-${label}`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* Background Dial Fill */}
        <circle cx="60" cy="60" r={radius} fill={`url(#glow-${label})`} />

        {/* Background Track Arc */}
        <path
          d="M 24.6 95.4 A 50 50 0 1 1 95.4 95.4"
          fill="none"
          stroke="rgba(255, 255, 255, 0.05)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
        />

        {/* Foreground Colored Gauge Arc */}
        <path
          d="M 24.6 95.4 A 50 50 0 1 1 95.4 95.4"
          fill="none"
          stroke={colorHex}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={`${circumference * arcSpanFraction} ${circumference}`}
          strokeDashoffset={(circumference * arcSpanFraction) - ((constrainedVal / max) * circumference * arcSpanFraction)}
          className="gauge-progress"
          filter={`url(#blur-${label})`}
        />

        {/* Centered Numeric Value */}
        <text x="60" y="58" className="gauge-text-val" style={{ fill: '#fff', fontSize: '20px', fontFamily: 'monospace' }}>
          {value}
        </text>

        {/* Centered Unit */}
        {unit && (
          <text x="60" y="74" style={{ fill: 'rgba(255, 255, 255, 0.4)', fontSize: '8px', fontWeight: 600, textAnchor: 'middle', textTransform: 'uppercase' }}>
            {unit}
          </text>
        )}

        {/* Label inside Gauge */}
        <text x="60" y="112" className="gauge-text-label" style={{ fill: 'rgba(255,255,255,0.5)', fontSize: '9px', fontWeight: 700 }}>
          {label}
        </text>
      </svg>
    </div>
  );
}

/**
 * Standard progress bar container for quick stress reporting
 */
export function HorizontalProgressBar({ label, value, colorHex }) {
  return (
    <div style={{ margin: '12px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', fontWeight: 600, color: 'rgba(255, 255, 255, 0.6)', textTransform: 'uppercase', marginBottom: '5px' }}>
        <span>{label}</span>
        <span>{value}%</span>
      </div>
      <div style={{ width: '100%', height: '8px', background: 'rgba(255, 255, 255, 0.05)', borderRadius: '4px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.02)' }}>
        <div style={{
          width: `${value}%`,
          height: '100%',
          background: colorHex,
          boxShadow: `0 0 10px ${colorHex}`,
          borderRadius: '4px',
          transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)'
        }} />
      </div>
    </div>
  );
}
