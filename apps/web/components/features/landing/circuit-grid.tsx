import { cn } from '@web/lib/utils';

// Orthogonal traces with 45° bends, drawn in a 600×400 box and stretched to
// fill the parent. `converge` points every trace at the center for the CTA.
const TRACES = {
  scatter: [
    'M0 120 H180 L210 150 H330',
    'M600 90 H470 L440 120 H380',
    'M60 400 V320 L90 290 H200',
    'M600 330 H500 L470 300 V240',
  ],
  converge: [
    'M0 200 H240',
    'M600 200 H360',
    'M300 0 V120',
    'M120 400 V330 L160 290 H260',
    'M480 400 V330 L440 290 H340',
  ],
} as const;

type CircuitGridProps = {
  variant?: keyof typeof TRACES;
  className?: string;
};

/** Decorative ledger grid + neon traces. Absolutely fills its parent. */
export function CircuitGrid({
  variant = 'scatter',
  className,
}: CircuitGridProps) {
  const fade = 'radial-gradient(ellipse at center, black 30%, transparent 75%)';
  return (
    <div
      aria-hidden
      className={cn(
        'pointer-events-none absolute inset-0 overflow-hidden',
        className,
      )}
    >
      <div
        className="absolute inset-0"
        style={{
          backgroundImage:
            'linear-gradient(rgb(255 255 255 / 0.05) 1px, transparent 1px), linear-gradient(90deg, rgb(255 255 255 / 0.05) 1px, transparent 1px)',
          backgroundSize: '32px 32px',
          maskImage: fade,
          WebkitMaskImage: fade,
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 600 400"
        preserveAspectRatio="none"
        fill="none"
      >
        {TRACES[variant].map((d) => (
          <path
            key={d}
            d={d}
            stroke="#00ff41"
            strokeOpacity={0.55}
            strokeWidth={1.5}
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            style={{ filter: 'drop-shadow(0 0 4px rgb(0 255 65 / 0.6))' }}
          />
        ))}
      </svg>
    </div>
  );
}
