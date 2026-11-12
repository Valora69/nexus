import {
  act,
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
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

import { DemoActivityProvider } from '../components/features/landing/demo-activity-provider';
import { TRACK_MEDIA_QUERY } from '../components/features/landing/landing-shell';
import {
  CAMERA_FOV,
  DRAG_LIMITS,
  DRAG_RADIANS_PER_PX,
  FRONT_POSE,
  FRONT_VIEW,
  KEY_GLOW_MS,
  LAPTOP_FADE_MS,
  LAPTOP_SIZE,
  REST_POSE,
  SCREEN,
  SCREEN_DISTANCE_FACTOR,
  SCREEN_PX,
  TILT_LIMITS,
  cameraDistance,
  cursorTilt,
  dragTilt,
  easeReveal,
  keyGlow,
  lerpPose,
  pointerOffset,
  reachesDragLimit,
} from '../lib/landing/laptop-3d';

type MockLaptop3DProps = {
  shown: boolean;
  settle: boolean;
  keyPresses: number;
  selected: string[];
  onReady: () => void;
  onFail: () => void;
};

// three.js never loads here: the 3D laptop is replaced by a marker that
// records the props HeroStage gives it.
const mockLaptop: { props: MockLaptop3DProps | null; throws: boolean } = {
  props: null,
  throws: false,
};
jest.mock('../components/features/landing/laptop-3d', () => ({
  __esModule: true,
  default: (props: MockLaptop3DProps) => {
    mockLaptop.props = props;
    if (mockLaptop.throws) throw new Error('WebGL went away');
    return jest
      .requireActual<typeof import('react')>('react')
      .createElement('div', {
        'data-testid': 'laptop-3d',
        'data-shown': String(props.shown),
        'data-settle': String(props.settle),
      });
  },
}));

const mockCanUseWebGL = jest.fn<() => boolean>(() => true);
jest.mock('../lib/landing/webgl', () => ({
  ...jest.requireActual<object>('../lib/landing/webgl'),
  canUseWebGL: () => mockCanUseWebGL(),
}));

// Required after the mocks are registered: static imports would load first
// and get the real WebGL probe.
/* eslint-disable @typescript-eslint/no-var-requires */
const { HeroStage } =
  require('../components/features/landing/hero-stage') as typeof import('../components/features/landing/hero-stage');
/* eslint-enable @typescript-eslint/no-var-requires */

const { isSoftwareRenderer } = jest.requireActual<
  typeof import('../lib/landing/webgl')
>('../lib/landing/webgl');

function stubMatchMedia(matches: boolean) {
  window.matchMedia = jest.fn(() => ({
    matches,
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    addListener: jest.fn(),
    removeListener: jest.fn(),
  })) as unknown as typeof window.matchMedia;
}

function renderStage() {
  return render(
    <DemoActivityProvider>
      <HeroStage />
    </DemoActivityProvider>,
  );
}

/** The CSS laptop: the only one that renders the screen in these tests. */
const cssLedger = (hidden = false) =>
  screen.queryByRole('region', { name: 'Group ledger', hidden });
const chip = (name: string) =>
  within(screen.getByRole('group', { name: 'Split with Members' })).getByRole(
    'button',
    { name },
  );
const coinKey = () =>
  screen.getByRole('button', { name: 'Add a demo expense' });

/** Desktop with a GPU: the 3D laptop mounts (lazily, like in the browser). */
async function renderDesktop() {
  stubMatchMedia(true);
  mockCanUseWebGL.mockReturnValue(true);
  renderStage();
  return screen.findByTestId('laptop-3d');
}

/** Lets the 3D laptop report ready and the cross-fade finish. */
function finishSwap() {
  jest.useFakeTimers();
  act(() => mockLaptop.props!.onReady());
  act(() => {
    jest.advanceTimersByTime(LAPTOP_FADE_MS);
  });
}

beforeAll(() => {
  MotionGlobalConfig.skipAnimations = true;
});

afterAll(() => {
  MotionGlobalConfig.skipAnimations = false;
});

afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
  mockCanUseWebGL.mockClear();
  mockLaptop.props = null;
  mockLaptop.throws = false;
  delete (window as { matchMedia?: unknown }).matchMedia;
});

