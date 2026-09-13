// Import modules directly rather than via the barrel: the barrel re-exports
// client toys (e.g. HandNote → motion) that would otherwise ship on this route.
import { AddExpensePlayground } from '@web/components/features/landing/add-expense-playground';
import { Bento } from '@web/components/features/landing/bento';
import { BillSlicer } from '@web/components/features/landing/bill-slicer';
import { DemoActivityProvider } from '@web/components/features/landing/demo-activity-provider';
import { DemoGlobe } from '@web/components/features/landing/demo-globe';
import { Finale } from '@web/components/features/landing/finale';
import { landingFontVariables } from '@web/components/features/landing/fonts';
import { Hero } from '@web/components/features/landing/hero';
import { LandingFooter } from '@web/components/features/landing/landing-footer';
import { LandingHeader } from '@web/components/features/landing/landing-header';
import { LandingShell } from '@web/components/features/landing/landing-shell';
import { SettleSlingshot } from '@web/components/features/landing/settle-slingshot';
import { SoundProvider } from '@web/components/features/landing/sound-provider';

export default function LandingPage() {
  return (
    <SoundProvider>
      <DemoActivityProvider>
        {/* overflow-x-clip, not overflow-hidden: the latter would stop the
            track's sticky stage from sticking. */}
        <div
          className={`relative isolate flex min-h-screen flex-col overflow-x-clip bg-black ${landingFontVariables}`}
        >
          <LandingShell
            header={<LandingHeader />}
            panels={[
              {
                key: 'hero',
                label: 'Start',
                padded: false,
                content: <Hero />,
              },
              {
                key: 'features',
                label: 'Features',
                width: 'content',
                content: <Bento />,
              },
              {
                key: 'how-it-works',
                label: 'How it works',
                width: 'content',
                content: <AddExpensePlayground />,
              },
              {
                key: 'slice',
                label: 'Slice the bill',
                content: <BillSlicer />,
              },
              {
                key: 'settle',
                label: 'Settle up',
                content: <SettleSlingshot />,
              },
              {
                key: 'globe',
                label: 'Globe',
                content: <DemoGlobe />,
              },
              {
                key: 'get-started',
                label: 'Get started',
                content: <Finale />,
              },
            ]}
          >
            {/* In track mode the finale doubles as the footer. */}
            <LandingFooter className="group-data-[mode=track]/shell:hidden" />
          </LandingShell>
        </div>
      </DemoActivityProvider>
    </SoundProvider>
  );
}
