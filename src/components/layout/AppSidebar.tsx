import { LayoutDashboard, FileText, Receipt, CreditCard, ClipboardCheck, BarChart3, Clock, Users, Bell, FolderKanban } from 'lucide-react';
import { NavLink, useLocation } from 'react-router-dom';
import { Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarHeader, SidebarFooter, useSidebar } from '@/components/ui/sidebar';
import { cn } from '@/lib/utils';
import logoImage from '@/assets/logo.png';

// Items that are in the bottom nav (will be hidden on mobile in sidebar)
const bottomNavItems = [{
  title: 'Dashboard',
  url: '/dashboard',
  icon: LayoutDashboard,
  color: 'text-blue-500'
}, {
  title: 'Invoices',
  url: '/invoices',
  icon: FileText,
  color: 'text-purple-500'
}, {
  title: 'Expenses',
  url: '/expenses',
  icon: Receipt,
  color: 'text-orange-500'
}, {
  title: 'Payments',
  url: '/payments',
  icon: CreditCard,
  color: 'text-green-500'
}, {
  title: 'Approvals',
  url: '/approvals',
  icon: ClipboardCheck,
  color: 'text-amber-500'
}];

// Items only shown in sidebar (not in bottom nav)
const sidebarOnlyItems = [{
  title: 'Projects',
  url: '/projects',
  icon: FolderKanban,
  color: 'text-violet-500'
}, {
  title: 'Reports',
  url: '/reports',
  icon: BarChart3,
  color: 'text-cyan-500'
}, {
  title: 'Time Tracking',
  url: '/time-tracking',
  icon: Clock,
  color: 'text-teal-500'
}, {
  title: 'Users',
  url: '/users',
  icon: Users,
  color: 'text-pink-500'
}, {
  title: 'Notifications',
  url: '/notifications',
  icon: Bell,
  color: 'text-rose-500'
}];
export function AppSidebar() {
  const location = useLocation();
  const {
    state
  } = useSidebar();
  const collapsed = state === 'collapsed';
  const isActive = (path: string) => location.pathname === path;
  const NavItem = ({
    item,
    showOnMobile = true
  }: {
    item: {
      title: string;
      url: string;
      icon: React.ComponentType<{
        className?: string;
      }>;
      color: string;
    };
    showOnMobile?: boolean;
  }) => <SidebarMenuItem className={showOnMobile ? '' : 'md:flex hidden'}>
      <SidebarMenuButton asChild>
        <NavLink to={item.url} className={cn('flex items-center gap-3 rounded-lg px-3 py-2 transition-all hover:text-foreground hover:bg-accent', isActive(item.url) ? 'bg-primary/10 text-primary font-medium' : 'text-muted-foreground')}>
          <item.icon className={cn('h-5 w-5 shrink-0', isActive(item.url) ? 'text-primary' : item.color)} />
          {!collapsed && <span>{item.title}</span>}
        </NavLink>
      </SidebarMenuButton>
    </SidebarMenuItem>;
  return <Sidebar collapsible="icon" className="border-r">
      <SidebarHeader className="border-b px-3 h-14 sm:h-16 flex items-center">
        <div className="gap-2 mx-[47px] flex-row flex items-center justify-start sm:gap-[19px]">
          <img src={logoImage} alt="ARPAY Logo" className="h-8 w-8 sm:h-10 sm:w-10 rounded-lg object-cover shrink-0" />
          {!collapsed && <div className="flex flex-col min-w-0">
              <span className="text-base sm:text-lg font-semibold text-foreground truncate">ARPAY</span>
              <span className="text-[10px] sm:text-xs text-muted-foreground">Enterprise</span>
            </div>}
        </div>
      </SidebarHeader>

      <SidebarContent className="px-2 py-3 sm:py-4 overflow-y-auto">
        {/* Main Navigation - Hidden on mobile as these are in bottom nav */}
        <SidebarGroup className="hidden md:block">
          {!collapsed && <SidebarGroupLabel className="px-3 text-xs uppercase tracking-wider text-muted-foreground">Main</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {bottomNavItems.map(item => <NavItem key={item.url} item={item} showOnMobile={false} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Additional Pages - Always visible */}
        <SidebarGroup className="md:mt-4">
          {!collapsed && <SidebarGroupLabel className="px-3 text-xs uppercase tracking-wider text-muted-foreground">More</SidebarGroupLabel>}
          <SidebarGroupContent>
            <SidebarMenu>
              {sidebarOnlyItems.map(item => <NavItem key={item.url} item={item} showOnMobile={true} />)}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t p-3 sm:p-4">
        {!collapsed && <div className="text-[10px] sm:text-xs text-muted-foreground">
            © 2024 ARPAY
          </div>}
      </SidebarFooter>
    </Sidebar>;
}