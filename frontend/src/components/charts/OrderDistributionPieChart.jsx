import React, { useState } from 'react';
import { PieChart as PieIcon } from 'lucide-react';

export default function OrderDistributionPieChart({
  pending = 0,
  confirmed = 0,
  completed = 0,
  cancelled = 0
}) {
  const [hoveredIndex, setHoveredIndex] = useState(null);

  const data = [
    { label: 'Pending Payment', value: Number(pending) || 0, color: '#E5A15B' },
    { label: 'Paid / In Escrow', value: Number(confirmed) || 0, color: '#788B76' },
    { label: 'Completed Handover', value: Number(completed) || 0, color: '#20231F' },
    { label: 'Cancelled / Failed', value: Number(cancelled) || 0, color: '#ef4444' },
  ].filter(item => item.value > 0);

  const total = data.reduce((acc, curr) => acc + curr.value, 0);

  if (total === 0) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '260px',
        color: 'var(--text-muted)',
        textAlign: 'center',
        padding: '1.5rem'
      }}>
        <PieIcon size={42} style={{ opacity: 0.35, marginBottom: '0.75rem', color: 'var(--charcoal)' }} />
        <h4 style={{ margin: '0 0 0.35rem 0', fontWeight: 700, fontSize: '0.95rem', color: 'var(--charcoal)' }}>No Order Distribution Data</h4>
        <p style={{ margin: 0, fontSize: '0.8rem', maxWidth: '280px', color: 'var(--text-muted)' }}>
          When student buyers place orders for your listings, their fulfillment status distribution will appear here.
        </p>
      </div>
    );
  }

  // Generate SVG donut arcs
  const radius = 70;
  const strokeWidth = 26;
  const circumference = 2 * Math.PI * radius;
  let accumulatedPercent = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <div style={{ position: 'relative', width: '200px', height: '200px', margin: '0 auto 1.5rem auto' }}>
        <svg viewBox="0 0 200 200" width="100%" height="100%" style={{ transform: 'rotate(-90deg)' }}>
          {data.map((item, index) => {
            const percent = item.value / total;
            const strokeDasharray = `${circumference * percent} ${circumference * (1 - percent)}`;
            const strokeDashoffset = -circumference * accumulatedPercent;
            accumulatedPercent += percent;

            const isHovered = hoveredIndex === index;

            return (
              <circle
                key={item.label}
                cx="100"
                cy="100"
                r={radius}
                fill="none"
                stroke={item.color}
                strokeWidth={isHovered ? strokeWidth + 4 : strokeWidth}
                strokeDasharray={strokeDasharray}
                strokeDashoffset={strokeDashoffset}
                style={{
                  transition: 'all 0.25s ease',
                  cursor: 'pointer',
                  opacity: hoveredIndex !== null && !isHovered ? 0.5 : 1
                }}
                onMouseEnter={() => setHoveredIndex(index)}
                onMouseLeave={() => setHoveredIndex(null)}
              />
            );
          })}
        </svg>

        {/* Donut Center Display */}
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none'
        }}>
          {hoveredIndex !== null ? (
            <>
              <span style={{ fontSize: '1.4rem', fontWeight: 800, color: data[hoveredIndex].color }}>
                {Math.round((data[hoveredIndex].value / total) * 100)}%
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                {data[hoveredIndex].value} {data[hoveredIndex].value === 1 ? 'order' : 'orders'}
              </span>
            </>
          ) : (
            <>
              <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--charcoal)' }}>
                {total}
              </span>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Total Orders
              </span>
            </>
          )}
        </div>
      </div>

      {/* Legend list */}
      <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        {data.map((item, index) => {
          const isHovered = hoveredIndex === index;
          return (
            <div
              key={item.label}
              onMouseEnter={() => setHoveredIndex(index)}
              onMouseLeave={() => setHoveredIndex(null)}
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '0.45rem 0.75rem',
                borderRadius: 'var(--radius-sm)',
                backgroundColor: isHovered ? 'var(--sage-light)' : 'transparent',
                cursor: 'pointer',
                transition: 'background-color 0.15s ease',
                border: '1px solid transparent',
                borderColor: isHovered ? 'var(--border-subtle)' : 'transparent',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <span style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: item.color }}></span>
                <span style={{ fontSize: '0.85rem', color: 'var(--charcoal)', fontWeight: isHovered ? 700 : 500 }}>
                  {item.label}
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--charcoal)' }}>
                  {item.value}
                </span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                  ({Math.round((item.value / total) * 100)}%)
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
