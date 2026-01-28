// Update the import path if the file is located elsewhere, for example:
import { SidebarProvider, SidebarTrigger } from '../components/ui/sidebar';
// Or create the file at components/ui/sidebar.tsx if it doesn't exist.
import { AppSidebar } from './AppSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  return (
    <SidebarProvider defaultOpen>
      <div className="flex min-h-screen w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b border-border flex items-center px-4 gap-4">
            <SidebarTrigger />
            <div className="flex-1" />
            <div className="text-xs text-muted-foreground font-mono">
              {new Date().toLocaleDateString()}{' '}
              {new Date().toLocaleTimeString()}
            </div>
          </header>
          <main className="flex-1 overflow-auto">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  );
}
