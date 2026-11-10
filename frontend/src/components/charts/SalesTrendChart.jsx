import React, { useState, useMemo } from 'react';
import { formatPrice } from '../../utils/formatters';
import { BarChart3, Calendar, IndianRupee, ShoppingBag } from 'lucide-react';

export default function SalesTrendChart({ trends = [], sales = [] }) {
  const [timeRange, setTimeRange] = useState('30D'); // '7D' | '30D' | 'ALL'
  const [metric, setMetric] = useState('revenue'); // 'revenue' | 'orders'
  const [hoveredPoint, setHoveredPoint] = useState(null);

  // Compute daily aggregated data from trends or fallback to sales records
  const chartData = useMemo(() => {
    const dateMap = new Map();

    if (trends && trends.length > 0) {
      trends.forEach((t) => {
        if (!t.period) return;
        const key = t.period;
        dateMap.set(key, {
          date: key,
          revenue: Number(t.totalAmount) || 0,
          orders: Number(t.orderCount) || 0,
        });
      });
    } else if (sales && sales.length > 0) {
      sales
        .filter((s) => s.status === 'PAID' || s.status === 'COMPLETED')
        .forEach((s) => {
          if (!s.createdAt) return;
          const key = s.createdAt.substring(0, 10);
          const current = dateMap.get(key) || { date: key, revenue: 0, orders: 0 };
          current.revenue += Number(s.amount) || 0;
          current.orders += 1;
          dateMap.set(key, current);
        });
    }

    let sorted = Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));

    const now = new Date();
    if (timeRange === '7D') {
      const cutoff = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
      sorted = sorted.filter((d) => d.date >= cutoff);
    } else if (timeRange === '30D') {
      const cutoff = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
      sorted = sorted.filter((d) => d.date >= cutoff);
    }

    return sorted;
  }, [trends, sales, timeRange]);

  const totalRevenue = chartData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = chartData.reduce((sum, d) => sum + d.orders, 0);

  if (chartData.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '260px',
          color: 'var(--text-muted)',
          textAlign: 'center',
          padding: '2rem',
        }}
      >
        <div
          style={{
            width: '56px',
            height: '56px',
            borderRadius: 'var(--radius-md)',
            backgroundColor: 'var(--sage-light)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: '0.75rem',
            color: 'var(--charcoal)',
          }}
        >
          <BarChart3 size={28} />
        </div>
        <h4 style={{ margin: '0 0 0.35rem 0', fontWeight: 800, color: 'var(--charcoal)' }}>No Verified Sales Recorded</h4>
        <p style={{ margin: 0, fontSize: '0.85rem', maxWidth: '340px', color: 'var(--text-muted)' }}>
          Completed and paid buyer escrow transactions within the selected timeframe ({timeRange}) will display in this performance timeline.
        </p>
      </div>
    );
  }

  // SVG dimensions
  const svgWidth = 600;
  const svgHeight = 220;
  const padding = { top: 20, right: 20, bottom: 40, left: 45 };
  const graphWidth = svgWidth - padding.left - padding.right;
  const graphHeight = svgHeight - padding.top - padding.bottom;

  const maxValue = Math.max(
    ...chartData.map((d) => (metric === 'revenue' ? d.revenue : d.orders)),
    1
  );

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const barWidth = Math.max(Math.min(graphWidth / chartData.length - 8, 32), 12);

  return (
    <div>
      {/* Controls Bar */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '0.75rem',
          marginBottom: '1.25rem',
        }}
      >
        {/* Metric Toggle */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--sage-light)',
            padding: '3px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => setMetric('revenue')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: metric === 'revenue' ? 'var(--charcoal)' : 'transparent',
              color: metric === 'revenue' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: metric === 'revenue' ? 700 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <IndianRupee size={13} /> Revenue (₹)
          </button>
          <button
            type="button"
            onClick={() => setMetric('orders')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.35rem 0.85rem',
              borderRadius: 'var(--radius-pill)',
              border: 'none',
              background: metric === 'orders' ? 'var(--charcoal)' : 'transparent',
              color: metric === 'orders' ? '#ffffff' : 'var(--text-muted)',
              fontWeight: metric === 'orders' ? 700 : 500,
              fontSize: '0.8rem',
              cursor: 'pointer',
              transition: 'all 0.15s ease',
            }}
          >
            <ShoppingBag size={13} /> Order Count
          </button>
        </div>

        {/* Timeframe Filter Buttons */}
        <div
          style={{
            display: 'inline-flex',
            background: 'var(--sage-light)',
            padding: '3px',
            borderRadius: 'var(--radius-pill)',
            border: '1px solid var(--border-subtle)',
          }}
        >
          {['7D', '30D', 'ALL'].map((range) => (
            <button
              key={range}
              type="button"
              onClick={() => setTimeRange(range)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: 'var(--radius-pill)',
                border: 'none',
                background: timeRange === range ? '#ffffff' : 'transparent',
                color: timeRange === range ? 'var(--charcoal)' : 'var(--text-muted)',
                fontWeight: timeRange === range ? 700 : 500,
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.15s ease',
              }}
            >
              {range === '7D' ? 'Last 7 Days' : range === '30D' ? 'Last 30 Days' : 'All History'}
            </button>
          ))}
        </div>
      </div>

      {/* Period Headline Summary */}
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          gap: '0.5rem',
          marginBottom: '1rem',
        }}
      >
        <span style={{ fontSize: '1.6rem', fontWeight: 800, color: 'var(--charcoal)' }}>
          {metric === 'revenue' ? formatPrice(totalRevenue) : `${totalOrders} orders`}
        </span>
        <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          verified in {timeRange === '7D' ? 'past 7 days' : timeRange === '30D' ? 'past 30 days' : 'all-time record'}
        </span>
      </div>

      {/* Responsive SVG Chart */}
      <div style={{ position: 'relative', width: '100%', overflowX: 'auto' }}>
        <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} width="100%" height="auto" style={{ display: 'block' }}>
          <defs>
            <linearGradient id="revenueBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#20231F" />
              <stop offset="100%" stopColor="#3d443b" />
            </linearGradient>
            <linearGradient id="orderBarGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#788B76" />
              <stop offset="100%" stopColor="#536451" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines */}
          {yTicks.map((tick) => {
            const y = padding.top + graphHeight * (1 - tick);
            const val = Math.round(maxValue * tick);
            return (
              <g key={tick}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={svgWidth - padding.right}
                  y2={y}
                  stroke="var(--border-subtle)"
                  strokeDasharray="4 4"
                />
                <text
                  x={padding.left - 8}
                  y={y + 4}
                  textAnchor="end"
                  fontSize="10"
                  fill="var(--text-muted)"
                  fontWeight="600"
                >
                  {metric === 'revenue' ? `₹${val}` : val}
                </text>
              </g>
            );
          })}

          {/* Bars */}
          {chartData.map((d, i) => {
            const val = metric === 'revenue' ? d.revenue : d.orders;
            const barHeight = maxValue > 0 ? (val / maxValue) * graphHeight : 0;
            const x =
              padding.left +
              (i + 0.5) * (graphWidth / chartData.length) -
              barWidth / 2;
            const y = padding.top + graphHeight - barHeight;

            const isHovered = hoveredPoint === i;

            return (
              <g key={d.date} onMouseEnter={() => setHoveredPoint(i)} onMouseLeave={() => setHoveredPoint(null)}>
                <rect
                  x={x}
                  y={y}
                  width={barWidth}
                  height={Math.max(barHeight, 2)}
                  rx="6"
                  fill={metric === 'revenue' ? 'url(#revenueBarGrad)' : 'url(#orderBarGrad)'}
                  opacity={hoveredPoint !== null && !isHovered ? 0.45 : 1}
                  style={{ transition: 'all 0.15s ease', cursor: 'pointer' }}
                />
                {/* X axis date label */}
                {(chartData.length <= 10 || i % Math.ceil(chartData.length / 8) === 0) && (
                  <text
                    x={x + barWidth / 2}
                    y={svgHeight - 12}
                    textAnchor="middle"
                    fontSize="10"
                    fill="var(--text-muted)"
                    fontWeight="500"
                  >
                    {d.date.substring(5)}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Hover Tooltip */}
        {hoveredPoint !== null && chartData[hoveredPoint] && (
          <div
            style={{
              position: 'absolute',
              top: '10px',
              right: '15px',
              backgroundColor: 'var(--charcoal)',
              color: '#ffffff',
              padding: '6px 12px',
              borderRadius: 'var(--radius-sm)',
              fontSize: '0.8rem',
              boxShadow: 'var(--shadow-md)',
              pointerEvents: 'none',
              zIndex: 10,
            }}
          >
            <div>Date: <strong>{chartData[hoveredPoint].date}</strong></div>
            <div>{metric === 'revenue' ? `Revenue: ${formatPrice(chartData[hoveredPoint].revenue)}` : `Orders: ${chartData[hoveredPoint].orders}`}</div>
          </div>
        )}
      </div>
    </div>
  );
}
