import React, { useState, useRef } from 'react';

/**
 * High-performance, dependency-free responsive SVG dual-axis line chart
 * plots HP and Torque vs RPM curves (Stock vs Modified)
 */
export function PerformanceCharts({ rpmPoints, stockHp, stockTorque, modHp, modTorque, redline }) {
  const [hoverIndex, setHoverIndex] = useState(null);
  const containerRef = useRef(null);

  // SVG Dimension defaults for viewbox
  const svgWidth = 600;
  const svgHeight = 320;
  const paddingLeft = 50;
  const paddingRight = 50;
  const paddingTop = 30;
  const paddingBottom = 40;

  const chartWidth = svgWidth - paddingLeft - paddingRight;
  const chartHeight = svgHeight - paddingTop - paddingBottom;

  // Find max values to scale Y axes
  const maxHp = Math.max(...stockHp, ...modHp, 100);
  const maxTorque = Math.max(...stockTorque, ...modTorque, 100);

  // Round max values up for neat grid spacing
  const scaleMaxHp = Math.ceil(maxHp / 50) * 50;
  const scaleMaxTorque = Math.ceil(maxTorque / 100) * 100;

  // Helper mappings
  const getX = (rpm) => {
    const minRpm = 1000;
    const maxRpm = redline;
    return paddingLeft + ((rpm - minRpm) / (maxRpm - minRpm)) * chartWidth;
  };

  const getYHp = (hpVal) => {
    return svgHeight - paddingBottom - (hpVal / scaleMaxHp) * chartHeight;
  };

  const getYTorque = (torqueVal) => {
    return svgHeight - paddingBottom - (torqueVal / scaleMaxTorque) * chartHeight;
  };

  // Build SVG Path strings
  const buildPath = (xPoints, yVals, scaleFunc) => {
    if (xPoints.length === 0) return "";
    return xPoints.map((rpm, idx) => {
      const x = getX(rpm);
      const y = scaleFunc(yVals[idx]);
      return `${idx === 0 ? 'M' : 'L'} ${x.toFixed(1)} ${y.toFixed(1)}`;
    }).join(" ");
  };

  const pathStockHp = buildPath(rpmPoints, stockHp, getYHp);
  const pathModHp = buildPath(rpmPoints, modHp, getYHp);
  const pathStockTorque = buildPath(rpmPoints, stockTorque, getYTorque);
  const pathModTorque = buildPath(rpmPoints, modTorque, getYTorque);

  // Grid Lines
  const minRpm = 1000;
  const maxRpm = redline;
  const rpmSteps = [];
  const numSteps = Math.ceil((maxRpm - minRpm) / 1000);
  for (let i = 0; i <= numSteps; i++) {
    const rpmVal = minRpm + i * 1000;
    if (rpmVal <= maxRpm) rpmSteps.push(rpmVal);
  }

  // Y-Axis Grid increments
  const hpGridLines = [0, scaleMaxHp * 0.25, scaleMaxHp * 0.5, scaleMaxHp * 0.75, scaleMaxHp];
  const torqueGridLines = [0, scaleMaxTorque * 0.25, scaleMaxTorque * 0.5, scaleMaxTorque * 0.75, scaleMaxTorque];

  // Mouse Move interactivity to get closest RPM point
  const handleMouseMove = (e) => {
    if (!containerRef.current || rpmPoints.length === 0) return;
    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    
    // Convert client coordinates back to SVG chart index
    const relativeX = (mouseX / rect.width) * svgWidth;
    const chartRelativeX = relativeX - paddingLeft;
    
    if (chartRelativeX < 0 || chartRelativeX > chartWidth) {
      setHoverIndex(null);
      return;
    }

    const percentage = chartRelativeX / chartWidth;
    const estimatedRpm = minRpm + percentage * (maxRpm - minRpm);
    
    // Find closest index in rpmPoints array
    let closestIdx = 0;
    let minDiff = Infinity;
    rpmPoints.forEach((rpm, idx) => {
      const diff = Math.abs(rpm - estimatedRpm);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = idx;
      }
    });

    setHoverIndex(closestIdx);
  };

  const handleMouseLeave = () => {
    setHoverIndex(null);
  };

  return (
    <div className="chart-container">
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
        style={{ position: 'relative', cursor: 'crosshair' }}
      >
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} style={{ width: '100%', height: 'auto', display: 'block' }}>
          <defs>
            {/* Glowing lines filters */}
            <filter id="glow-mod" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          {/* Grid lines & Labels */}
          {rpmSteps.map((rpm) => {
            const x = getX(rpm);
            return (
              <g key={`x-grid-${rpm}`}>
                <line
                  x1={x}
                  y1={paddingTop}
                  x2={x}
                  y2={svgHeight - paddingBottom}
                  stroke="rgba(255,255,255,0.03)"
                  strokeDasharray="2,2"
                />
                <text
                  x={x}
                  y={svgHeight - paddingBottom + 18}
                  fill="rgba(255,255,255,0.4)"
                  fontSize="10"
                  textAnchor="middle"
                  fontFamily="monospace"
                >
                  {rpm}
                </text>
              </g>
            );
          })}

          {/* Horizontal gridlines */}
          {hpGridLines.map((hp, idx) => {
            const y = getYHp(hp);
            return (
              <line
                key={`y-grid-${idx}`}
                x1={paddingLeft}
                y1={y}
                x2={svgWidth - paddingRight}
                y2={y}
                stroke="rgba(255,255,255,0.03)"
              />
            );
          })}

          {/* Left Y Axis Labels (BHP) */}
          {hpGridLines.map((hp) => (
            <text
              key={`label-hp-${hp}`}
              x={paddingLeft - 10}
              y={getYHp(hp) + 4}
              fill="var(--green-glow)"
              fontSize="9"
              fontWeight="bold"
              textAnchor="end"
              fontFamily="monospace"
            >
              {hp}
            </text>
          ))}

          {/* Right Y Axis Labels (Torque Nm) */}
          {torqueGridLines.map((tq) => (
            <text
              key={`label-tq-${tq}`}
              x={svgWidth - paddingRight + 10}
              y={getYTorque(tq) + 4}
              fill="var(--cyan-glow)"
              fontSize="9"
              fontWeight="bold"
              textAnchor="start"
              fontFamily="monospace"
            >
              {tq}
            </text>
          ))}

          {/* Graph Title Axis labels */}
          <text x={paddingLeft - 8} y={paddingTop - 12} fill="var(--green-glow)" fontSize="9" fontWeight="700" letterSpacing="0.5" textAnchor="middle">
            BHP
          </text>
          <text x={svgWidth - paddingRight + 8} y={paddingTop - 12} fill="var(--cyan-glow)" fontSize="9" fontWeight="700" letterSpacing="0.5" textAnchor="middle">
            Nm
          </text>

          {/* --- Plotted Curves --- */}

          {/* 1. Stock Torque (Light Dotted Cyan) */}
          <path
            d={pathStockTorque}
            fill="none"
            stroke="rgba(0, 229, 255, 0.25)"
            strokeWidth="2"
            strokeDasharray="4,4"
          />

          {/* 2. Modified Torque (Glowing Green Dashed) */}
          <path
            d={pathModTorque}
            fill="none"
            stroke="rgba(57, 255, 20, 0.45)"
            strokeWidth="3"
            strokeDasharray="6,4"
            filter="url(#glow-mod)"
          />

          {/* 3. Stock HP (Solid Light Cyan) */}
          <path
            d={pathStockHp}
            fill="none"
            stroke="rgba(0, 229, 255, 0.65)"
            strokeWidth="2"
          />

          {/* 4. Modified HP (Glowing Green Solid) */}
          <path
            d={pathModHp}
            fill="none"
            stroke="var(--green-glow)"
            strokeWidth="3.5"
            filter="url(#glow-mod)"
          />

          {/* Active Hover crosshair vertical line */}
          {hoverIndex !== null && (
            <g>
              <line
                x1={getX(rpmPoints[hoverIndex])}
                y1={paddingTop}
                x2={getX(rpmPoints[hoverIndex])}
                y2={svgHeight - paddingBottom}
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="1"
              />

              {/* Data Node Dots */}
              {/* HP Mod */}
              <circle
                cx={getX(rpmPoints[hoverIndex])}
                cy={getYHp(modHp[hoverIndex])}
                r="5"
                fill="var(--green-glow)"
                stroke="#000"
                strokeWidth="1.5"
              />
              {/* HP Stock */}
              <circle
                cx={getX(rpmPoints[hoverIndex])}
                cy={getYHp(stockHp[hoverIndex])}
                r="4"
                fill="var(--cyan-glow)"
                stroke="#000"
                strokeWidth="1.5"
              />
              {/* Torque Mod */}
              <circle
                cx={getX(rpmPoints[hoverIndex])}
                cy={getYTorque(modTorque[hoverIndex])}
                r="5"
                fill="#ffaa00"
                stroke="#000"
                strokeWidth="1.5"
              />
            </g>
          )}
        </svg>

        {/* Floating Tooltip Div when Hovered */}
        {hoverIndex !== null && (
          <div style={{
            position: 'absolute',
            top: '10px',
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'rgba(15, 15, 20, 0.95)',
            border: '1px solid rgba(255,255,255,0.1)',
            borderRadius: '6px',
            padding: '8px 12px',
            fontSize: '11px',
            pointerEvents: 'none',
            display: 'grid',
            gridTemplateColumns: 'auto auto',
            columnGap: '15px',
            rowGap: '4px',
            boxShadow: '0 4px 15px rgba(0,0,0,0.5)',
            fontFamily: 'monospace'
          }}>
            <div style={{ gridColumn: 'span 2', textAlign: 'center', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '3px', fontWeight: 'bold', color: '#fff' }}>
              RPM: {rpmPoints[hoverIndex]}
            </div>
            
            <div style={{ color: 'var(--green-glow)' }}>Modified BHP:</div>
            <div style={{ fontWeight: 'bold', textAlign: 'right' }}>{modHp[hoverIndex]} BHP</div>
            
            <div style={{ color: 'var(--cyan-glow)' }}>Stock BHP:</div>
            <div style={{ fontWeight: 'bold', textAlign: 'right', color: 'rgba(255,255,255,0.6)' }}>{stockHp[hoverIndex]} BHP</div>

            <div style={{ color: '#ffaa00' }}>Modified Torque:</div>
            <div style={{ fontWeight: 'bold', textAlign: 'right' }}>{modTorque[hoverIndex]} Nm</div>

            <div style={{ color: 'rgba(0, 229, 255, 0.6)' }}>Stock Torque:</div>
            <div style={{ fontWeight: 'bold', textAlign: 'right', color: 'rgba(255,255,255,0.6)' }}>{stockTorque[hoverIndex]} Nm</div>
          </div>
        )}
      </div>

      {/* Legends */}
      <div className="chart-legend">
        <div className="legend-item">
          <span className="legend-color-dot dot-mod-hp" />
          <span>Modified BHP</span>
        </div>
        <div className="legend-item">
          <span className="legend-color-dot dot-stock-hp" />
          <span>Stock BHP</span>
        </div>
        <div className="legend-item">
          <span className="legend-color-dot dot-mod-torque" />
          <span>Modified Torque (Nm)</span>
        </div>
        <div className="legend-item">
          <span className="legend-color-dot dot-stock-torque" />
          <span>Stock Torque (Nm)</span>
        </div>
      </div>
    </div>
  );
}
