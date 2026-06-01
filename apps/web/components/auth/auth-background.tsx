'use client';

import { ReactNode } from 'react';

import { Plasma } from '@web/components/effects/Plasma';

/**
 * Full-bleed Plasma canvas + vignette pinned behind the auth content.
 * Designed to be the FIRST child of a `relative isolate overflow-hidden`
 * parent, so a sibling with `relative z-10` sits cleanly on top.
 */
export function PlasmaBackdrop() {
  return (
    <>
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Plasma
          color="#00ff6a"
          speed={0.55}
          direction="forward"
          scale={1.15}
          opacity={0.65}
          // Mouse interaction fires uniform writes on every mousemove —
          // expensive on low-end devices and the auth page has nothing
          // meaningful to mouse over. Keep the background calm.
          mouseInteractive={false}
        />
      </div>
      {/* Vignette keeps the centre calm so glass cards remain legible */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(0,0,0,0)_0%,rgba(0,0,0,0.55)_100%)]"
      />
    </>
  );
}

interface AuthBackgroundProps {
  children: ReactNode;
}

/**
 * Centered Plasma shell for standalone auth pages that don't sit inside
 * the (auth) split-screen layout.
 */
export function AuthBackground({ children }: AuthBackgroundProps) {
  return (
    <div className="relative isolate flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      <PlasmaBackdrop />
      <div className="relative z-10 w-full">{children}</div>
    </div>
  );
}
