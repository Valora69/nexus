import { cn } from '@web/lib/utils';

export type PanelWidth = 'screen' | 'content';

type PanelProps = {
  label: string;
  /** Track width: one viewport, or as wide as the content needs. */
  width?: PanelWidth;
  /** Vertical-mode padding. Off for sections that bring their own. */
  padded?: boolean;
  /** Track mode: empty track before the panel, so the gap from the previous
   *  section to this one matches the gap after the hero. The previous panel
   *  must end where its content does (the hero, or a `content` panel). */
  spaced?: boolean;
  className?: string;
  children: React.ReactNode;
};

// The shell stamps data-mode="track" | "vertical" on its `group/shell` root,
// so panels style themselves for either layout without being client code.
const TRACK =
  'group-data-[mode=track]/shell:flex group-data-[mode=track]/shell:h-full group-data-[mode=track]/shell:shrink-0 group-data-[mode=track]/shell:items-center group-data-[mode=track]/shell:pb-10 group-data-[mode=track]/shell:pt-24';

const TRACK_WIDTH: Record<PanelWidth, string> = {
  screen: 'group-data-[mode=track]/shell:w-screen',
  content: 'group-data-[mode=track]/shell:w-max',
};

// The gap after the hero is the empty space right of its headline plus the
// next section's left padding, max(4rem,6vw). The headline column starts at
// 50vw+12px and "Stay friends." is 5.775 times the headline's font size wide,
// so that space is 50vw-12px-5.775*font. Two sections side by side already
// have a padding each, so this margin is that space minus one padding.
const TRACK_SPACED =
  'group-data-[mode=track]/shell:ml-[max(0px,calc(50vw-12px-5.775*clamp(2.75rem,6vw,5rem)-max(4rem,6vw)))]';

const VERTICAL_PADDING =
  'group-data-[mode=vertical]/shell:py-16 sm:group-data-[mode=vertical]/shell:py-24';

/** One stop on the landing track: a full-height column in track mode, a
 *  plain stacked section otherwise. */
export function Panel({
  label,
  width = 'screen',
  padded = true,
  spaced,
  className,
  children,
}: PanelProps) {
  return (
    <div
      data-landing-panel={label}
      className={cn(
        'relative w-full',
        TRACK,
        TRACK_WIDTH[width],
        spaced && TRACK_SPACED,
        padded && VERTICAL_PADDING,
        className,
      )}
    >
      <div className="w-full">{children}</div>
    </div>
  );
}
