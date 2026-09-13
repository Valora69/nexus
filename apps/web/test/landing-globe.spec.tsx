import { act, render, screen, waitFor } from '@testing-library/react';
import {
  afterAll,
  afterEach,
  beforeAll,
  describe,
  expect,
  it,
  jest,
} from '@jest/globals';
import { MotionGlobalConfig } from 'motion/react';

import {
  DemoActivityProvider,
  useDemoActivity,
} from '../components/features/landing/demo-activity-provider';
import {
  DemoGlobe,
  GLOBE_PING_MS,
  GLOBE_PING_REDUCED_MS,
} from '../components/features/landing/demo-globe';
import {
  GLOBE_THETA,
  globeDevicePixelRatio,
  phiFacing,
  projectLocation,
  shortestTurn,
  type GlobePing,
} from '../lib/landing/globe';
import { DEMO_CITIES } from '../lib/landing/simulated';

// The cobe canvas has its own spec; here we only watch the props it gets.
const mockCanvasProps: { current: { ping: GlobePing | null } | null } = {
  current: null,
};
jest.mock('../components/features/landing/globe-canvas', () => ({
  GlobeCanvas: (props: { ping: GlobePing | null }) => {
    mockCanvasProps.current = props;
    return null;
  },
}));

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});

afterAll(() => {
  MotionGlobalConfig.skipAnimations = false;
});

afterEach(() => {
  jest.useRealTimers();
  mockCanvasProps.current = null;
  delete (window as { matchMedia?: unknown }).matchMedia;
});

const MANILA = DEMO_CITIES.find((c) => c.name === 'Manila')!;

describe('globe math', () => {
  it('faces a longitude front and center', () => {
    const phi = phiFacing(MANILA.lng);
    const front = projectLocation(MANILA.lat, MANILA.lng, phi, GLOBE_THETA);
    expect(front.x).toBeCloseTo(0.5, 5);
    expect(front.visible).toBe(true);

    const back = projectLocation(
      MANILA.lat,
      MANILA.lng,
      phi + Math.PI,
      GLOBE_THETA,
    );
    expect(back.visible).toBe(false);
  });

  it('centers a latitude vertically when theta matches it', () => {
    const theta = (MANILA.lat * Math.PI) / 180;
    const point = projectLocation(
      MANILA.lat,
      MANILA.lng,
      phiFacing(MANILA.lng),
      theta,
    );
    expect(point.y).toBeCloseTo(0.5, 5);
  });

  it('takes the shortest turn and caps the pixel ratio at 2', () => {
    expect(shortestTurn(0, (3 * Math.PI) / 2)).toBeCloseTo(-Math.PI / 2);
    expect(shortestTurn(6, 0.1)).toBeCloseTo(0.1 + 2 * Math.PI - 6);
    expect(globeDevicePixelRatio(3)).toBe(2);
    expect(globeDevicePixelRatio(1.5)).toBe(1.5);
    expect(globeDevicePixelRatio(undefined)).toBe(1);
  });
});

function renderGlobe() {
  let activity: ReturnType<typeof useDemoActivity> | null = null;
  function Grab() {
    activity = useDemoActivity();
    return null;
  }
  const result = render(
    <DemoActivityProvider>
      <Grab />
      <DemoGlobe />
    </DemoActivityProvider>,
  );
  return { ...result, activity: () => activity! };
}

const caption = () =>
  document.querySelector<HTMLElement>('[data-globe-caption]')!;

describe('DemoGlobe', () => {
  it('says the pings are simulated and starts in Manila', async () => {
    renderGlobe();
    expect(
      screen.getByRole('heading', { name: 'Splits around the world.' }),
    ).toBeTruthy();
    expect(screen.getByText(/pings are simulated/)).toBeTruthy();
    expect(caption().textContent).toBe('Splits happening in Manila');
    // The lazily loaded canvas settles.
    await act(async () => {});
  });

  it('pings a new simulated city every few seconds', async () => {
    jest.useFakeTimers();
    renderGlobe();
    await act(async () => {});

    act(() => {
      jest.advanceTimersByTime(GLOBE_PING_MS);
    });
    await waitFor(() =>
      expect(caption().textContent).not.toBe(
        'Splits happening in Manila',
      ),
    );
    const ping = mockCanvasProps.current?.ping;
    expect(ping?.focus).toBe(false);
    expect(caption().textContent).toBe(
      `Splits happening in ${ping?.city.name}`,
    );
  });

  it('pings Manila right away when an expense is added', async () => {
    jest.useFakeTimers();
    const { activity } = renderGlobe();
    await act(async () => {});

    act(() => {
      jest.advanceTimersByTime(GLOBE_PING_MS);
    });
    act(() => {
      activity().expenseAdded(1200);
    });
    await waitFor(() =>
      expect(caption().textContent).toBe('Splits happening in Manila'),
    );
    expect(mockCanvasProps.current?.ping).toMatchObject({
      city: { name: 'Manila' },
      focus: true,
    });
    expect(screen.getByRole('status').textContent).toBe(
      'Your expense just showed up in Manila.',
    );
  });

  it('rotates captions slowly with reduced motion', async () => {
    window.matchMedia = jest.fn(() => ({
      matches: true,
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
    })) as unknown as typeof window.matchMedia;
    jest.useFakeTimers();
    renderGlobe();
    await act(async () => {});

    act(() => {
      jest.advanceTimersByTime(GLOBE_PING_MS);
    });
    expect(mockCanvasProps.current?.ping).toBeNull();

    act(() => {
      jest.advanceTimersByTime(GLOBE_PING_REDUCED_MS - GLOBE_PING_MS);
    });
    expect(mockCanvasProps.current?.ping?.city.name).not.toBe('Manila');
  });
});
