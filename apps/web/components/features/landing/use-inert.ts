'use client';

import { useEffect, useRef } from 'react';

/**
 * Makes an element inert (no focus, clicks or find-in-page) while `inert` is
 * true. React 18 doesn't know the attribute, so it's set on the node.
 */
export function useInert<T extends HTMLElement>(inert: boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (ref.current) ref.current.inert = inert;
  }, [inert]);

  return ref;
}
