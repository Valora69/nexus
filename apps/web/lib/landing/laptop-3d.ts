// Shared numbers for the 3D hero laptop. One world unit is 100 CSS pixels of
// the CSS laptop (its screen is 698px = 6.98 units wide), and the model is
// scaled so its screen is exactly that wide too.

const deg = (degrees: number) => (degrees * Math.PI) / 180;

/** The laptop model (processed: named parts, no brand marks, compressed). */
export const MODEL_URL = '/models/hero-laptop.glb';

/**
 * Measured from the model file. Its scene is in metres with +Y up and +Z to
 * the front; its parts are named `Base`, `Lid` and `Screen`.
 */
export const MODEL = {
  /** Metres to world units: makes the 30.08cm screen 6.98 units wide. */
  scale: 6.98 / 0.30076,
  /** A point on the hinge axis (which runs along X), in metres. */
  hinge: [0, -0.00075, -0.10781] as [number, number, number],
  /** The lid's opening as modelled. */
  lidAngle: deg(110),
} as const;

/**
 * The model's size in world units, with the hinge at the origin and the lid
 * stood upright. Used for the shadow and to frame the camera.
 */
export const LAPTOP_SIZE = {
  width: 7.234,
  baseTop: 0.1,
  baseBottom: -0.2,
  baseFront: 5.066,
  /** Hinge to the lid's top edge. */
  lidLength: 5.056,
} as const;

/**
 * The live screen's DOM size in CSS px: the model's glass (698×453.9), and
 * the CSS laptop's screen, so both laptops lay it out the same.
 */
export const SCREEN_PX = { width: 698, height: 454 } as const;

/** The model's screen in world units, with the lid stood upright. */
export const SCREEN = {
  width: 6.98,
  height: 4.538,
  center: [0, 2.658, -0.108] as [number, number, number],
} as const;

/**
 * drei `Html transform` draws one DOM px as `distanceFactor / 400` world
 * units, so this makes the 698px screen exactly as wide as the model's.
 */
export const SCREEN_DISTANCE_FACTOR = (400 * SCREEN.width) / SCREEN_PX.width;

/**
 * The laptop seen straight on, in CSS px (measured from the model, lid
 * upright, looking level with the keyboard deck). The CSS laptop draws exactly
 * this, and the 3D laptop's first frame shows exactly this, so the swap
 * between them changes nothing.
 */
export const FRONT_VIEW = {
  /** Lid and base: the same width. */
  width: 723.4,
  /** Lid top to the base's top edge (the rest of the lid is behind it). */
  lidHeight: 495.5,
  lidRadius: 20,
  /** The lid's aluminium rim, top and sides. */
  rim: 4.6,
  /** Lid top to the screen, and the sides to the screen. */
  bezel: 12.7,
  /** Lid top to the bottom of the black glass; a dark strip runs below it. */
  glassBottom: 474.7,
  /** The base's front face. */
  baseHeight: 24.2,
  /** The bottom plate's edge just below it, inset from each end. */
  plate: { inset: 7.2, height: 1.7 },
  /** The thumb scoop in the middle of the base's front edge. */
  scoop: { width: 126.4, depth: 9 },
} as const;

/**
 * The scene is drawn this many times larger than the units here, so one
 * scene unit is one CSS px of the CSS laptop. drei's `Html transform`
 * magnifies sub-pixel rounding by the px drawn per scene unit: at ~90 px per
 * unit, Chrome's rounding of the screen's layer drew it ~12px off its glass
 * (and off the CSS laptop's screen at the swap). At ~1 px per unit the error
 * stays under a pixel.
 */
export const WORLD_SCALE = 100;

export type LaptopPose = {
  /** Turn about the vertical axis; positive faces the screen right. */
  yaw: number;
  /** Lean about the side-to-side axis; positive tips the top toward you. */
  pitch: number;
  /** Lid opening from closed (0) through upright (π/2). */
  lidAngle: number;
  /** How far the camera has orbited up over the laptop, as an angle. */
  elevation: number;
  /** Sideways shift in world units; negative moves it left, off the edge. */
  x: number;
  /** Vertical shift in world units; positive moves it up. */
  y: number;
  /** Camera distance as a multiple of `cameraDistance(fov)`; above 1 is smaller. */
  zoom: number;
  /** The camera's vertical field of view, in degrees. */
  fov: number;
};

// A longer lens than a phone camera, like a product shot: the near edge of
// the base doesn't balloon, so the laptop stays inside the reserved box.
export const CAMERA_FOV = 20;

/**
 * Front-on the camera starts almost flat (a very long lens, far away), so the
 * 3D laptop draws like the CSS laptop's flat drawing: at 20° the base, 5 units
 * nearer the camera than the lid, looked ~20% wider than the lid. While it
 * settles the lens widens to `CAMERA_FOV` and the camera moves in to match,
 * so the screen keeps its size.
 */
export const FRONT_FOV = 0.5;

