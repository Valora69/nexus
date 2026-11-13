'use client';

import { FRONT_VIEW } from '@web/lib/landing/laptop-3d';
import { cn } from '@web/lib/utils';

import { LaptopScreen, type LaptopScreenProps } from './laptop-screen';
import { useInert } from './use-inert';

type LaptopMockProps = Omit<LaptopScreenProps, 'className'> & {
  /** On its way out (the 3D laptop is taking over): inert and hidden. */
  inactive?: boolean;
  className?: string;
};

/**
 * A CSS-only laptop: the 3D model drawn straight on (`FRONT_VIEW`: rim, black
 * glass, hinge strip and base at the model's sizes and rendered colours)
 * around the live `LaptopScreen`. The 3D laptop's first frame is the same
 * drawing, so the swap to 3D doesn't show. Scaled by the parent. It is also
 * the fallback wherever the 3D laptop can't run.
 */
export function LaptopMock({
  inactive = false,
  className,
  ...screen
}: LaptopMockProps) {
  const ref = useInert<HTMLDivElement>(inactive);
  const F = FRONT_VIEW;
  const glassRadius = F.lidRadius - F.rim;

  return (
    <div
      ref={ref}
      aria-hidden={inactive || undefined}
      className={cn('relative', className)}
      style={{ width: F.width }}
    >
      {/* Lid: only its top corners show; the base hides its lower edge. */}
      <div
        className="relative bg-[#121212] shadow-[0_40px_80px_-30px_rgb(0_0_0/0.9)]"
        style={{
          height: F.lidHeight,
          borderRadius: `${F.lidRadius}px ${F.lidRadius}px 0 0`,
        }}
      >
        {/* Black glass inside the rim, then the dark strip above the hinge. */}
        <div
          aria-hidden
          className="absolute bg-black"
          style={{
            top: F.rim,
            left: F.rim,
            right: F.rim,
            height: `${(F.glassBottom - F.rim).toFixed(1)}px`,
            borderRadius: `${glassRadius}px ${glassRadius}px 0 0`,
          }}
        />
        <div
          aria-hidden
          className="absolute bottom-0 bg-[#222222]"
          style={{ top: F.glassBottom, left: F.rim, right: F.rim }}
        />
        <div className="absolute" style={{ top: F.bezel, left: F.bezel }}>
          <LaptopScreen {...screen} className="h-[454px] w-[698px]" />
        </div>
      </div>

      {/* Base: its front face, as wide as the lid, with the thumb scoop. */}
      <div
        aria-hidden
        className="relative rounded-b-[6px] bg-[linear-gradient(to_bottom,#242325,#1c1b1d_45%,#030303_76%,#000)]"
        style={{ height: F.baseHeight }}
      >
        <span
          className="absolute left-1/2 top-0 -translate-x-1/2 rounded-b-[6px] bg-[#555356]"
          style={{ width: F.scoop.width, height: F.scoop.depth }}
        />
        {/* The bottom plate's edge: drawn below the box, not part of it. */}
        <span
          className="absolute top-full bg-[#070707]"
          style={{
            left: F.plate.inset,
            right: F.plate.inset,
            height: F.plate.height,
          }}
        />
      </div>
    </div>
  );
}
