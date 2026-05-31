'use client';

import { DashboardLayout } from '@web/components/DashboardLayout';
import { Toaster } from 'sonner';

export default function MainLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <DashboardLayout>
      {children}
      <Toaster
        position="bottom-right"
        richColors
        // sit above the sticky topbar (z-20) and mobile header (z-40)
        // so error toasts are never hidden behind the chrome
        style={{ zIndex: 9999 }}
      />
    </DashboardLayout>
  );
}
