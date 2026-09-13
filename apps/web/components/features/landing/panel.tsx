import { cn } from '@web/lib/utils';

export type PanelWidth = 'screen' | 'content';

type PanelProps = {
  label: string;
  /** Track width: one viewport, or as wide as the content needs. */
  width?: PanelWidth;
  /** Vertical-mode padding. Off for sections that bring their own. */
  padded?: boolean;
  /** Track mode: at least a viewport wide plus empty track on both sides,
   *  so the section fills the screen alone for a stretch of scrolling. */
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

const TRACK_SPACED =
  'group-data-[mode=track]/shell:w-max group-data-[mode=track]/shell:min-w-[150vw] group-data-[mode=track]/shell:justify-center group-data-[mode=track]/shell:px-[25vw]';

const VERTICAL_PADDING =
  'group-data-[mode=vertical]/shell:py-16 sm:group-data-[mode=vertical]/shell:py-24';

/** One stop on the landing track: a full-height column in track mode, a
 *  plain stacked section otherwise. */
export function Panel({
  label,
  width = 'screen',
  padded = true,
  spaced = false,
  className,
  children,
}: PanelProps) {
  return (
    <div
      data-landing-panel={label}
      className={cn(
        'relative w-full',
        TRACK,
        spaced ? TRACK_SPACED : TRACK_WIDTH[width],
        padded && VERTICAL_PADDING,
        className,
      )}
    >
      <div className="w-full">{children}</div>
    </div>
  );
}
