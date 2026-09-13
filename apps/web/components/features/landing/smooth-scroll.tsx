'use client';

import { useEffect } from 'react';
import type Lenis from 'lenis';
import { ReactLenis, useLenis } from 'lenis/react';

type SmoothScrollProps = {
  onReady: (lenis: Lenis | null) => void;
};

/**
 * Root Lenis instance for the sideways track. Lenis ships ESM only, so the
 * shell loads this module with `next/dynamic` (ssr:false) and only in track
 * mode; jsdom and small screens never import it. ReactLenis destroys its
 * instance (and its rAF loop) on unmount.
 */
export function SmoothScroll({ onReady }: SmoothScrollProps) {
  return (
    <ReactLenis
      root
      // 'both' turns sideways trackpad swipes into track movement too.
      options={{ lerp: 0.1, gestureOrientation: 'both', autoRaf: true }}
    >
      <LenisBridge onReady={onReady} />
    </ReactLenis>
  );
}

function LenisBridge({ onReady }: SmoothScrollProps) {
  const lenis = useLenis();

  useEffect(() => {
    if (!lenis) return;
    onReady(lenis);
    return () => onReady(null);
  }, [lenis, onReady]);

  return null;
}
