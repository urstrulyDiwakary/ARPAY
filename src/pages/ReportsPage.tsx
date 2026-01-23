import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { reportApi, expenseApi, invoiceApi, paymentApi } from '@/services/api';
import { ReportType } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  Download, 
  FileSpreadsheet, 
  BarChart3, 
  TrendingUp, 
  DollarSign, 
  Receipt, 
  CreditCard,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  FileText,
  Building2,
  CheckCircle,
  Clock,
  Award
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToCSV } from '@/utils/export';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
  AreaChart,
  Area,
} from 'recharts';

const CHART_COLORS = [
  'hsl(234, 89%, 73%)',   // indigo
  'hsl(160, 84%, 39%)',   // emerald
  'hsl(38, 92%, 50%)',    // amber
  'hsl(280, 87%, 65%)',   // purple
  'hsl(199, 89%, 48%)',   // cyan
  'hsl(346, 77%, 49%)',   // rose
  'hsl(174, 72%, 56%)',   // teal
  'hsl(45, 93%, 47%)',    // yellow
];

export default function ReportsPage() {
  const [reportType, setReportType] = useState<ReportType>('revenue');
  const [dateRange, setDateRange] = useState({
    start: '2024-01-01',
    end: '2024-12-31',
  });
  const { toast } = useToast();

  const { data: revenueData, isLoading: isRevenueLoading } = useQuery({
    queryKey: ['reports', 'revenue', dateRange],
    queryFn: () => reportApi.getRevenueData(dateRange.start, dateRange.end),
  });

  const { data: expenseData, isLoading: isExpenseLoading } = useQuery({
    queryKey: ['reports', 'expenses', dateRange],
    queryFn: () => reportApi.getExpenseData(dateRange.start, dateRange.end),
  });

  const { data: expenses } = useQuery({
    queryKey: ['expenses'],
    queryFn: expenseApi.getAll,
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: invoiceApi.getAll,
  });

  const { data: payments } = useQuery({
    queryKey: ['payments'],
    queryFn: paymentApi.getAll,
  });

  const isLoading = isRevenueLoading || isExpenseLoading;

  // Calculate summary stats
  const totalRevenue = invoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
  const totalExpenses = expenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;
  const netProfit = totalRevenue - totalExpenses;
  const totalPayments = payments?.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0) || 0;
  const pendingPayments = payments?.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0) || 0;
  const pendingApprovals = expenses?.filter(e => e.status === 'Pending').length || 0;

  // Best performing property (mock data)
  const bestProperty = { name: 'Property A', revenue: 85000, growth: '+15%' };

  // Payment mode distribution data
  const paymentModeDistribution = [
    { name: 'Credit Card', value: payments?.filter(p => p.method === 'Credit Card').reduce((sum, p) => sum + p.amount, 0) || 0 },
    { name: 'Bank Transfer', value: payments?.filter(p => p.method === 'Bank Transfer').reduce((sum, p) => sum + p.amount, 0) || 0 },
    { name: 'Cash', value: payments?.filter(p => p.method === 'Cash').reduce((sum, p) => sum + p.amount, 0) || 0 },
    { name: 'Check', value: payments?.filter(p => p.method === 'Check').reduce((sum, p) => sum + p.amount, 0) || 0 },
  ].filter(d => d.value > 0);

  // Profit analysis data
  const profitAnalysisData = [
    { month: 'Jan', profit: 13000 },
    { month: 'Feb', profit: 24000 },
    { month: 'Mar', profit: 13000 },
    { month: 'Apr', profit: 32000 },
    { month: 'May', profit: 21000 },
    { month: 'Jun', profit: netProfit > 0 ? netProfit : 36000 },
  ];

  // Prepare chart data
  const chartData = (reportType === 'revenue' ? revenueData : expenseData)?.map(item => ({
    name: item.name,
    value: item.value,
  })) || [];

  // Category breakdown for pie chart
  const categoryData = expenses?.reduce((acc, exp) => {
    const existing = acc.find(item => item.name === exp.category);
    if (existing) {
      existing.value += exp.amount;
    } else {
      acc.push({ name: exp.category, value: exp.amount });
    }
    return acc;
  }, [] as { name: string; value: number }[]) || [];

  // Monthly trend data
  const monthlyTrend = [
    { month: 'Jan', revenue: 45000, expenses: 32000 },
    { month: 'Feb', revenue: 52000, expenses: 28000 },
    { month: 'Mar', revenue: 48000, expenses: 35000 },
    { month: 'Apr', revenue: 61000, expenses: 29000 },
    { month: 'May', revenue: 55000, expenses: 34000 },
    { month: 'Jun', revenue: 67000, expenses: 31000 },
  ];

  const handleExportReport = () => {
    const data = reportType === 'revenue' ? revenueData : expenseData;
    if (!data || data.length === 0) {
      toast({
        title: 'No Data',
        description: 'No data available to export.',
        variant: 'destructive',
      });
      return;
    }

    exportToCSV(
      data,
      `${reportType}-report-${dateRange.start}-${dateRange.end}`,
      [
        { key: 'name', label: 'Name' },
        { key: 'category', label: 'Category' },
        { key: 'date', label: 'Date' },
        { key: 'value', label: 'Amount' },
      ]
    );

    toast({
      title: 'Export Complete',
      description: 'Your report has been downloaded as CSV.',
    });
  };

  const handleExportInvoices = () => {
    if (!invoices || invoices.length === 0) {
      toast({
        title: 'No Data',
        description: 'No invoices available to export.',
        variant: 'destructive',
      });
      return;
    }

    exportToCSV(
      invoices,
      `invoices-export-${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Invoice ID' },
        { key: 'customerName', label: 'Customer' },
        { key: 'totalAmount', label: 'Amount' },
        { key: 'status', label: 'Status' },
        { key: 'dueDate', label: 'Due Date' },
      ]
    );

    toast({
      title: 'Export Complete',
      description: 'Invoices exported successfully.',
    });
  };

  const handleExportExpenses = () => {
    if (!expenses || expenses.length === 0) {
      toast({
        title: 'No Data',
        description: 'No expenses available to export.',
        variant: 'destructive',
      });
      return;
    }

    exportToCSV(
      expenses,
      `expenses-export-${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Expense ID' },
        { key: 'category', label: 'Category' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
        { key: 'date', label: 'Date' },
        { key: 'notes', label: 'Notes' },
      ]
    );

    toast({
      title: 'Export Complete',
      description: 'Expenses exported successfully.',
    });
  };

  return (
    <MainLayout title="Reports">
      <div className="space-y-4 md:space-y-6">
        {/* Header with Export */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">Generate and export financial reports</p>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleExportInvoices}>
              <FileText className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Invoices</span>
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportExpenses}>
              <Receipt className="mr-1 h-4 w-4" />
              <span className="hidden sm:inline">Expenses</span>
            </Button>
            <Button size="sm" onClick={handleExportReport}>
              <Download className="mr-1 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>

        {/* Summary Cards - Row 1 */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 overflow-hidden">
            <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2">
                <TrendingUp className="h-3 w-3 md:h-4 md:w-4 text-green-600 shrink-0" />
                <span className="truncate">Revenue</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-lg md:text-2xl font-bold text-green-600 truncate">
                ₹{totalRevenue.toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">+12% from last month</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-600/5 border-orange-500/20 overflow-hidden">
            <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2">
                <Receipt className="h-3 w-3 md:h-4 md:w-4 text-orange-600 shrink-0" />
                <span className="truncate">Expenses</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-lg md:text-2xl font-bold text-orange-600 truncate">
                ₹{totalExpenses.toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">-5% from last month</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 overflow-hidden">
            <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2">
                <DollarSign className="h-3 w-3 md:h-4 md:w-4 text-emerald-600 shrink-0" />
                <span className="truncate">Net Profit</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className={`text-lg md:text-2xl font-bold truncate ${netProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                ₹{netProfit.toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">Net earnings</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 overflow-hidden">
            <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2">
                <CreditCard className="h-3 w-3 md:h-4 md:w-4 text-blue-600 shrink-0" />
                <span className="truncate">Received</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-lg md:text-2xl font-bold text-blue-600 truncate">
                ₹{totalPayments.toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">Completed payments</p>
            </CardContent>
          </Card>
        </div>

        {/* Summary Cards - Row 2 */}
        <div className="grid grid-cols-3 gap-3 md:gap-4">
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 overflow-hidden">
            <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2">
                <Clock className="h-3 w-3 md:h-4 md:w-4 text-amber-600 shrink-0" />
                <span className="truncate">Pending</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-lg md:text-2xl font-bold text-amber-600 truncate">{pendingApprovals}</div>
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">Awaiting approval</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 overflow-hidden">
            <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2">
                <Award className="h-3 w-3 md:h-4 md:w-4 text-purple-600 shrink-0" />
                <span className="truncate">Best Property</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-base md:text-xl font-bold text-purple-600 truncate">{bestProperty.name}</div>
              <p className="text-[10px] md:text-xs text-green-600 truncate">{bestProperty.growth} growth</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-rose-500/10 to-rose-600/5 border-rose-500/20 overflow-hidden">
            <CardHeader className="pb-2 p-3 md:p-6 md:pb-2">
              <CardTitle className="text-xs md:text-sm font-medium flex items-center gap-1 md:gap-2">
                <Building2 className="h-3 w-3 md:h-4 md:w-4 text-rose-600 shrink-0" />
                <span className="truncate">Property Rev</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="text-lg md:text-2xl font-bold text-rose-600 truncate">
                ₹{bestProperty.revenue.toLocaleString('en-IN')}
              </div>
              <p className="text-[10px] md:text-xs text-muted-foreground truncate">Top performer</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="pb-3 p-3 md:p-6 md:pb-3">
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <FileSpreadsheet className="h-4 w-4" />
              Report Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Report Type</Label>
                <Select value={reportType} onValueChange={(value: ReportType) => setReportType(value)}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="revenue">Revenue Report</SelectItem>
                    <SelectItem value="expenses">Expense Report</SelectItem>
                    <SelectItem value="payments">Payments Report</SelectItem>
                    <SelectItem value="time">Time Report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Start Date</Label>
                <Input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                  className="mt-1"
                />
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">End Date</Label>
                <Input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                  className="mt-1"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Revenue vs Expenses Trend */}
          <Card className="lg:col-span-2">
            <CardHeader className="p-3 md:p-6 pb-2 md:pb-2">
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <LineChartIcon className="h-4 w-4 md:h-5 md:w-5" />
                Revenue vs Expenses Trend
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Monthly comparison of revenue and expenses
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="h-[250px] md:h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrend}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" className="text-[10px] md:text-xs" tick={{ fontSize: 10 }} />
                    <YAxis className="text-[10px] md:text-xs" tick={{ fontSize: 10 }} tickFormatter={(value) => `₹${value / 1000}k`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '12px' }} />
                    <Area 
                      type="monotone" 
                      dataKey="revenue" 
                      stackId="1"
                      stroke="hsl(var(--chart-2))" 
                      fill="hsl(var(--chart-2))"
                      fillOpacity={0.6}
                      name="Revenue"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="expenses" 
                      stackId="2"
                      stroke="hsl(var(--chart-3))" 
                      fill="hsl(var(--chart-3))"
                      fillOpacity={0.6}
                      name="Expenses"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Bar Chart */}
          <Card>
            <CardHeader className="p-3 md:p-6 pb-2 md:pb-2">
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <BarChart3 className="h-4 w-4 md:h-5 md:w-5" />
                {reportType === 'revenue' ? 'Revenue by Source' : 'Expenses by Category'}
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Breakdown of your {reportType} data
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              {isLoading ? (
                <Skeleton className="h-[200px] md:h-[250px] w-full" />
              ) : (
                <div className="h-[200px] md:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" className="text-[10px]" tick={{ fontSize: 10 }} />
                      <YAxis className="text-[10px]" tick={{ fontSize: 10 }} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))',
                          borderColor: 'hsl(var(--border))',
                          borderRadius: 'var(--radius)',
                          fontSize: '12px',
                        }}
                        formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                      />
                      <Bar 
                        dataKey="value" 
                        fill="hsl(var(--primary))" 
                        radius={[4, 4, 0, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Pie Chart - Expense Categories */}
          <Card>
            <CardHeader className="p-3 md:p-6 pb-2 md:pb-2">
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <PieChartIcon className="h-4 w-4 md:h-5 md:w-5" />
                Expense Distribution
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Breakdown by category
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="h-[220px] md:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="40%"
                      innerRadius={35}
                      outerRadius={60}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {categoryData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))',
                        borderColor: 'hsl(var(--border))',
                        borderRadius: 'var(--radius)',
                        fontSize: '12px',
                      }}
                      formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                    />
                    <Legend 
                      wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }}
                      iconSize={8}
                      layout="horizontal"
                      verticalAlign="bottom"
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* New Row - Profit Analysis & Payment Mode Distribution */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="p-3 md:p-6 pb-2 md:pb-2">
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <TrendingUp className="h-4 w-4 md:h-5 md:w-5 text-emerald-500" />
                Profit Analysis
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Monthly profit trends
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="h-[220px] md:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={profitAnalysisData}>
                    <defs>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(160, 84%, 39%)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: '12px' }}
                      formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Profit']}
                    />
                    <Area type="monotone" dataKey="profit" stroke="hsl(160, 84%, 39%)" fill="url(#profitGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="p-3 md:p-6 pb-2 md:pb-2">
              <CardTitle className="flex items-center gap-2 text-sm md:text-base">
                <CreditCard className="h-4 w-4 md:h-5 md:w-5 text-indigo-500" />
                Payment Mode Distribution
              </CardTitle>
              <CardDescription className="text-xs md:text-sm">
                Breakdown by payment method
              </CardDescription>
            </CardHeader>
            <CardContent className="p-3 pt-0 md:p-6 md:pt-0">
              <div className="h-[220px] md:h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={paymentModeDistribution}
                      cx="50%"
                      cy="45%"
                      innerRadius={40}
                      outerRadius={65}
                      paddingAngle={3}
                      dataKey="value"
                      label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                      labelLine={false}
                    >
                      {paymentModeDistribution.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))', borderRadius: 'var(--radius)', fontSize: '12px' }}
                      formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
                    />
                    <Legend wrapperStyle={{ fontSize: '10px' }} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-friendly Data Cards */}
        <Card className="md:hidden">
          <CardHeader className="p-3 pb-2">
            <CardTitle className="text-sm">Report Summary</CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 space-y-3">
            {isLoading ? (
              [...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)
            ) : (
              chartData.slice(0, 5).map((item, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card">
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                    />
                    <span className="text-sm font-medium">{item.name}</span>
                  </div>
                  <span className="text-sm font-bold">₹{item.value.toLocaleString('en-IN')}</span>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        {/* Desktop Data Table */}
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>Detailed Report Data</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Name</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium text-right">Value</th>
                  </tr>
                </thead>
                <tbody>
                  {(reportType === 'revenue' ? revenueData : expenseData)?.map((item) => (
                    <tr key={item.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{item.name}</td>
                      <td className="py-3">{item.category}</td>
                      <td className="py-3">{item.date}</td>
                      <td className="py-3 text-right font-medium">
                        ₹{item.value.toLocaleString('en-IN')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
