'use client';

import {
  useEffect,
  useMemo,
  useRef,
  type MutableRefObject,
  type ReactNode,
} from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { ContactShadows, Html, useGLTF } from '@react-three/drei';
import * as THREE from 'three';

import {
  LAPTOP_SIZE,
  MODEL,
  MODEL_Q_KEY,
  MODEL_URL,
  SCREEN,
  SCREEN_DISTANCE_FACTOR,
  type LaptopPose,
} from '@web/lib/landing/laptop-3d';

// Meshopt-compressed (its decoder ships with three-stdlib); no Draco, so
// nothing is fetched from a CDN.
const USE_DRACO = false;
const USE_MESHOPT = true;

/** Places the model so its hinge axis runs through the origin. */
const HINGE_OFFSET = MODEL.hinge.map((v) => -v * MODEL.scale) as [
  number,
  number,
  number,
];

/**
 * Loads the model and splits it into the base (everything else) and the lid,
 * so the lid can turn on the hinge. Both stay in the model's metre space.
 */
function useLaptopParts() {
  const { scene } = useGLTF(MODEL_URL, USE_DRACO, USE_MESHOPT);

  return useMemo(() => {
    // A copy, so re-mounting (hot reload, Strict Mode) never moves the
    // cached original's parts twice.
    const base = scene.clone(true);
    base.updateMatrixWorld(true);
    const lid = base.getObjectByName('Lid');
    if (!lid) throw new Error('Hero laptop model has no "Lid" part');
    const lidRoot = new THREE.Group();
    lidRoot.attach(lid);
    return { base, lid: lidRoot };
  }, [scene]);
}

/**
 * Frame order: the pose is advanced at -2, applied here at -1, and drei's
 * `Html` reads the result at 0, so the HTML screen never lags the lid.
 */
export const APPLY_POSE_PRIORITY = -1;

type BodyHandlers = {
  onPointerDown?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOver?: (event: ThreeEvent<PointerEvent>) => void;
  onPointerOut?: (event: ThreeEvent<PointerEvent>) => void;
};

/**
 * An invisible box that takes the laptop's pointer events, so a pointer move
 * tests 12 triangles instead of the model's ~160k.
 */
function HitBox({
  size,
  position,
  handlers,
}: {
  size: [number, number, number];
  position: [number, number, number];
  handlers?: BodyHandlers;
}) {
  return (
    <mesh position={position} {...handlers}>
      <boxGeometry args={size} />
      <meshBasicMaterial colorWrite={false} depthWrite={false} />
    </mesh>
  );
}

const BASE_HIT = {
  size: [
    LAPTOP_SIZE.width,
    LAPTOP_SIZE.baseTop - LAPTOP_SIZE.baseBottom,
    LAPTOP_SIZE.baseFront,
  ] as [number, number, number],
  position: [
    0,
    (LAPTOP_SIZE.baseTop + LAPTOP_SIZE.baseBottom) / 2,
    LAPTOP_SIZE.baseFront / 2,
  ] as [number, number, number],
};

/** The lid stood upright: from the hinge to its top edge, ~0.26 thick. */
const LID_HIT = {
  size: [LAPTOP_SIZE.width, LAPTOP_SIZE.lidLength, 0.26] as [
    number,
    number,
    number,
  ],
  position: [0, LAPTOP_SIZE.lidLength / 2, -0.07] as [number, number, number],
};

/** Glow patch size as a multiple of the keycap: room to spill onto its
 *  neighbours. */
const GLOW_SPREAD = 2.4;

/**
 * A soft neon patch, drawn once: a rounded keycap in the middle with its
 * light fading out around it.
 */
function useGlowTexture() {
  const texture = useMemo(() => {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx) {
      const key = size / GLOW_SPREAD;
      const corner = (size - key) / 2;
      ctx.fillStyle = '#00ff41';
      ctx.shadowColor = '#00ff41';
      ctx.shadowBlur = size * 0.14;
      // Twice, so the halo is bright enough to read next to the keycap.
      for (let i = 0; i < 2; i += 1) {
        ctx.beginPath();
        ctx.roundRect(corner, corner, key, key, key * 0.18);
        ctx.fill();
      }
    }
    const map = new THREE.CanvasTexture(canvas);
    map.colorSpace = THREE.SRGBColorSpace;
    return map;
  }, []);
  useEffect(() => () => texture.dispose(), [texture]);
  return texture;
}

