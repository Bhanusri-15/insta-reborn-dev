import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { BottomNav } from './BottomNav';

interface AppLayoutProps {
  children: React.ReactNode;
}

export function AppLayout({ children }: AppLayoutProps) {
  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <div className="flex-1 flex flex-col min-w-0">
          <div className="md:hidden flex items-center border-b border-border px-4 py-2">
            <SidebarTrigger className="mr-2" />
            <span className="text-lg font-bold text-foreground">Network</span>
          </div>
          <main className="flex-1 pb-16 md:pb-0">
            {children}
          </main>
          <BottomNav />
        </div>
      </div>
    </SidebarProvider>
  );
}
