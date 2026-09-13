'use client';

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  type ReactNode,
} from 'react';

export type DemoActivityEvent =
  | { type: 'expenseAdded'; amount: number }
  | { type: 'paymentSent'; amount: number }
  | { type: 'quickAdded' };

export type DemoActivityListener = (event: DemoActivityEvent) => void;

type DemoActivity = {
  expenseAdded: (amount: number) => void;
  paymentSent: (amount: number) => void;
  /** One press of the hero's Q keycap (click or the Q key). */
  quickAdded: () => void;
  /** Returns an unsubscribe function. */
  subscribe: (listener: DemoActivityListener) => () => void;
};

const noop = () => {};

const DemoActivityContext = createContext<DemoActivity>({
  expenseAdded: noop,
  paymentSent: noop,
  quickAdded: noop,
  subscribe: () => noop,
});

/**
 * In-page event bus for the landing demos: toys report what the visitor did
 * (added an expense, sent a payment, pressed Quick Add) and the counter and
 * globe react.
 */
export function DemoActivityProvider({ children }: { children: ReactNode }) {
  const listeners = useRef(new Set<DemoActivityListener>());

  const value = useMemo<DemoActivity>(() => {
    const emit = (event: DemoActivityEvent) => {
      listeners.current.forEach((listener) => listener(event));
    };
    return {
      expenseAdded: (amount) => emit({ type: 'expenseAdded', amount }),
      paymentSent: (amount) => emit({ type: 'paymentSent', amount }),
      quickAdded: () => emit({ type: 'quickAdded' }),
      subscribe: (listener) => {
        listeners.current.add(listener);
        return () => {
          listeners.current.delete(listener);
        };
      },
    };
  }, []);

  return (
    <DemoActivityContext.Provider value={value}>
      {children}
    </DemoActivityContext.Provider>
  );
}

/** Emitters + subscribe. Outside a provider every call is a no-op. */
export function useDemoActivity(): DemoActivity {
  return useContext(DemoActivityContext);
}

/** Subscribes for the component's lifetime; always calls the latest listener. */
export function useDemoActivityListener(listener: DemoActivityListener) {
  const { subscribe } = useDemoActivity();
  const latest = useRef(listener);

  useEffect(() => {
    latest.current = listener;
  });

  useEffect(() => subscribe((event) => latest.current(event)), [subscribe]);
}
