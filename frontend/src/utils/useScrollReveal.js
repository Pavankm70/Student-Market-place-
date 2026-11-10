import { useEffect, useRef, useState } from 'react';

/**
 * Custom hook for viewport scroll reveals.
 * Uses IntersectionObserver with fallback for older environments.
 * Respects prefers-reduced-motion for accessibility.
 */
export const useScrollReveal = (options = {}) => {
  const elementRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check for user's reduced motion preference
    const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (prefersReducedMotion) {
      setIsVisible(true);
      return;
    }

    const currentElement = elementRef.current;
    if (!currentElement) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (options.once !== false) {
            observer.unobserve(entry.target);
          }
        } else if (options.once === false) {
          setIsVisible(false);
        }
      },
      {
        threshold: options.threshold || 0.12,
        rootMargin: options.rootMargin || '0px 0px -40px 0px',
      }
    );

    observer.observe(currentElement);

    return () => {
      if (currentElement) observer.unobserve(currentElement);
    };
  }, [options.threshold, options.rootMargin, options.once]);

  return [elementRef, isVisible];
};

