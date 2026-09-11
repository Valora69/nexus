'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';

interface SearchParamListenerProps {
  name: string;
  onChange: (value: string | null) => void;
}

function Listener({ name, onChange }: SearchParamListenerProps) {
  const value = useSearchParams()?.get(name) ?? null;
  // Latest callback without re-firing the effect when its identity changes.
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  useEffect(() => {
    onChangeRef.current(value);
  }, [value]);

  return null;
}

/**
 * Reports a query param to a client page (deep links from notifications,
 * e.g. `?verify=<paymentId>`). Wrapped in Suspense because Next 14 requires
 * it for useSearchParams on statically rendered pages.
 */
export function SearchParamListener(props: SearchParamListenerProps) {
  return (
    <Suspense fallback={null}>
      <Listener {...props} />
    </Suspense>
  );
}
