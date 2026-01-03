import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, FileText, Receipt, CreditCard, ClipboardCheck } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { 
    title: 'Home', 
    url: '/dashboard', 
    icon: LayoutDashboard,
    activeColor: 'text-primary',
    activeBg: 'bg-primary/10',
    iconColor: 'text-blue-500',
  },
  { 
    title: 'Invoices', 
    url: '/invoices', 
    icon: FileText,
    activeColor: 'text-purple-600',
    activeBg: 'bg-purple-500/10',
    iconColor: 'text-purple-500',
  },
  { 
    title: 'Expenses', 
    url: '/expenses', 
    icon: Receipt,
    activeColor: 'text-orange-600',
    activeBg: 'bg-orange-500/10',
    iconColor: 'text-orange-500',
  },
  { 
    title: 'Payments', 
    url: '/payments', 
    icon: CreditCard,
    activeColor: 'text-green-600',
    activeBg: 'bg-green-500/10',
    iconColor: 'text-green-500',
  },
  { 
    title: 'Approvals', 
    url: '/approvals', 
    icon: ClipboardCheck,
    activeColor: 'text-amber-600',
    activeBg: 'bg-amber-500/10',
    iconColor: 'text-amber-500',
  },
];

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t bg-card/95 backdrop-blur-sm md:hidden safe-bottom">
      <div className="flex w-full items-stretch pb-[env(safe-area-inset-bottom)]">
        {navItems.map((item) => {
          const active = isActive(item.url);
          return (
            <button
              key={item.url}
              onClick={() => navigate(item.url)}
              className={cn(
                'flex min-w-0 flex-1 flex-col items-center justify-center gap-0.5 py-2.5 px-1 transition-all',
                active ? item.activeBg : 'hover:bg-muted/50 active:bg-muted/70'
              )}
            >
              <div className={cn(
                'flex items-center justify-center rounded-full p-1.5 transition-all',
                active && 'scale-110'
              )}>
                <item.icon className={cn(
                  'h-5 w-5 shrink-0 transition-colors',
                  active ? item.activeColor : item.iconColor
                )} />
              </div>
              <span className={cn(
                'text-[10px] font-medium truncate max-w-full transition-colors leading-tight',
                active ? item.activeColor : 'text-muted-foreground'
              )}>
                {item.title}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
