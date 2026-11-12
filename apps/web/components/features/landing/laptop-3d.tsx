'use client';

import {
  Suspense,
  useCallback,
  useEffect,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import {
  Canvas,
  useFrame,
  useThree,
  type ThreeEvent,
} from '@react-three/fiber';
import { Environment, Lightformer } from '@react-three/drei';
import { LayoutGroup, MotionConfig } from 'motion/react';
import { MathUtils, type PerspectiveCamera } from 'three';

import {
  CAMERA_TARGET,
  CANVAS_BLEED,
  FLOAT,
  FRONT_POSE,
  LAPTOP_SETTLE_MS,
  MAX_FRAME_STEP,
  REST_POSE,
  TILT_DAMPING,
  WORLD_SCALE,
  cameraDistance,
  cursorTilt,
  dragTilt,
  easeReveal,
  keyGlow,
  lerpPose,
  pointerOffset,
  reachesDragLimit,
  type LaptopPose,
  type Tilt,
} from '@web/lib/landing/laptop-3d';
import { cn } from '@web/lib/utils';

import { APPLY_POSE_PRIORITY, LaptopModel } from './laptop-model';
import { LaptopScreen, type LaptopScreenProps } from './laptop-screen';
import { useLandingSound } from './sound-provider';
import { useInert } from './use-inert';

/** Advances the pose before the model applies it (see `LaptopModel`). */
const DRIVE_POSE_PRIORITY = APPLY_POSE_PRIORITY - 1;

/** Frames drawn with the model before the 3D laptop counts as ready. */
const READY_FRAMES = 2;

/** Keeps the latest callback without re-running effects that use it. */
function useLatest<T>(value: T): MutableRefObject<T> {
  const ref = useRef(value);
  useEffect(() => {
    ref.current = value;
  });
  return ref;
}

/** The framing target in the scaled scene. */
const TARGET = CAMERA_TARGET.map((v) => v * WORLD_SCALE) as [
  number,
  number,
  number,
];

/** How far the near and far planes sit either side of the target. */
const CLIP_MARGIN = 20 * WORLD_SCALE;

/**
 * Orbits the camera up over the laptop and aims it at the framing target,
 * with the pose's lens. The distance follows the lens, so the screen keeps
 * its size while the lens widens (the depth range is kept tight around the
 * laptop, so depth stays precise even when the camera is far out).
 */
function aimCamera(camera: PerspectiveCamera, pose: LaptopPose) {
  const [x, y, z] = TARGET;
  const distance = cameraDistance(pose.fov) * WORLD_SCALE * pose.zoom;
  camera.position.set(
    x,
    y + distance * Math.sin(pose.elevation),
    z + distance * Math.cos(pose.elevation),
  );
  camera.lookAt(x, y, z);
  camera.fov = pose.fov;
  camera.near = Math.max(WORLD_SCALE, distance - CLIP_MARGIN);
  camera.far = distance + CLIP_MARGIN;
  camera.updateProjectionMatrix();
}

/**
 * The canvas's side edges fade over this many px. Front-on the laptop's
 * right edge sits on the canvas's right edge, as sharp as the CSS laptop's,
 * so that fade grows in only as the laptop moves into its resting pose.
 */
const EDGE_FADE_PX = 24;

/**
 * Studio light built from in-scene light panels, so nothing is fetched: a
 * soft key above the front, a dim fill from the left and a faint neon rim
 * low behind the left edge (low, so it catches the lid's edge, not the deck).
 */
function Lights() {
  return (
    <>
      <ambientLight intensity={0.25} />
      <directionalLight position={[-3, 6, 8]} intensity={1.4} />
      <Environment resolution={256} frames={1}>
        <Lightformer
          form="rect"
          intensity={3}
          position={[0, 5, 6]}
          scale={[12, 3, 1]}
        />
        <Lightformer
          form="rect"
          intensity={1.2}
          position={[-7, 2, 2]}
          scale={[5, 5, 1]}
        />
        <Lightformer
          form="rect"
          color="#00ff41"
          intensity={1.2}
          position={[-7, 0.5, -4]}
          scale={[2, 6, 1]}
        />
      </Environment>
    </>
  );
}

type Drag = {
  pointerId: number;
  startX: number;
  startY: number;
  start: Tilt;
  tilt: Tilt;
};

/**
 * Cursor tilt and drag-to-turn. The cursor is read from `window`, not the
 * canvas, so tilting never needs the canvas to catch pointer events; a drag
 * starts only on the laptop's body (the screen is HTML above the canvas, so
 * pressing a chip never turns it) and follows the pointer anywhere until
 * it's released, then springs back. `onLimit` fires each time a drag pushes
 * it against one of its limits.
 */
function useTiltAndDrag(
  anchor: MutableRefObject<HTMLElement | null>,
  onLimit: () => void,
) {
  const canvas = useThree((state) => state.gl.domElement);
  const pointer = useRef<{ x: number; y: number } | null>(null);
  const drag = useRef<Drag | null>(null);
  const tilt = useRef<Tilt>({ turn: 0, lean: 0 });
  const onLimitRef = useLatest(onLimit);

  useEffect(() => {
    const move = (event: PointerEvent) => {
      pointer.current = { x: event.clientX, y: event.clientY };
      const active = drag.current;
      if (active && event.pointerId === active.pointerId) {
        const next = dragTilt(
          active.start,
          event.clientX - active.startX,
          event.clientY - active.startY,
        );
        if (reachesDragLimit(active.tilt, next)) onLimitRef.current();
        active.tilt = next;
      }
    };
    const release = (event: PointerEvent) => {
      if (drag.current?.pointerId !== event.pointerId) return;
      drag.current = null;
      canvas.style.cursor = '';
    };
    // Pointer left the window: settle back to centre.
    const leave = (event: PointerEvent) => {
      if (!event.relatedTarget) pointer.current = null;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', release);
    window.addEventListener('pointercancel', release);
    window.addEventListener('pointerout', leave);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('pointercancel', release);
      window.removeEventListener('pointerout', leave);
    };
  }, [canvas, onLimitRef]);

  const bodyHandlers = {
    onPointerDown: (event: ThreeEvent<PointerEvent>) => {
      if (event.button !== 0) return;
      event.stopPropagation();
      // No text selection or native drag while turning the laptop.
      event.nativeEvent.preventDefault();
      drag.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        startY: event.clientY,
        start: { ...tilt.current },
        tilt: { ...tilt.current },
      };
      canvas.style.cursor = 'grabbing';
    },
    onPointerOver: () => {
      if (!drag.current) canvas.style.cursor = 'grab';
    },
    onPointerOut: () => {
      if (!drag.current) canvas.style.cursor = '';
    },
  };

  /** Moves the tilt toward its target for this frame and returns it. */
  const step = (seconds: number): Tilt => {
    let target: Tilt = { turn: 0, lean: 0 };
    if (drag.current) {
      target = drag.current.tilt;
    } else if (pointer.current && anchor.current) {
      const box = anchor.current.getBoundingClientRect();
      target = cursorTilt(
        pointerOffset(
          pointer.current,
          { x: box.left + box.width / 2, y: box.top + box.height / 2 },
          { width: window.innerWidth, height: window.innerHeight },
        ),
      );
    }
    const lambda = drag.current ? TILT_DAMPING.drag : TILT_DAMPING.follow;
    const current = tilt.current;
    current.turn = MathUtils.damp(current.turn, target.turn, lambda, seconds);
    current.lean = MathUtils.damp(current.lean, target.lean, lambda, seconds);
    return current;
  };

  return { bodyHandlers, step };
}

