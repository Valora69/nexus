'use client';

import { useEffect, useState } from 'react';

/**
 * Tracks a CSS media query. Starts `false` on the server and in jsdom (no
 * `matchMedia`), so anything gated on it only appears after mount.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const list = window.matchMedia(query);
    const update = () => setMatches(list.matches);
    update();
    list.addEventListener('change', update);
    return () => list.removeEventListener('change', update);
  }, [query]);

  return matches;
}
