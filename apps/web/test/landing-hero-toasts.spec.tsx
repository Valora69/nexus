import { act, render } from '@testing-library/react';
import {
  afterEach,
  beforeEach,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';

import { HeroToasts } from '../components/features/landing/hero-toasts';

// jsdom has no IntersectionObserver, so `useInView` treats the island as in
// view on mount; only prefers-reduced-motion needs stubbing.
function mockReducedMotion(matches: boolean) {
  Object.defineProperty(window, 'matchMedia', {
    configurable: true,
    writable: true,
    value: (query: string) => ({
      matches,
      media: query,
      addEventListener: () => {},
      removeEventListener: () => {},
    }),
  });
}

function visibleCount(container: HTMLElement) {
  return container.querySelectorAll('.opacity-100').length;
}

describe('HeroToasts', () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('renders the toast copy before any reveal', () => {
    mockReducedMotion(false);
    const { container } = render(<HeroToasts />);

    expect(container.textContent).toContain('New Expense Added');
    expect(container.textContent).toContain('Payment Sent');
    expect(container.textContent).toContain('Split Confirmed');
    expect(visibleCount(container)).toBe(0);
  });

  it('reveals the toasts 600ms apart and plays once', () => {
    mockReducedMotion(false);
    const { container } = render(<HeroToasts />);

    act(() => jest.advanceTimersByTime(300));
    expect(visibleCount(container)).toBe(1);
    act(() => jest.advanceTimersByTime(600));
    expect(visibleCount(container)).toBe(2);
    act(() => jest.advanceTimersByTime(600));
    expect(visibleCount(container)).toBe(3);

    expect(jest.getTimerCount()).toBe(0);
    act(() => jest.advanceTimersByTime(10_000));
    expect(visibleCount(container)).toBe(3);
  });

  it('shows every toast immediately with reduced motion', () => {
    mockReducedMotion(true);
    const { container } = render(<HeroToasts />);

    expect(visibleCount(container)).toBe(3);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('clears pending timers on unmount', () => {
    mockReducedMotion(false);
    const { unmount } = render(<HeroToasts />);

    expect(jest.getTimerCount()).toBe(3);
    unmount();
    expect(jest.getTimerCount()).toBe(0);
  });
});