type SceneProps = {
  settle: boolean;
  onReady: () => void;
  /** When the Q keycap was last pressed (`performance.now()`), if ever. */
  keyPressedAt: MutableRefObject<number | null>;
  /** A drag pushed the laptop against one of its limits. */
  onDragLimit: () => void;
  /** The hero's reserved box: the cursor tilt is measured from its centre. */
  anchor: MutableRefObject<HTMLElement | null>;
  /** Carries the canvas's `--edge-fade`. */
  fadeHost: MutableRefObject<HTMLElement | null>;
  portal: MutableRefObject<HTMLElement>;
  screen: ReactNode;
};

/**
 * Starts front-on (matching the CSS laptop), reports ready once the model has
 * drawn, and after `settle` eases into the resting pose, where the cursor
 * tilt, drag and idle float fade in. Time only advances on drawn frames, so a
 * pause off-screen resumes where it left off. The Q key's glow runs on the
 * clock instead, so a press made off-screen has faded by the time it's back.
 */
function Scene({
  settle,
  onReady,
  keyPressedAt,
  onDragLimit,
  anchor,
  fadeHost,
  portal,
  screen,
}: SceneProps) {
  const camera = useThree((state) => state.camera as PerspectiveCamera);
  const pose = useRef<LaptopPose>({ ...FRONT_POSE });
  const glow = useRef(0);
  const settledMs = useRef(0);
  const floatTime = useRef(0);
  const frames = useRef(0);
  const onReadyRef = useLatest(onReady);
  const { bodyHandlers, step } = useTiltAndDrag(anchor, onDragLimit);

  useFrame((_, delta) => {
    const seconds = Math.min(delta, MAX_FRAME_STEP);
    if (settle && settledMs.current < LAPTOP_SETTLE_MS) {
      settledMs.current = Math.min(
        LAPTOP_SETTLE_MS,
        settledMs.current + seconds * 1000,
      );
    }
    // 0 front-on (exactly over the CSS laptop) to 1 at rest.
    const settled = easeReveal(settledMs.current / LAPTOP_SETTLE_MS);
    const current = lerpPose(FRONT_POSE, REST_POSE, settled, pose.current);

    const tilt = step(seconds);
    floatTime.current += seconds;
    current.yaw += tilt.turn * settled;
    current.pitch += tilt.lean * settled;
    current.y +=
      Math.sin(floatTime.current * FLOAT.speed) * FLOAT.height * settled;

    aimCamera(camera, current);

    const fade = `${Math.round(EDGE_FADE_PX * settled)}px`;
    const host = fadeHost.current;
    if (host && host.style.getPropertyValue('--edge-fade') !== fade) {
      host.style.setProperty('--edge-fade', fade);
    }

    const pressedAt = keyPressedAt.current;
    glow.current =
      pressedAt === null ? 0 : keyGlow(performance.now() - pressedAt);

    if (frames.current < READY_FRAMES) {
      frames.current += 1;
      if (frames.current === READY_FRAMES) onReadyRef.current();
    }
  }, DRIVE_POSE_PRIORITY);

  return (
    // Drawn WORLD_SCALE times larger (the camera follows in aimCamera), so
    // drei's Html doesn't magnify sub-pixel rounding into a visible offset.
    <group scale={WORLD_SCALE}>
      <LaptopModel
        pose={pose}
        keyGlow={glow}
        portal={portal}
        screen={screen}
        bodyHandlers={bodyHandlers}
      />
    </group>
  );
}

