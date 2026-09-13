'use client';

import { useEffect, useRef, useState } from 'react';

type UseInViewOptions = {
  /** Stay `true` after the first intersection and stop observing. */
  once?: boolean;
  threshold?: number;
  rootMargin?: string;
};

export function useInView<T extends Element>({
  once = false,
  threshold = 0,
  rootMargin = '0px',
}: UseInViewOptions = {}) {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    // Old browsers / test environments: treat as visible so content shows.
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry) return;
        if (entry.isIntersecting) {
          setInView(true);
          if (once) observer.disconnect();
        } else if (!once) {
          setInView(false);
        }
      },
      { threshold, rootMargin },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [once, threshold, rootMargin]);

  return { ref, inView };
}