/**
 * Front-on, the pose the 3D laptop first appears in: it matches the CSS
 * laptop's `FRONT_VIEW` exactly, so the swap doesn't show.
 */
export const FRONT_POSE: LaptopPose = {
  yaw: 0,
  pitch: 0,
  lidAngle: deg(90),
  elevation: 0,
  x: 0,
  y: 0,
  zoom: 1,
  fov: FRONT_FOV,
};

/**
 * Where it settles: lid back a little, turned toward the headline, seen from
 * a little above. Turned, the laptop is wider than it is front-on, so the
 * camera pulls back (the screen ends up ~81% of the CSS laptop's) to keep the
 * whole thing inside the reserved box: the base clear of the headline on the
 * right, the ledger clear of the page edge on the left, the lid's top level
 * with the CSS lid's.
 */
export const REST_POSE: LaptopPose = {
  yaw: deg(10),
  pitch: 0,
  lidAngle: deg(105),
  elevation: deg(12),
  x: -0.45,
  y: 1.05,
  zoom: 1.25,
  fov: CAMERA_FOV,
};

/** The hero's reserved box, in world units: the CSS laptop's `FRONT_VIEW`. */
const BOX = {
  width: FRONT_VIEW.width / 100,
  height: (FRONT_VIEW.lidHeight + FRONT_VIEW.baseHeight) / 100,
} as const;

/** Where the CSS laptop's screen starts inside the box: its bezel. */
const CSS_SCREEN_INSET = FRONT_VIEW.bezel / 100;

/**
 * The camera sits level with the keyboard deck, so front-on the deck is seen
 * edge-on, like the CSS laptop's flat base.
 */
const CAMERA_HEIGHT = LAPTOP_SIZE.baseTop;

/** Camera axis, measured down from the box's top edge. */
const AXIS_FROM_TOP =
  CSS_SCREEN_INSET + (SCREEN.center[1] + SCREEN.height / 2 - CAMERA_HEIGHT);

const TOP_BLEED = 0.05;

/** Half the canvas height, in world units at the screen's distance. */
const HALF_VIEW = AXIS_FROM_TOP + TOP_BLEED * BOX.height;

/**
 * How far the canvas reaches past the hero's reserved box, as fractions of
 * the box: a little above (for the lid's top edge), to the left (off the page
 * edge) and below, where the canvas centre has to drop to the camera's
 * height. Never to the right, where the headline and Get Started live.
 */
export const CANVAS_BLEED = {
  top: TOP_BLEED,
  left: 0.18,
  bottom: (AXIS_FROM_TOP + HALF_VIEW - BOX.height) / BOX.height,
} as const;

/**
 * Camera distance that draws the upright screen at the CSS screen's size for
 * a field of view (degrees): the canvas height, in world units at the screen,
 * fills the view.
 */
export function cameraDistance(fov: number): number {
  return HALF_VIEW / Math.tan(deg(fov) / 2) + SCREEN.center[2];
}

/**
 * The point the camera orbits and looks at. Front-on this puts the screen
 * exactly over the CSS laptop's: right of the canvas centre by half the left
 * bleed, at the camera's height.
 */
export const CAMERA_TARGET: [number, number, number] = [
  -(CANVAS_BLEED.left / 2) * BOX.width,
  CAMERA_HEIGHT,
  0,
];

/** Cross-fade from the CSS laptop to the 3D one. */
export const LAPTOP_FADE_MS = 500;

/** Ease from the front-on pose into the resting pose, after the fade. */
export const LAPTOP_SETTLE_MS = 1400;

/**
 * Longest frame step the animations take, in seconds: after a pause (hero
 * off-screen, tab hidden) motion resumes where it stopped instead of jumping.
 */
export const MAX_FRAME_STEP = 1 / 20;

/**
 * The landing page's reveal curve, `cubic-bezier(0.22, 1, 0.36, 1)`, as a
 * function of progress 0–1 (solved per call; the page runs it once a frame).
 */
export function easeReveal(progress: number): number {
  const t = Math.min(Math.max(progress, 0), 1);
  if (t === 0 || t === 1) return t;
  const [x1, y1, x2, y2] = [0.22, 1, 0.36, 1];
  const bezier = (s: number, a: number, b: number) =>
    3 * a * s * (1 - s) ** 2 + 3 * b * s ** 2 * (1 - s) + s ** 3;
  // Find the curve parameter whose x is `t` (x(s) only rises, so bisection
  // always converges), then read off its y.
  let low = 0;
  let high = 1;
  for (let i = 0; i < 24; i += 1) {
    const mid = (low + high) / 2;
    if (bezier(mid, x1, x2) < t) low = mid;
    else high = mid;
  }
  return bezier((low + high) / 2, y1, y2);
}

/** Blends two poses: `t` 0 is `from`, 1 is `to`. Writes into `out`. */
export function lerpPose(
  from: LaptopPose,
  to: LaptopPose,
  t: number,
  out: LaptopPose = { ...from },
): LaptopPose {
  for (const key of Object.keys(from) as (keyof LaptopPose)[]) {
    out[key] = from[key] + (to[key] - from[key]) * t;
  }
  return out;
}