export type Laptop3DProps = Omit<LaptopScreenProps, 'className'> & {
  /** Draw frames; false while the hero is off-screen. */
  active: boolean;
  /** Visible and interactive; until then it's transparent and inert. */
  shown: boolean;
  /** Ease from front-on into the resting pose. */
  settle: boolean;
  /** The model has loaded and drawn: safe to cross-fade to. */
  onReady: () => void;
  /** WebGL was lost; go back to the CSS laptop. */
  onFail: () => void;
  /** Q keycap presses so far: each new one lights the laptop's Q key. */
  keyPresses: number;
  className?: string;
};

/**
 * The hero laptop in 3D. Loaded with `next/dynamic` (`ssr: false`) only when
 * `useLaptop3d()` passes. The canvas fills the hero's reserved box plus
 * `CANVAS_BLEED` (never to the right); the live screen is real HTML mounted
 * into a sibling overlay, so its buttons never reach the canvas's pointer
 * handling and it stays readable by screen readers.
 */
export default function Laptop3D({
  active,
  shown,
  settle,
  onReady,
  onFail,
  keyPresses,
  className,
  ...screen
}: Laptop3DProps) {
  // Set on mount, before the canvas renders the screen into it.
  const overlayRef = useRef<HTMLDivElement>(null!);
  const rootRef = useInert<HTMLDivElement>(!shown);
  const anchorRef = useRef<HTMLElement | null>(null);
  const onFailRef = useLatest(onFail);
  const { play } = useLandingSound();
  const playNotch = useCallback(() => play('notch'), [play]);

  // Only presses made after mount light the key, not the count it starts at.
  const keyPressedAt = useRef<number | null>(null);
  const seenPresses = useRef(keyPresses);
  useEffect(() => {
    if (keyPresses === seenPresses.current) return;
    seenPresses.current = keyPresses;
    keyPressedAt.current = performance.now();
  }, [keyPresses]);

  // The reserved box this canvas bleeds out of.
  useEffect(() => {
    anchorRef.current = rootRef.current?.parentElement ?? null;
  }, [rootRef]);

  return (
    <div
      ref={rootRef}
      aria-hidden={shown ? undefined : true}
      className={cn(
        'pointer-events-none absolute right-0 transition-opacity duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]',
        shown ? 'opacity-100' : 'opacity-0',
        className,
      )}
      style={{
        top: `-${CANVAS_BLEED.top * 100}%`,
        left: `-${CANVAS_BLEED.left * 100}%`,
        bottom: `-${CANVAS_BLEED.bottom * 100}%`,
      }}
    >
      <Canvas
        aria-hidden
        dpr={[1, 2]}
        frameloop={active ? 'always' : 'never'}
        // aimCamera sets the lens and depth range every frame.
        camera={{ fov: FRONT_POSE.fov }}
        resize={{ scroll: false }}
        gl={{ failIfMajorPerformanceCaveat: true }}
        // At rest the base's front corner reaches the box's right edge, and a
        // hard drag left swings its other corner past the canvas's left edge
        // (on screen on wide windows); fade both edges so neither ends in a
        // hard cut (the right one grows in as it settles, see EDGE_FADE_PX).
        // Takes pointer events for drag; the overlay above passes them
        // through everywhere but the screen.
        className="pointer-events-auto [mask-image:linear-gradient(to_right,transparent,black_24px,black_calc(100%_-_var(--edge-fade,0px)),transparent)]"
        onCreated={({ gl }) => {
          gl.domElement.addEventListener(
            'webglcontextlost',
            (event) => {
              event.preventDefault();
              onFailRef.current();
            },
            { once: true },
          );
        }}
      >
        <Lights />
        {/* The model file loads after the canvas; draw nothing till then. */}
        <Suspense fallback={null}>
          <Scene
            settle={settle}
            onReady={onReady}
            keyPressedAt={keyPressedAt}
            onDragLimit={playNotch}
            anchor={anchorRef}
            fadeHost={rootRef}
            portal={overlayRef}
            screen={
              // The screen renders in drei's own React root: re-apply the
              // reduced-motion rule and keep its layoutIds apart from the CSS
              // laptop's.
              <MotionConfig reducedMotion="user">
                <LayoutGroup id="hero-laptop-3d">
                  {/* Fixed at SCREEN_PX (the model's glass); drei
                      scales it onto the screen. */}
                  <LaptopScreen {...screen} className="h-[454px] w-[698px]" />
                </LayoutGroup>
              </MotionConfig>
            }
          />
        </Suspense>
      </Canvas>
      <div
        ref={overlayRef}
        className="pointer-events-none absolute inset-0 isolate z-[1]"
      />
    </div>
  );
}