describe('HeroStage laptop', () => {
  it('keeps the CSS laptop where matchMedia is unavailable (server, jsdom)', async () => {
    renderStage();
    await act(async () => {});

    expect(cssLedger()).toBeTruthy();
    expect(screen.queryByTestId('laptop-3d')).toBeNull();
    expect(mockCanUseWebGL).not.toHaveBeenCalled();
  });

  it('keeps the CSS laptop on phones, tablets and for reduced motion', async () => {
    stubMatchMedia(false);
    renderStage();
    await act(async () => {});

    expect(window.matchMedia).toHaveBeenCalledWith(TRACK_MEDIA_QUERY);
    expect(cssLedger()).toBeTruthy();
    expect(screen.queryByTestId('laptop-3d')).toBeNull();
    // The WebGL probe only runs on desktop.
    expect(mockCanUseWebGL).not.toHaveBeenCalled();
  });

  it('keeps the CSS laptop when WebGL is missing or would run on the CPU', async () => {
    stubMatchMedia(true);
    mockCanUseWebGL.mockReturnValue(false);
    renderStage();
    await act(async () => {});

    expect(mockCanUseWebGL).toHaveBeenCalled();
    expect(cssLedger()).toBeTruthy();
    expect(screen.queryByTestId('laptop-3d')).toBeNull();
  });

  it('cross-fades to the 3D laptop once it has drawn, then drops the CSS one', async () => {
    const laptop3d = await renderDesktop();

    // Mounted hidden behind the CSS laptop until it has drawn.
    expect(laptop3d.dataset.shown).toBe('false');
    expect(laptop3d.dataset.settle).toBe('false');
    expect(cssLedger()).toBeTruthy();

    jest.useFakeTimers();
    act(() => mockLaptop.props!.onReady());

    // Fading: the CSS laptop is still there, but hidden from assistive tech.
    expect(screen.getByTestId('laptop-3d').dataset.shown).toBe('true');
    expect(cssLedger()).toBeNull();
    expect(cssLedger(true)).toBeTruthy();

    act(() => {
      jest.advanceTimersByTime(LAPTOP_FADE_MS);
    });

    // Only then does it start moving from the CSS laptop's place.
    expect(cssLedger(true)).toBeNull();
    expect(screen.getByTestId('laptop-3d').dataset.settle).toBe('true');
  });

  it("goes back to the CSS laptop with the visitor's choices when WebGL is lost", async () => {
    await renderDesktop();
    fireEvent.click(chip('Job'));
    finishSwap();

    // Both laptops show the hero's state, so nothing is lost in the swap.
    expect(mockLaptop.props!.selected).toHaveLength(4);

    act(() => mockLaptop.props!.onFail());

    expect(screen.queryByTestId('laptop-3d')).toBeNull();
    expect(cssLedger()).toBeTruthy();
    expect(chip('Job').getAttribute('aria-pressed')).toBe('false');
  });

  it('goes back to the CSS laptop if the 3D laptop throws', async () => {
    // React reports the caught error; keep the test output clean.
    jest.spyOn(console, 'error').mockImplementation(() => {});
    stubMatchMedia(true);
    mockCanUseWebGL.mockReturnValue(true);
    mockLaptop.throws = true;
    renderStage();

    await waitFor(() => expect(mockLaptop.props).not.toBeNull());
    await waitFor(() => expect(screen.queryByTestId('laptop-3d')).toBeNull());
    expect(cssLedger()).toBeTruthy();
  });

  it('counts Q keycap presses, so the 3D laptop can light its own Q key', async () => {
    await renderDesktop();
    expect(mockLaptop.props!.keyPresses).toBe(0);

    fireEvent.click(coinKey());
    expect(mockLaptop.props!.keyPresses).toBe(1);

    fireEvent.keyDown(window, { key: 'q' });
    fireEvent.keyUp(window, { key: 'q' });
    expect(mockLaptop.props!.keyPresses).toBe(2);
  });
});

