import { useEffect, useRef, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

const navRoutes = [
  '/dashboard',
  '/invoices',
  '/expenses',
  '/payments',
  '/approvals',
];

interface SwipeState {
  startX: number;
  startY: number;
  startTime: number;
}

export function useSwipeNavigation() {
  const navigate = useNavigate();
  const location = useLocation();
  const swipeState = useRef<SwipeState | null>(null);
  
  const SWIPE_THRESHOLD = 80;
  const SWIPE_VELOCITY_THRESHOLD = 0.3;
  const MAX_VERTICAL_RATIO = 0.75;

  const getCurrentIndex = useCallback(() => {
    return navRoutes.indexOf(location.pathname);
  }, [location.pathname]);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    const touch = e.touches[0];
    swipeState.current = {
      startX: touch.clientX,
      startY: touch.clientY,
      startTime: Date.now(),
    };
  }, []);

  const handleTouchEnd = useCallback((e: TouchEvent) => {
    if (!swipeState.current) return;

    const touch = e.changedTouches[0];
    const deltaX = touch.clientX - swipeState.current.startX;
    const deltaY = touch.clientY - swipeState.current.startY;
    const deltaTime = Date.now() - swipeState.current.startTime;
    
    const velocity = Math.abs(deltaX) / deltaTime;
    const verticalRatio = Math.abs(deltaY) / Math.abs(deltaX);

    // Only trigger if horizontal swipe is dominant
    if (verticalRatio > MAX_VERTICAL_RATIO) {
      swipeState.current = null;
      return;
    }

    const currentIndex = getCurrentIndex();
    if (currentIndex === -1) {
      swipeState.current = null;
      return;
    }

    // Check if swipe meets threshold (distance or velocity)
    if (Math.abs(deltaX) > SWIPE_THRESHOLD || velocity > SWIPE_VELOCITY_THRESHOLD) {
      if (deltaX > 0 && currentIndex > 0) {
        // Swipe right - go to previous page
        navigate(navRoutes[currentIndex - 1]);
      } else if (deltaX < 0 && currentIndex < navRoutes.length - 1) {
        // Swipe left - go to next page
        navigate(navRoutes[currentIndex + 1]);
      }
    }

    swipeState.current = null;
  }, [getCurrentIndex, navigate]);

  useEffect(() => {
    // Only enable on mobile
    const isMobile = window.innerWidth < 768;
    if (!isMobile) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: true });
    document.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [handleTouchStart, handleTouchEnd]);

  return { currentIndex: getCurrentIndex() };
}
