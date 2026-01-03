import { RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PullToRefreshIndicatorProps {
  pullDistance: number;
  isRefreshing: boolean;
  progress: number;
  shouldTrigger: boolean;
}

export function PullToRefreshIndicator({
  pullDistance,
  isRefreshing,
  progress,
  shouldTrigger,
}: PullToRefreshIndicatorProps) {
  if (pullDistance === 0 && !isRefreshing) return null;

  return (
    <div 
      className="absolute left-0 right-0 top-0 flex items-center justify-center pointer-events-none z-10 md:hidden"
      style={{ 
        height: `${pullDistance}px`,
        transition: isRefreshing ? 'none' : 'height 0.2s ease-out'
      }}
    >
      <div 
        className={cn(
          "flex items-center justify-center rounded-full bg-primary/10 p-2 transition-all",
          shouldTrigger && "bg-primary/20",
          isRefreshing && "bg-primary/20"
        )}
        style={{
          opacity: Math.min(progress * 1.5, 1),
          transform: `scale(${0.5 + progress * 0.5})`,
        }}
      >
        <RefreshCw 
          className={cn(
            "h-5 w-5 text-primary transition-transform",
            isRefreshing && "animate-spin"
          )}
          style={{
            transform: isRefreshing ? undefined : `rotate(${progress * 180}deg)`,
          }}
        />
      </div>
    </div>
  );
}
