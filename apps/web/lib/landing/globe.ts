/**
 * Globe math for the "Splits around the world" demo. `projectLocation`
 * mirrors how cobe 2 places a marker, so the ₱ ping coin (plain HTML) sits on
 * its canvas dot in every browser, without CSS anchor positioning.
 */

import type { DemoCity } from './simulated';

/** A simulated ping. `focus` turns the globe to face the city. */
export type GlobePing = { id: number; city: DemoCity; focus: boolean };

/** Radius of cobe's sphere in its clip space. */
const GLOBE_RADIUS = 0.8;
/** cobe's default marker lift above the surface. */
export const GLOBE_MARKER_ELEVATION = 0.05;
/** Tilt towards the north so the Philippines sit mid-globe. */
export const GLOBE_THETA = 0.22;
export const GLOBE_MAX_DPR = 2;

export function globeDevicePixelRatio(dpr: number | undefined): number {
  return Math.min(Math.max(dpr || 1, 1), GLOBE_MAX_DPR);
}

/** The rotation (cobe `phi`) that puts a longitude front and center. */
export function phiFacing(lng: number): number {
  return (3 * Math.PI) / 2 - (lng * Math.PI) / 180;
}

/** Signed shortest turn from one angle to another, in (-π, π]. */
export function shortestTurn(from: number, to: number): number {
  const turn = (to - from) % (2 * Math.PI);
  if (turn > Math.PI) return turn - 2 * Math.PI;
  if (turn <= -Math.PI) return turn + 2 * Math.PI;
  return turn;
}

export type GlobePoint = { x: number; y: number; visible: boolean };

/**
 * Where cobe draws a marker at (lat, lng) on a square canvas at scale 1:
 * x/y as fractions of the canvas, `visible` false once it turns behind.
 */
export function projectLocation(
  lat: number,
  lng: number,
  phi: number,
  theta: number,
  elevation: number = GLOBE_MARKER_ELEVATION,
): GlobePoint {
  const latR = (lat * Math.PI) / 180;
  const lngR = (lng * Math.PI) / 180 - Math.PI;
  const r = GLOBE_RADIUS + elevation;
  const cosLat = Math.cos(latR);
  const px = -cosLat * Math.cos(lngR) * r;
  const py = Math.sin(latR) * r;
  const pz = cosLat * Math.sin(lngR) * r;

  const cosT = Math.cos(theta);
  const sinT = Math.sin(theta);
  const cosP = Math.cos(phi);
  const sinP = Math.sin(phi);
  const sx = cosP * px + sinP * pz;
  const sy = sinP * sinT * px + cosT * py - cosP * sinT * pz;
  const depth = -sinP * cosT * px + sinT * py + cosP * cosT * pz;

  return {
    x: (sx + 1) / 2,
    y: (1 - sy) / 2,
    // Same test as cobe: in front, or lifted clear of the silhouette.
    visible: depth >= 0 || sx * sx + sy * sy >= 0.64,
  };
}
