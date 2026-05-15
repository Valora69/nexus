'use client';

import { ReactNode, useEffect, useState } from 'react';

interface AuthBackgroundProps {
  children: ReactNode;
}

interface OrbPosition {
  x: number;
  y: number;
}

// Four corner zones — card occupies ~34–65% horizontally, ~32–68% vertically when centered.
// Orb origins stay well outside that region so gradient falloff clears the card.
const ORBS = [
  { xMin: 2, xMax: 28, yMin: 3, yMax: 28, interval: 4000, duration: 1.5 }, // top-left
  { xMin: 58, xMax: 86, yMin: 3, yMax: 28, interval: 3200, duration: 1.8 }, // top-right
  { xMin: 2, xMax: 28, yMin: 62, yMax: 88, interval: 5000, duration: 1.2 }, // bottom-left
  { xMin: 58, xMax: 86, yMin: 62, yMax: 88, interval: 3700, duration: 1.2 }, // bottom-right
] as const;

type OrbConfig = (typeof ORBS)[number];

function randomInZone(orb: OrbConfig): OrbPosition {
  return {
    x: orb.xMin + Math.random() * (orb.xMax - orb.xMin),
    y: orb.yMin + Math.random() * (orb.yMax - orb.yMin),
  };
}

// Initialize with zone centers — avoids SSR/hydration mismatch from Math.random()
function initialPositions(): OrbPosition[] {
  return ORBS.map((o) => ({
    x: (o.xMin + o.xMax) / 2,
    y: (o.yMin + o.yMax) / 2,
  }));
}

function GlowOrb({ pos, duration }: { pos: OrbPosition; duration: number }) {
  return (
    <div
      className="absolute w-80 h-80 pointer-events-none opacity-50"
      style={{
        background:
          'radial-gradient(circle, rgba(0,255,165,0.09) 0%, rgba(0,255,65,0.03) 50%, transparent 100%)',
        left: `${pos.x}%`,
        top: `${pos.y}%`,
        transition: `left ${duration}s ease-in-out, top ${duration}s ease-in-out`,
      }}
    />
  );
}

export function AuthBackground({ children }: AuthBackgroundProps) {
  const [positions, setPositions] = useState<OrbPosition[]>(initialPositions);

  useEffect(() => {
    // Scatter to random positions on mount (client-only)
    setPositions(ORBS.map(randomInZone));

    const intervals = ORBS.map((orb, i) =>
      setInterval(() => {
        setPositions((prev) => {
          const next = [...prev];
          next[i] = randomInZone(orb);
          return next;
        });
      }, orb.interval),
    );

    return () => intervals.forEach(clearInterval);
  }, []);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <style>{`
        @keyframes auth-fade-in-up {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-auth-fade-in-up {
          animation: auth-fade-in-up 600ms cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>

      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(0,255,65,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(0,255,65,0.02)_1px,transparent_1px)] bg-[size:50px_50px] pointer-events-none" />

      {/* Orbs — one per corner, zones exclude the card region by construction */}
      {ORBS.map((orb, i) => (
        <GlowOrb
          key={i}
          pos={positions[i] ?? { x: orb.xMin, y: orb.yMin }}
          duration={orb.duration}
        />
      ))}

      {/* Vignette */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.3)_100%)] pointer-events-none" />

      {children}
    </div>
  );
}
