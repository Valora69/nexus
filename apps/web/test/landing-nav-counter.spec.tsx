import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import {
  DemoActivityProvider,
  useDemoActivity,
} from '../components/features/landing/demo-activity-provider';
import {
  COUNTER_BASE,
  createDemoRng,
  nextCounterStep,
} from '../lib/landing/simulated';

// @number-flow/react pulls in ESM-only packages Jest can't load; render the
// formatted value as plain text instead.
jest.mock('@number-flow/react', () => {
  const { createElement } = jest.requireActual<typeof import('react')>('react');
  return {
    __esModule: true,
    default: ({
      value,
      locales,
      format,
    }: {
      value: number;
      locales?: string;
      format?: Intl.NumberFormatOptions;
    }) =>
      createElement(
        'span',
        null,
        new Intl.NumberFormat(locales, format).format(value),
      ),
  };
});

// Required after the mock is registered: static imports would load first.
/* eslint-disable @typescript-eslint/no-var-requires */
const { COUNTER_TICK_MS, NavCounter } =
  require('../components/features/landing/nav-counter') as typeof import('../components/features/landing/nav-counter');
/* eslint-enable @typescript-eslint/no-var-requires */

const peso = (n: number) => new Intl.NumberFormat('en-PH').format(n);

function renderCounter() {
  let activity: ReturnType<typeof useDemoActivity> | null = null;
  function Grab() {
    activity = useDemoActivity();
    return null;
  }
  render(
    <DemoActivityProvider>
      <Grab />
      <NavCounter />
    </DemoActivityProvider>,
  );
  return { activity: () => activity! };
}

const counterText = () =>
  document.querySelector<HTMLElement>('[data-nav-counter]')!.textContent;

function setVisibility(state: DocumentVisibilityState) {
  Object.defineProperty(document, 'visibilityState', {
    configurable: true,
    get: () => state,
  });
  document.dispatchEvent(new Event('visibilitychange'));
}

afterEach(() => {
  jest.useRealTimers();
  setVisibility('visible');
});

describe('NavCounter', () => {
  it('starts at the base and is labeled demo', () => {
    renderCounter();
    expect(counterText()).toContain(`₱ ${peso(COUNTER_BASE)}split`);
    expect(counterText()).toContain('demo');
  });

  it('ticks on a timer while the tab is visible', () => {
    jest.useFakeTimers();
    renderCounter();
    const rng = createDemoRng();
    const first = COUNTER_BASE + nextCounterStep(rng);

    act(() => {
      jest.advanceTimersByTime(COUNTER_TICK_MS);
    });
    expect(counterText()).toContain(peso(first));

    act(() => {
      setVisibility('hidden');
      jest.advanceTimersByTime(COUNTER_TICK_MS * 3);
    });
    expect(counterText()).toContain(peso(first));

    act(() => {
      setVisibility('visible');
      jest.advanceTimersByTime(COUNTER_TICK_MS);
    });
    expect(counterText()).toContain(peso(first + nextCounterStep(rng)));
  });

  it('jumps when an expense is added or a payment is sent', () => {
    const { activity } = renderCounter();
    act(() => {
      activity().expenseAdded(1200);
    });
    expect(counterText()).toContain(peso(COUNTER_BASE + 1200));
    act(() => {
      activity().paymentSent(400);
    });
    expect(counterText()).toContain(peso(COUNTER_BASE + 1600));
  });
});
