'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';

import type { PixelTrailProps } from './PixelTrailCanvas';

// The heavy three.js / R3F canvas is code-split and only fetched once the
// guard below passes — so mobile, touch, and reduced-motion users never
// download three.js at all (zero bundle + zero GPU cost for them).
const PixelTrailCanvas = dynamic(() => import('./PixelTrailCanvas'), {
  ssr: false,
});

export default function PixelTrail(props: PixelTrailProps) {
  // Desktop-only: a mouse (fine pointer) and motion allowed.
  const [enabled, setEnabled] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const fine = window.matchMedia('(pointer: fine)');
    const noMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    const evaluate = () => setEnabled(fine.matches && !noMotion.matches);
    evaluate();
    fine.addEventListener('change', evaluate);
    noMotion.addEventListener('change', evaluate);
    return () => {
      fine.removeEventListener('change', evaluate);
      noMotion.removeEventListener('change', evaluate);
    };
  }, []);

  if (!enabled) return null;

  return <PixelTrailCanvas {...props} />;
}
