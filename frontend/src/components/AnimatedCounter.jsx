import React, { useEffect, useState } from 'react';

/**
 * Animated counter that counts from 0 up to `value`
 * Supports integers, decimals, and custom formatters (like currency formatPrice).
 */
export default function AnimatedCounter({ value = 0, duration = 800, formatter = (v) => v, isCurrency = false }) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setDisplayValue(value);
      return;
    }

    const numericTarget = typeof value === 'number' ? value : parseFloat(value) || 0;
    if (numericTarget === 0) {
      setDisplayValue(0);
      return;
    }

    let start = 0;
    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const eased = 1 - Math.pow(1 - progress, 3);
      const current = start + (numericTarget - start) * eased;

      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setDisplayValue(numericTarget);
      }
    };

    const reqId = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(reqId);
  }, [value, duration]);

  if (isCurrency) {
    const rounded = Math.round(displayValue);
    return <span>{formatter(rounded)}</span>;
  }

  // If integer
  if (Number.isInteger(value)) {
    return <span>{Math.round(displayValue)}</span>;
  }

  // Float (e.g. rating 4.8)
  return <span>{displayValue.toFixed(1)}</span>;
}