const clamp = (value: number, min: number, max: number) =>
  Math.min(Math.max(value, min), max);

/**
 * How far the cursor can turn and lean the laptop. Turning right is capped
 * low: it swings the base's front corner toward the headline, and the
 * resting pose already reaches the box's right edge. Turning left only
 * pushes it further off the page edge.
 */
export const TILT_LIMITS = {
  left: deg(8),
  right: deg(3),
  pitch: deg(4),
} as const;

/**
 * How far a drag can turn and lean it: left until the screen is nearly side
 * on (it never faces away), right only as far as the tilt.
 */
export const DRAG_LIMITS = {
  left: 0.5,
  right: deg(3),
  pitch: 0.15,
} as const;

/** Radians of turn per pixel dragged. */
export const DRAG_RADIANS_PER_PX = 0.005;

/** Idle float: a slow bob, in world units and radians per second. */
export const FLOAT = { height: 0.05, speed: 0.9 } as const;

/** Follow speeds for `MathUtils.damp`: snappy while dragged, soft otherwise. */
export const TILT_DAMPING = { follow: 5, drag: 14 } as const;

export type Tilt = { turn: number; lean: number };

/**
 * Where the cursor is relative to the laptop, each axis -1 to 1. Left and
 * right are scaled separately, so the page edge and the far side of the
 * headline both count as full turns, wherever the laptop sits.
 */
export function pointerOffset(
  pointer: { x: number; y: number },
  center: { x: number; y: number },
  viewport: { width: number; height: number },
): { x: number; y: number } {
  const dx = pointer.x - center.x;
  const dy = pointer.y - center.y;
  const span = (before: number, after: number, d: number) =>
    d < 0 ? before : after;
  return {
    x: clamp(
      dx / Math.max(1, span(center.x, viewport.width - center.x, dx)),
      -1,
      1,
    ),
    y: clamp(
      dy / Math.max(1, span(center.y, viewport.height - center.y, dy)),
      -1,
      1,
    ),
  };
}

/** The turn and lean that face the laptop toward the cursor. */
export function cursorTilt(offset: { x: number; y: number }): Tilt {
  const x = clamp(offset.x, -1, 1);
  return {
    turn: x * (x < 0 ? TILT_LIMITS.left : TILT_LIMITS.right),
    lean: clamp(offset.y, -1, 1) * TILT_LIMITS.pitch,
  };
}

/**
 * Which drag limit each axis sits on: -1 (turned left, leaning back), 1
 * (turned right, leaning forward) or 0 (neither). `dragTilt` clamps to the
 * exact limit values, so the comparisons are exact.
 */
export function dragLimitsHit(tilt: Tilt): { turn: number; lean: number } {
  const side = (value: number, min: number, max: number) =>
    value <= min ? -1 : value >= max ? 1 : 0;
  return {
    turn: side(tilt.turn, -DRAG_LIMITS.left, DRAG_LIMITS.right),
    lean: side(tilt.lean, -DRAG_LIMITS.pitch, DRAG_LIMITS.pitch),
  };
}

/**
 * True when a drag step pushes an axis onto a limit it wasn't on: the moment
 * the laptop ticks, like a dial clicking against its stop.
 */
export function reachesDragLimit(before: Tilt, after: Tilt): boolean {
  const was = dragLimitsHit(before);
  const now = dragLimitsHit(after);
  return (
    (now.turn !== 0 && now.turn !== was.turn) ||
    (now.lean !== 0 && now.lean !== was.lean)
  );
}

/**
 * The Q key on the model's keyboard, in the model's metres (measured from the
 * model file): the centre of its keycap's top face and the keycap's width
 * (along X) and depth (along Z).
 */
export const MODEL_Q_KEY = {
  center: [-0.1, 0.0035, -0.0457] as [number, number, number],
  size: [0.0179, 0.0165] as [number, number],
} as const;

/** How long the laptop's Q key glows after a press of the Q keycap. */
export const KEY_GLOW_MS = 700;

/** The Q key's glow `elapsedMs` after a press: 1 at the press, easing to 0. */
export function keyGlow(elapsedMs: number): number {
  const t = clamp(elapsedMs / KEY_GLOW_MS, 0, 1);
  return (1 - t) ** 2;
}

/** The turn and lean for a drag of (dx, dy) px from where it started. */
export function dragTilt(start: Tilt, dx: number, dy: number): Tilt {
  return {
    turn: clamp(
      start.turn + dx * DRAG_RADIANS_PER_PX,
      -DRAG_LIMITS.left,
      DRAG_LIMITS.right,
    ),
    lean: clamp(
      start.lean + dy * DRAG_RADIANS_PER_PX,
      -DRAG_LIMITS.pitch,
      DRAG_LIMITS.pitch,
    ),
  };
}
