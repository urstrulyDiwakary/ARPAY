import { ReactNode, useCallback, useRef } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Header } from './Header';
import { BottomNav } from './BottomNav';
import { PullToRefreshIndicator } from './PullToRefreshIndicator';
import { ScrollToTopButton } from './ScrollToTopButton';
import { useSwipeNavigation } from '@/hooks/useSwipeNavigation';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { useLocation } from 'react-router-dom';

interface MainLayoutProps {
  children: ReactNode;
  title: string;
}

export function MainLayout({ children, title }: MainLayoutProps) {
  // Enable swipe navigation on mobile
  useSwipeNavigation();
  const location = useLocation();
  const mainRef = useRef<HTMLElement>(null);

  const handleRefresh = useCallback(async () => {
    // Simulate refresh - in a real app, this would refetch data
    await new Promise(resolve => setTimeout(resolve, 1000));
    // Force a re-render by triggering navigation to same page
    window.dispatchEvent(new CustomEvent('pull-to-refresh', { detail: { path: location.pathname } }));
  }, [location.pathname]);

  const { 
    bindToContainer, 
    pullDistance, 
    isRefreshing, 
    progress, 
    shouldTrigger 
  } = usePullToRefresh({ onRefresh: handleRefresh });

  return (
    <SidebarProvider>
      <div className="flex h-screen w-full overflow-hidden">
        <AppSidebar />
        <SidebarInset className="flex flex-1 flex-col min-w-0 h-screen overflow-hidden">
          <Header title={title} />
          <main 
            ref={(el) => {
              mainRef.current = el;
              bindToContainer(el);
            }}
            className="relative flex-1 overflow-x-hidden overflow-y-auto p-3 pb-24 sm:p-4 sm:pb-24 md:p-6 md:pb-6 touch-pan-y"
          >
            <PullToRefreshIndicator 
              pullDistance={pullDistance}
              isRefreshing={isRefreshing}
              progress={progress}
              shouldTrigger={shouldTrigger}
            />
            <div 
              style={{ 
                transform: pullDistance > 0 ? `translateY(${pullDistance}px)` : undefined,
                transition: isRefreshing ? 'none' : 'transform 0.2s ease-out'
              }}
            >
              {children}
            </div>
          </main>
          <ScrollToTopButton containerRef={mainRef} />
        </SidebarInset>
        <BottomNav />
      </div>
    </SidebarProvider>
  );
}