describe('3D laptop helpers', () => {
  it("lays the live screen exactly on the model's glass", () => {
    const unitsPerPx = SCREEN_DISTANCE_FACTOR / 400;
    expect(SCREEN_PX.width * unitsPerPx).toBeCloseTo(SCREEN.width);
    expect(SCREEN_PX.height * unitsPerPx).toBeCloseTo(SCREEN.height, 1);
  });

  it("draws the CSS laptop to the model's front view", () => {
    // 1 world unit is 100 CSS px of the CSS laptop.
    expect(FRONT_VIEW.width).toBeCloseTo(LAPTOP_SIZE.width * 100);
    expect(FRONT_VIEW.width - 2 * FRONT_VIEW.bezel).toBeCloseTo(
      SCREEN_PX.width,
    );
    // Lid top to the deck: the lid's length less the deck's height.
    expect(FRONT_VIEW.lidHeight).toBeCloseTo(
      (LAPTOP_SIZE.lidLength - LAPTOP_SIZE.baseTop) * 100,
      0,
    );
    // The screen sits inside the black glass, the glass inside the lid.
    expect(FRONT_VIEW.bezel + SCREEN_PX.height).toBeLessThan(
      FRONT_VIEW.glassBottom,
    );
    expect(FRONT_VIEW.glassBottom).toBeLessThan(FRONT_VIEW.lidHeight);
  });

  it('keeps the screen the same size while the lens widens', () => {
    // The screen's half-height in view: distance to it times tan(fov / 2).
    const viewAt = (fov: number) =>
      (cameraDistance(fov) - SCREEN.center[2]) *
      Math.tan((fov * Math.PI) / 360);
    expect(viewAt(FRONT_POSE.fov)).toBeCloseTo(viewAt(REST_POSE.fov));
    expect(cameraDistance(FRONT_POSE.fov)).toBeGreaterThan(
      cameraDistance(REST_POSE.fov),
    );
  });

  it('starts front-on and nearly flat, and rests turned toward the headline, lid back', () => {
    expect(FRONT_POSE).toMatchObject({ yaw: 0, pitch: 0, x: 0, y: 0, zoom: 1 });
    expect(FRONT_POSE.lidAngle).toBeCloseTo(Math.PI / 2);
    expect(FRONT_POSE.fov).toBeLessThan(1);
    expect(REST_POSE.fov).toBe(CAMERA_FOV);
    expect(REST_POSE.yaw).toBeGreaterThan(0);
    expect(REST_POSE.lidAngle).toBeGreaterThan(FRONT_POSE.lidAngle);
    expect(REST_POSE.elevation).toBeGreaterThan(0);
  });

  it('eases the move along the landing curve', () => {
    expect(easeReveal(0)).toBe(0);
    expect(easeReveal(1)).toBe(1);
    expect(easeReveal(-1)).toBe(0);
    expect(easeReveal(2)).toBe(1);
    // Ease-out: most of the way there by halfway.
    expect(easeReveal(0.5)).toBeGreaterThan(0.8);
    const samples = Array.from({ length: 21 }, (_, i) => easeReveal(i / 20));
    samples.slice(1).forEach((v, i) => expect(v).toBeGreaterThan(samples[i]!));
  });

  it('blends poses into the given object', () => {
    const out = { ...FRONT_POSE };
    expect(lerpPose(FRONT_POSE, REST_POSE, 0, out)).toEqual(FRONT_POSE);
    expect(lerpPose(FRONT_POSE, REST_POSE, 1, out)).toEqual(REST_POSE);
    const half = lerpPose(FRONT_POSE, REST_POSE, 0.5, out);
    expect(half).toBe(out);
    expect(half.yaw).toBeCloseTo(REST_POSE.yaw / 2);
    expect(half.zoom).toBeCloseTo((FRONT_POSE.zoom + REST_POSE.zoom) / 2);
  });

  it('measures the cursor from the laptop, each side to its own edge', () => {
    const viewport = { width: 1000, height: 800 };
    const center = { x: 200, y: 400 };
    expect(pointerOffset(center, center, viewport)).toEqual({ x: 0, y: 0 });
    expect(pointerOffset({ x: 0, y: 0 }, center, viewport)).toEqual({
      x: -1,
      y: -1,
    });
    // 400px right of a laptop that has 800px of room on its right.
    expect(pointerOffset({ x: 600, y: 400 }, center, viewport).x).toBe(0.5);
    expect(pointerOffset({ x: 5000, y: 5000 }, center, viewport)).toEqual({
      x: 1,
      y: 1,
    });
  });

  it('turns toward the cursor, less to the right than to the left', () => {
    expect(cursorTilt({ x: -1, y: 0 }).turn).toBeCloseTo(-TILT_LIMITS.left);
    expect(cursorTilt({ x: 1, y: 0 }).turn).toBeCloseTo(TILT_LIMITS.right);
    expect(cursorTilt({ x: 0, y: -2 }).lean).toBeCloseTo(-TILT_LIMITS.pitch);
    expect(TILT_LIMITS.right).toBeLessThan(TILT_LIMITS.left);
  });

  it('turns with a drag and stops at its limits', () => {
    const start = { turn: 0, lean: 0 };
    expect(dragTilt(start, -10, 0).turn).toBeCloseTo(-10 * DRAG_RADIANS_PER_PX);
    expect(dragTilt(start, -10_000, 0).turn).toBe(-DRAG_LIMITS.left);
    expect(dragTilt(start, 10_000, 0).turn).toBe(DRAG_LIMITS.right);
    expect(dragTilt(start, 0, 10_000).lean).toBe(DRAG_LIMITS.pitch);
  });

  it('ticks once when a drag reaches a limit', () => {
    const start = { turn: 0, lean: 0 };
    const near = dragTilt(start, -50, 0);
    const atLeft = dragTilt(start, -10_000, 0);
    const pastLeft = dragTilt(start, -20_000, 0);
    const atLeftAndTop = dragTilt(start, -10_000, -10_000);

    expect(reachesDragLimit(start, near)).toBe(false);
    expect(reachesDragLimit(near, atLeft)).toBe(true);
    // Held against the stop: no more ticks.
    expect(reachesDragLimit(atLeft, pastLeft)).toBe(false);
    // A second axis reaching its own stop ticks again.
    expect(reachesDragLimit(atLeft, atLeftAndTop)).toBe(true);
    // Back off and push again: another tick.
    expect(reachesDragLimit(near, pastLeft)).toBe(true);
  });

  it("fades the Q key's glow out after a press", () => {
    expect(keyGlow(0)).toBe(1);
    expect(keyGlow(KEY_GLOW_MS / 2)).toBeGreaterThan(0);
    expect(keyGlow(KEY_GLOW_MS / 2)).toBeLessThan(0.5);
    expect(keyGlow(KEY_GLOW_MS)).toBe(0);
    expect(keyGlow(KEY_GLOW_MS * 10)).toBe(0);
  });

  it('spots WebGL running on the CPU', () => {
    for (const renderer of [
      'Google SwiftShader',
      'ANGLE (Google, Vulkan 1.3.0 (SwiftShader Device), SwiftShader driver)',
      'llvmpipe (LLVM 15.0.7, 256 bits)',
      'Microsoft Basic Render Driver',
    ]) {
      expect(isSoftwareRenderer(renderer)).toBe(true);
    }
    expect(
      isSoftwareRenderer(
        'ANGLE (Apple, ANGLE Metal Renderer: Apple M3, Unspecified Version)',
      ),
    ).toBe(false);
  });
});
