import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { dashboardApi } from '@/services/api';
import { FileText, Receipt, CreditCard, ClipboardCheck, TrendingUp, TrendingDown, AlertTriangle, ArrowRight, Clock, Users, BarChart3, CheckCircle, FolderKanban, Bell, CalendarClock } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Progress } from '@/components/ui/progress';

export default function DashboardPage() {
  const navigate = useNavigate();
  
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: dashboardApi.getStats,
  });

  const statCards = [
    {
      title: 'Total Revenue',
      value: stats ? `₹${stats.totalRevenue.toLocaleString('en-IN')}` : '-',
      subtitle: 'From paid invoices',
      trend: '+12.5%',
      trendUp: true,
      icon: TrendingUp,
      color: 'text-primary',
      bgColor: 'bg-gradient-to-br from-primary/20 to-primary/5',
      borderColor: 'border-primary/20',
      link: '/invoices',
    },
    {
      title: 'Active Customers',
      value: stats?.activeCustomers || 0,
      subtitle: 'Unique clients',
      trend: '+5.2%',
      trendUp: true,
      icon: Users,
      color: 'text-blue-600',
      bgColor: 'bg-gradient-to-br from-blue-500/20 to-blue-500/5',
      borderColor: 'border-blue-500/20',
      link: '/invoices',
    },
    {
      title: 'Total Expenses',
      value: stats ? `₹${stats.totalExpenses.toLocaleString('en-IN')}` : '-',
      subtitle: 'This month',
      trend: '-8.2%',
      trendUp: false,
      icon: Receipt,
      color: 'text-orange-600',
      bgColor: 'bg-gradient-to-br from-orange-500/20 to-orange-500/5',
      borderColor: 'border-orange-500/20',
      link: '/expenses',
    },
    {
      title: 'Pending Approvals',
      value: stats?.pendingApprovals || 0,
      subtitle: 'Awaiting action',
      trend: '-5.3%',
      trendUp: false,
      icon: ClipboardCheck,
      color: 'text-amber-600',
      bgColor: 'bg-gradient-to-br from-amber-500/20 to-amber-500/5',
      borderColor: 'border-amber-500/20',
      link: '/approvals',
    },
    {
      title: 'Paid Invoices',
      value: stats?.paidInvoices || 0,
      subtitle: 'Completed payments',
      trend: '+8.1%',
      trendUp: true,
      icon: CheckCircle,
      color: 'text-green-600',
      bgColor: 'bg-gradient-to-br from-green-500/20 to-green-500/5',
      borderColor: 'border-green-500/20',
      link: '/invoices',
    },
    {
      title: 'No. of Projects',
      value: stats?.projectCount || 0,
      subtitle: 'Active projects',
      trend: '+3.0%',
      trendUp: true,
      icon: FolderKanban,
      color: 'text-purple-600',
      bgColor: 'bg-gradient-to-br from-purple-500/20 to-purple-500/5',
      borderColor: 'border-purple-500/20',
      link: '/projects',
    },
    {
      title: 'Payment Reminders',
      value: stats?.paymentReminders || 0,
      subtitle: 'Pending invoices',
      trend: '-2.5%',
      trendUp: false,
      icon: Bell,
      color: 'text-rose-600',
      bgColor: 'bg-gradient-to-br from-rose-500/20 to-rose-500/5',
      borderColor: 'border-rose-500/20',
      link: '/invoices',
    },
    {
      title: 'Project Deadlines',
      value: stats?.upcomingDeadlines || 0,
      subtitle: 'Due within 7 days',
      trend: '+1.2%',
      trendUp: true,
      icon: CalendarClock,
      color: 'text-indigo-600',
      bgColor: 'bg-gradient-to-br from-indigo-500/20 to-indigo-500/5',
      borderColor: 'border-indigo-500/20',
      link: '/invoices',
    },
  ];

  const quickLinks = [
    { title: 'Create Invoice', description: 'Generate new invoice', icon: FileText, link: '/invoices' },
    { title: 'Log Expense', description: 'Record expense', icon: Receipt, link: '/expenses' },
    { title: 'Track Time', description: 'Log hours', icon: Clock, link: '/time-tracking' },
    { title: 'View Reports', description: 'Analyze data', icon: BarChart3, link: '/reports' },
  ];

  // Mock project progress data
  const projectProgress = [
    { name: 'Website Redesign', progress: 75, hours: 120, budget: 15000 },
    { name: 'Mobile App', progress: 45, hours: 80, budget: 25000 },
    { name: 'Client Portal', progress: 90, hours: 200, budget: 30000 },
  ];

  return (
    <MainLayout title="Dashboard">
      <div className="space-y-4 md:space-y-6">
        {/* Page Header */}
        <div className="hidden md:block">
          <p className="text-muted-foreground">Welcome back! Here's your financial overview.</p>
        </div>

        {/* Stats Grid - 2x2 on mobile */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          {statCards.map((stat) => (
            <Card 
              key={stat.title} 
              className="cursor-pointer transition-all hover:shadow-md active:scale-[0.98] overflow-hidden"
              onClick={() => navigate(stat.link)}
            >
              <CardHeader className="flex flex-row items-center justify-between space-y-0 p-3 pb-1 md:p-6 md:pb-2">
                <CardTitle className="text-xs md:text-sm font-medium text-muted-foreground truncate flex-1 min-w-0 pr-2">
                  {stat.title}
                </CardTitle>
                <div className={`rounded-lg p-1.5 md:p-2 ${stat.bgColor} ${stat.borderColor} border shrink-0`}>
                  <stat.icon className={`h-4 w-4 md:h-5 md:w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
                {isLoading ? (
                  <Skeleton className="h-6 md:h-8 w-16 md:w-24" />
                ) : (
                  <>
                    <div className="text-lg md:text-2xl font-bold truncate">{stat.value}</div>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`flex items-center text-[10px] md:text-xs font-medium shrink-0 ${stat.trendUp ? 'text-green-600' : 'text-destructive'}`}>
                        {stat.trendUp ? <TrendingUp className="h-3 w-3 mr-0.5" /> : <TrendingDown className="h-3 w-3 mr-0.5" />}
                        {stat.trend}
                      </span>
                      <span className="text-[10px] md:text-xs text-muted-foreground hidden sm:inline truncate">vs last month</span>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {/* Alerts */}
          {(stats?.overdueInvoices || stats?.pendingApprovals) && (
            <Card className="lg:col-span-2">
              <CardHeader className="p-3 pb-2 md:p-6 md:pb-3">
                <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                  <AlertTriangle className="h-4 w-4 md:h-5 md:w-5 text-amber-500" />
                  Attention Required
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 md:p-6 md:pt-0 space-y-2 md:space-y-3">
                {stats?.overdueInvoices && stats.overdueInvoices > 0 && (
                  <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-destructive text-sm">Overdue Invoices</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.overdueInvoices} invoice(s) past due
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="ml-2 shrink-0 border-destructive text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => navigate('/invoices')}
                    >
                      View
                    </Button>
                  </div>
                )}
                {stats?.pendingApprovals && stats.pendingApprovals > 0 && (
                  <div className="flex items-center justify-between rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <div className="min-w-0 flex-1">
                      <p className="font-medium text-amber-600 text-sm">Pending Approvals</p>
                      <p className="text-xs text-muted-foreground">
                        {stats.pendingApprovals} request(s) need review
                      </p>
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="ml-2 shrink-0"
                      onClick={() => navigate('/approvals')}
                    >
                      Review
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Quick Actions */}
          <Card>
            <CardHeader className="p-3 pb-2 md:p-6 md:pb-3">
              <CardTitle className="text-sm md:text-base">Quick Actions</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0 space-y-2">
              {quickLinks.map((link) => (
                <button
                  key={link.title}
                  onClick={() => navigate(link.link)}
                  className="flex w-full items-center gap-3 rounded-lg border p-3 text-left transition-colors hover:bg-accent active:scale-[0.98]"
                >
                  <div className="rounded-lg bg-primary/10 p-2">
                    <link.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{link.title}</p>
                    <p className="text-xs text-muted-foreground">{link.description}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-muted-foreground" />
                </button>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Project Progress Section */}
        <Card>
          <CardHeader className="p-3 pb-2 md:p-6 md:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <Users className="h-4 w-4 md:h-5 md:w-5" />
              Project Progress
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="grid gap-4 md:grid-cols-3">
              {projectProgress.map((project) => (
                <div key={project.name} className="rounded-lg border p-4 space-y-3 overflow-hidden">
                  <div className="flex items-center justify-between gap-2">
                    <h4 className="font-medium text-sm truncate flex-1 min-w-0">{project.name}</h4>
                    <span className="text-lg font-bold text-primary shrink-0">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                  <div className="flex justify-between text-xs text-muted-foreground gap-2">
                    <span className="truncate">{project.hours}h logged</span>
                    <span className="shrink-0">₹{project.budget.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