/**
 * Lights the model's own Q key when the Q keycap is pressed. The model's
 * keys are one merged mesh, so the key can't sink; a patch of light laid just
 * above it glows instead. Added, not painted over, so its legend still shows.
 * Lives in the model's metre space.
 */
function KeyGlow({ glow }: { glow: MutableRefObject<number> }) {
  const map = useGlowTexture();
  const mesh = useRef<THREE.Mesh>(null);
  const material = useRef<THREE.MeshBasicMaterial>(null);
  const [x, y, z] = MODEL_Q_KEY.center;
  const [width, depth] = MODEL_Q_KEY.size;

  useFrame(() => {
    const level = glow.current;
    if (mesh.current) mesh.current.visible = level > 0.001;
    if (material.current) material.current.opacity = level;
  }, APPLY_POSE_PRIORITY);

  return (
    <mesh
      ref={mesh}
      visible={false}
      // Half a millimetre above the keycaps, lying flat.
      position={[x, y + 0.0005, z]}
      rotation={[-Math.PI / 2, 0, 0]}
    >
      <planeGeometry args={[width * GLOW_SPREAD, depth * GLOW_SPREAD]} />
      <meshBasicMaterial
        ref={material}
        map={map}
        transparent
        opacity={0}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
        toneMapped={false}
      />
    </mesh>
  );
}

type LaptopModelProps = {
  /** Read every frame, so animating it never re-renders the screen. */
  pose: MutableRefObject<LaptopPose>;
  /** The Q key's glow, 0 to 1, read every frame. */
  keyGlow: MutableRefObject<number>;
  /** Overlay the live screen is mounted into (outside the canvas). */
  portal: MutableRefObject<HTMLElement>;
  /** The live screen, rendered as real HTML on the lid. */
  screen: ReactNode;
  /** Pointer handlers for the laptop's body (drag to turn). */
  bodyHandlers?: BodyHandlers;
};

/**
 * The 3D hero laptop: the base and a lid on its hinge, whose screen is the
 * live HTML `LaptopScreen` laid exactly over the model's screen. The origin
 * is the hinge axis; +Z points at the viewer.
 */
export function LaptopModel({
  pose,
  keyGlow,
  portal,
  screen,
  bodyHandlers,
}: LaptopModelProps) {
  const { base, lid } = useLaptopParts();
  const body = useRef<THREE.Group>(null);
  const hinge = useRef<THREE.Group>(null);

  useFrame(() => {
    const { x, y, yaw, pitch, lidAngle } = pose.current;
    body.current?.position.set(x, y, 0);
    body.current?.rotation.set(pitch, yaw, 0);
    hinge.current?.rotation.set(Math.PI / 2 - lidAngle, 0, 0);
  }, APPLY_POSE_PRIORITY);

  return (
    <group ref={body}>
      <group scale={MODEL.scale} position={HINGE_OFFSET}>
        <primitive object={base} />
        <KeyGlow glow={keyGlow} />
      </group>
      <HitBox {...BASE_HIT} handlers={bodyHandlers} />

      {/* Hinge: 90° is upright, more leans back. */}
      <group ref={hinge}>
        {/* Stand the lid upright from the angle it was modelled at. */}
        <group rotation={[MODEL.lidAngle - Math.PI / 2, 0, 0]}>
          <group scale={MODEL.scale} position={HINGE_OFFSET}>
            <primitive object={lid} />
          </group>
        </group>
        <HitBox {...LID_HIT} handlers={bodyHandlers} />
        <Html
          transform
          portal={portal}
          distanceFactor={SCREEN_DISTANCE_FACTOR}
          zIndexRange={[1, 0]}
          position={SCREEN.center}
        >
          {screen}
        </Html>
      </group>

      <ContactShadows
        position={[
          0,
          LAPTOP_SIZE.baseBottom - 0.005,
          LAPTOP_SIZE.baseFront / 2,
        ]}
        scale={[LAPTOP_SIZE.width + 3, LAPTOP_SIZE.baseFront + 3]}
        resolution={256}
        far={2}
        blur={2.4}
        opacity={0.8}
        frames={1}
      />
    </group>
  );
}

useGLTF.preload(MODEL_URL, USE_DRACO, USE_MESHOPT);
