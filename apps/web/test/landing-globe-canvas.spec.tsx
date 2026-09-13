import { act, render } from '@testing-library/react';
import { afterEach, describe, expect, it, jest } from '@jest/globals';

import { GLOBE_THETA, type GlobePing } from '../lib/landing/globe';
import { DEMO_CITIES } from '../lib/landing/simulated';

type Update = { phi?: number; markers?: { size: number }[] };

const mockUpdate = jest.fn<(state: Update) => void>();
const mockDestroy = jest.fn();
const mockCreateGlobe = jest.fn(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  (canvas: HTMLCanvasElement, options: Record<string, unknown>) => {
    // Like cobe: wrap the canvas in a div of its own.
    const wrap = document.createElement('div');
    canvas.parentElement?.insertBefore(wrap, canvas);
    wrap.append(canvas);
    return { update: mockUpdate, destroy: mockDestroy };
  },
);

// cobe is ESM-only and needs WebGL.
jest.mock('cobe', () => ({
  __esModule: true,
  default: (canvas: HTMLCanvasElement, options: Record<string, unknown>) =>
    mockCreateGlobe(canvas, options),
}));

// Required after the mock is registered: static imports would load first.
/* eslint-disable @typescript-eslint/no-var-requires */
const { GlobeCanvas } =
  require('../components/features/landing/globe-canvas') as typeof import('../components/features/landing/globe-canvas');
/* eslint-enable @typescript-eslint/no-var-requires */

const MANILA = DEMO_CITIES.find((c) => c.name === 'Manila')!;
const manilaIndex = DEMO_CITIES.indexOf(MANILA);

afterEach(() => {
  jest.useRealTimers();
  mockUpdate.mockClear();
  mockDestroy.mockClear();
  mockCreateGlobe.mockClear();
});

const frames = (ms: number) =>
  act(() => {
    jest.advanceTimersByTime(ms);
  });

describe('GlobeCanvas', () => {
  it('creates one globe with a capped pixel ratio and destroys it on unmount', () => {
    const dpr = window.devicePixelRatio;
    window.devicePixelRatio = 3;
    const { container, unmount } = render(
      <GlobeCanvas ping={null} nudge={null} active={false} reduced={false} />,
    );
    window.devicePixelRatio = dpr;

    expect(mockCreateGlobe).toHaveBeenCalledTimes(1);
    expect(mockCreateGlobe.mock.calls[0]?.[1]).toMatchObject({
      devicePixelRatio: 2,
      theta: GLOBE_THETA,
      markerColor: [0, 1, 0x41 / 255],
    });
    expect(container.querySelector('canvas')).toBeTruthy();

    // cobe's wrapper sits in a node React doesn't own, so unmounting is clean.
    expect(() => unmount()).not.toThrow();
    expect(mockDestroy).toHaveBeenCalledTimes(1);
  });

  it('spins while active and stops when off-screen', () => {
    jest.useFakeTimers();
    const { rerender, unmount } = render(
      <GlobeCanvas ping={null} nudge={null} active reduced={false} />,
    );
    frames(200);
    const phis = mockUpdate.mock.calls.map(([s]) => s.phi);
    expect(phis.length).toBeGreaterThan(3);
    expect(phis[phis.length - 1]).not.toBe(phis[0]);

    rerender(
      <GlobeCanvas ping={null} nudge={null} active={false} reduced={false} />,
    );
    mockUpdate.mockClear();
    frames(500);
    expect(mockUpdate).not.toHaveBeenCalled();
    unmount();
  });

  it('swells the pinged city marker', () => {
    jest.useFakeTimers();
    const ping: GlobePing = { id: 1, city: MANILA, focus: true };
    const { unmount } = render(
      <GlobeCanvas ping={ping} nudge={null} active reduced={false} />,
    );
    frames(400);
    const sizes = mockUpdate.mock.calls
      .map(([s]) => s.markers?.[manilaIndex]?.size ?? 0)
      .filter(Boolean);
    const others = mockUpdate.mock.calls
      .map(([s]) => s.markers?.[(manilaIndex + 1) % DEMO_CITIES.length]?.size)
      .filter(Boolean);
    expect(Math.max(...sizes)).toBeGreaterThan(
      Math.max(...(others as number[])),
    );
    unmount();
  });

  it('holds still with reduced motion until nudged', () => {
    jest.useFakeTimers();
    const { rerender, unmount } = render(
      <GlobeCanvas ping={null} nudge={null} active reduced />,
    );
    // Past the warm-up, nothing moves on its own.
    frames(1000);
    mockUpdate.mockClear();
    frames(500);
    expect(mockUpdate).not.toHaveBeenCalled();

    rerender(
      <GlobeCanvas
        ping={null}
        nudge={{ id: 1, direction: 1 }}
        active
        reduced
      />,
    );
    frames(100);
    expect(mockUpdate).toHaveBeenCalledTimes(1);
    unmount();
  });
});
