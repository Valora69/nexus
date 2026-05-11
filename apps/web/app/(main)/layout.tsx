'use client';

import { DashboardLayout } from '@web/components/DashboardLayout';
import { Toaster } from 'sonner';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <DashboardLayout>
      {children}
      <Toaster position="top-right" richColors />
    </DashboardLayout>
  );
}
