'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks `prefers-reduced-motion`, same matchMedia approach as the PixelTrail
 * guard. Starts `false` on the server; landing animations only run after
 * mount, so reduced-motion users never see one start.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const query = window.matchMedia('(prefers-reduced-motion: reduce)');
    const update = () => setReduced(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);

  return reduced;
}
