import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { expenseApi } from '@/services/api';
import { Expense, ExpenseCategory, ExpenseAttachment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { Plus, Pencil, Trash2, Loader2, Filter, Download, Upload, X, FileText, Image, File, Wallet, Clock, TrendingUp, Building2, CreditCard, Banknote, Car, Fuel, Users, DollarSign, CheckCircle, AlertCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToCSV } from '@/utils/export';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

const categoryColors: Record<ExpenseCategory, string> = {
  Travel: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Office: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  Marketing: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  Equipment: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  Salary: 'bg-green-500/10 text-green-600 border-green-500/20',
  Fuel: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Vehicle: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  Other: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const statusColors: Record<Expense['status'], string> = {
  Approved: 'bg-green-500/10 text-green-600 border-green-500/20',
  Pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

const categories: ExpenseCategory[] = ['Travel', 'Office', 'Marketing', 'Equipment', 'Salary', 'Fuel', 'Vehicle', 'Other'];

const CHART_COLORS = [
  'hsl(234, 89%, 73%)',   // chart-1 - indigo
  'hsl(160, 84%, 39%)',   // chart-2 - emerald
  'hsl(38, 92%, 50%)',    // chart-3 - amber
  'hsl(280, 87%, 65%)',   // chart-4 - purple
  'hsl(199, 89%, 48%)',   // chart-5 - cyan
  'hsl(346, 77%, 49%)',   // chart-6 - rose
  'hsl(174, 72%, 56%)',   // chart-7 - teal
  'hsl(45, 93%, 47%)',    // chart-8 - yellow
];

export default function ExpensesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'Other' as ExpenseCategory,
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'Pending' as Expense['status'],
    paymentMode: 'Cash' as Expense['paymentMode'],
    attachments: [] as ExpenseAttachment[],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: expenseApi.getAll,
  });

  const filteredExpenses = expenses?.filter((expense) => {
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && expense.status !== statusFilter) return false;
    return true;
  });

  const createMutation = useMutation({
    mutationFn: expenseApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Success', description: 'Expense added successfully.' });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Expense> }) =>
      expenseApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Success', description: 'Expense updated successfully.' });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: expenseApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Success', description: 'Expense deleted successfully.' });
      setIsDeleteDialogOpen(false);
      setSelectedExpense(null);
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedExpense(null);
    setFormData({
      category: 'Other',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      status: 'Pending',
      paymentMode: 'Cash',
      attachments: [],
    });
  };

  const openCreateDialog = () => {
    setSelectedExpense(null);
    setFormData({
      category: 'Other',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      status: 'Pending',
      paymentMode: 'Cash',
      attachments: [],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setFormData({
      category: expense.category,
      amount: expense.amount,
      date: expense.date,
      notes: expense.notes,
      status: expense.status,
      paymentMode: expense.paymentMode || 'Cash',
      attachments: expense.attachments || [],
    });
    setIsDialogOpen(true);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: ExpenseAttachment[] = [];
    Array.from(files).forEach((file) => {
      const fileType = file.type.startsWith('image/') ? 'image' : 
                       file.type === 'application/pdf' ? 'pdf' : 'document';
      newAttachments.push({
        id: Date.now().toString() + Math.random().toString(36).substring(7),
        name: file.name,
        type: fileType,
        url: URL.createObjectURL(file),
        size: file.size,
      });
    });

    setFormData({
      ...formData,
      attachments: [...formData.attachments, ...newAttachments],
    });
    toast({ title: 'Files Added', description: `${newAttachments.length} file(s) attached.` });
  };

  const removeAttachment = (id: string) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((a) => a.id !== id),
    });
  };

  const getAttachmentIcon = (type: ExpenseAttachment['type']) => {
    switch (type) {
      case 'image': return <Image className="h-4 w-4" />;
      case 'pdf': return <FileText className="h-4 w-4" />;
      default: return <File className="h-4 w-4" />;
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedExpense) {
      updateMutation.mutate({ id: selectedExpense.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;
  const totalExpenses = filteredExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

  // Calculate stats for tabs
  const paidExpenses = expenses?.filter(e => e.status === 'Approved').reduce((sum, e) => sum + e.amount, 0) || 0;
  const pendingExpenses = expenses?.filter(e => e.status === 'Pending').reduce((sum, e) => sum + e.amount, 0) || 0;
  const salaryExpenses = expenses?.filter(e => e.category === 'Salary').reduce((sum, e) => sum + e.amount, 0) || 0;
  const fuelExpenses = expenses?.filter(e => e.category === 'Fuel').reduce((sum, e) => sum + e.amount, 0) || 0;
  const vehicleExpenses = expenses?.filter(e => e.category === 'Vehicle').reduce((sum, e) => sum + e.amount, 0) || 0;
  const highestExpense = expenses?.reduce((max, e) => e.amount > max ? e.amount : max, 0) || 0;

  // Property-wise expenses data (mock data for demonstration)
  const propertyData = [
    { name: 'Property A', value: 25000, fill: CHART_COLORS[0] },
    { name: 'Property B', value: 18000, fill: CHART_COLORS[1] },
    { name: 'Property C', value: 32000, fill: CHART_COLORS[2] },
    { name: 'Property D', value: 15000, fill: CHART_COLORS[3] },
    { name: 'Property E', value: 22000, fill: CHART_COLORS[4] },
  ];

  // Chart Data
  const categoryData = categories.map((cat, index) => ({
    name: cat,
    value: expenses?.filter(e => e.category === cat).reduce((sum, e) => sum + e.amount, 0) || 0,
    fill: CHART_COLORS[index % CHART_COLORS.length],
  })).filter(d => d.value > 0);

  const monthlyTrendData = [
    { month: 'Jan', amount: 4500 },
    { month: 'Feb', amount: 3800 },
    { month: 'Mar', amount: 5200 },
    { month: 'Apr', amount: 4100 },
    { month: 'May', amount: 4800 },
    { month: 'Jun', amount: totalExpenses },
  ];

  const paymentModeData = [
    { name: 'Cash', value: expenses?.filter(e => e.paymentMode === 'Cash').reduce((sum, e) => sum + e.amount, 0) || 0, fill: '#6366f1' },
    { name: 'Card', value: expenses?.filter(e => e.paymentMode === 'Card').reduce((sum, e) => sum + e.amount, 0) || 0, fill: '#10b981' },
    { name: 'Bank Transfer', value: expenses?.filter(e => e.paymentMode === 'Bank Transfer').reduce((sum, e) => sum + e.amount, 0) || 0, fill: '#f59e0b' },
    { name: 'UPI', value: expenses?.filter(e => e.paymentMode === 'UPI').reduce((sum, e) => sum + e.amount, 0) || 0, fill: '#ec4899' },
  ].filter(d => d.value > 0);

  const handleExportAll = () => {
    if (!filteredExpenses || filteredExpenses.length === 0) {
      toast({ title: 'No Data', description: 'No expenses to export.', variant: 'destructive' });
      return;
    }
    exportToCSV(
      filteredExpenses,
      `expenses-export-${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Expense ID' },
        { key: 'category', label: 'Category' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
        { key: 'paymentMode', label: 'Payment Mode' },
        { key: 'date', label: 'Date' },
        { key: 'notes', label: 'Notes' },
      ]
    );
    toast({ title: 'Exported', description: `${filteredExpenses.length} expenses exported to CSV.` });
  };

  // Tab data for quick filters
  const tabFilters = [
    { id: 'all', label: 'All', count: expenses?.length || 0 },
    { id: 'Approved', label: 'Paid', count: expenses?.filter(e => e.status === 'Approved').length || 0 },
    { id: 'Pending', label: 'Pending', count: expenses?.filter(e => e.status === 'Pending').length || 0 },
    { id: 'Salary', label: 'Salary', count: expenses?.filter(e => e.category === 'Salary').length || 0 },
    { id: 'Fuel', label: 'Fuel', count: expenses?.filter(e => e.category === 'Fuel').length || 0 },
    { id: 'Vehicle', label: 'Vehicle', count: expenses?.filter(e => e.category === 'Vehicle').length || 0 },
  ];

  const handleTabChange = (value: string) => {
    if (value === 'all') {
      setCategoryFilter('all');
      setStatusFilter('all');
    } else if (value === 'Approved' || value === 'Pending') {
      setCategoryFilter('all');
      setStatusFilter(value);
    } else {
      setCategoryFilter(value);
      setStatusFilter('all');
    }
  };

  // Mobile Card Component
  const ExpenseCard = ({ expense }: { expense: Expense }) => (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between">
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className={categoryColors[expense.category]}>
            {expense.category}
          </Badge>
          <Badge variant="outline" className={statusColors[expense.status]}>
            {expense.status}
          </Badge>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(expense)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setSelectedExpense(expense);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div>
          <p className="text-xl font-bold">₹{expense.amount.toLocaleString('en-IN')}</p>
          <p className="text-xs text-muted-foreground">{expense.date}</p>
        </div>
        {expense.notes && (
          <p className="text-xs text-muted-foreground max-w-[50%] text-right truncate">{expense.notes}</p>
        )}
      </div>
    </div>
  );

  return (
    <MainLayout title="Expenses">
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(!isFilterOpen)} className="md:hidden">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={handleExportAll}>
              <Download className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 gap-4">
          {/* Top Row - Area Chart Full Width on Mobile */}
          <Card>
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-sm sm:text-base">Monthly Expense Trend</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="h-[180px] sm:h-[220px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={monthlyTrendData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorAmount" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(234, 89%, 73%)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="hsl(234, 89%, 73%)" stopOpacity={0.05} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                    <XAxis dataKey="month" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} tickFormatter={(v) => `₹${v / 1000}k`} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                        fontSize: '12px'
                      }}
                      formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                    />
                    <Area type="monotone" dataKey="amount" stroke="hsl(234, 89%, 73%)" fill="url(#colorAmount)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
          
          {/* Second Row - 2 Charts Side by Side */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                <CardTitle className="text-sm sm:text-base">Category Distribution</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="h-[200px] sm:h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Pie
                        data={categoryData}
                        cx="50%"
                        cy="45%"
                        innerRadius={35}
                        outerRadius={60}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {categoryData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }} 
                        formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
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

            <Card>
              <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                <CardTitle className="text-sm sm:text-base">Payment Mode Breakdown</CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="h-[200px] sm:h-[220px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={paymentModeData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                      <XAxis dataKey="name" tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                      <YAxis tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }} 
                        formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]}>
                        {paymentModeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
          
          {/* Summary Cards with Icons */}
          <Card className="bg-gradient-to-br from-background to-muted/30">
            <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                Expense Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
                <div className="p-3 bg-gradient-to-br from-green-500/20 to-green-600/10 rounded-lg border border-green-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <p className="text-xs text-muted-foreground">Paid</p>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-green-600">₹{paidExpenses.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-amber-500/20 to-amber-600/10 rounded-lg border border-amber-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Clock className="h-4 w-4 text-amber-600" />
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-amber-600">₹{pendingExpenses.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-blue-500/20 to-blue-600/10 rounded-lg border border-blue-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <Users className="h-4 w-4 text-blue-600" />
                    <p className="text-xs text-muted-foreground">Salary</p>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-blue-600">₹{salaryExpenses.toLocaleString('en-IN')}</p>
                </div>
                <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg border border-purple-500/20">
                  <div className="flex items-center gap-2 mb-1">
                    <TrendingUp className="h-4 w-4 text-purple-600" />
                    <p className="text-xs text-muted-foreground">Highest</p>
                  </div>
                  <p className="text-lg sm:text-xl font-bold text-purple-600">₹{highestExpense.toLocaleString('en-IN')}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* New Row - Property-wise Expenses & Payment Mode Breakdown */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Card>
              <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 sm:h-5 sm:w-5 text-indigo-500" />
                  Property-wise Expenses
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="h-[220px] sm:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={propertyData} layout="vertical" margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" horizontal={true} vertical={false} />
                      <XAxis type="number" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} tickFormatter={(v) => `₹${v / 1000}k`} />
                      <YAxis dataKey="name" type="category" tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} width={70} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }} 
                        formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, 'Amount']}
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                        {propertyData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
                <CardTitle className="text-sm sm:text-base flex items-center gap-2">
                  <CreditCard className="h-4 w-4 sm:h-5 sm:w-5 text-emerald-500" />
                  Payment Mode Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
                <div className="h-[220px] sm:h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <Pie
                        data={paymentModeData}
                        cx="50%"
                        cy="45%"
                        innerRadius={40}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                      >
                        {paymentModeData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: 'hsl(var(--card))', 
                          border: '1px solid hsl(var(--border))',
                          borderRadius: '8px',
                          fontSize: '12px'
                        }} 
                        formatter={(value: number) => [`₹${value.toLocaleString('en-IN')}`, '']}
                      />
                      <Legend 
                        layout="horizontal"
                        verticalAlign="bottom"
                        align="center"
                        wrapperStyle={{ fontSize: '10px', paddingTop: '10px' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Quick Filter Cards with Icons */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {tabFilters.map((tab) => {
            const isActive = (tab.id === 'all' && categoryFilter === 'all' && statusFilter === 'all') ||
                            (tab.id === 'Approved' && statusFilter === 'Approved') ||
                            (tab.id === 'Pending' && statusFilter === 'Pending') ||
                            ((tab.id === 'Salary' || tab.id === 'Fuel' || tab.id === 'Vehicle') && categoryFilter === tab.id);
            
            const colorClasses: Record<string, string> = {
              all: 'ring-primary border-primary bg-gradient-to-br from-primary/10 to-primary/5',
              Approved: 'ring-green-500 border-green-500 bg-gradient-to-br from-green-500/10 to-green-500/5',
              Pending: 'ring-amber-500 border-amber-500 bg-gradient-to-br from-amber-500/10 to-amber-500/5',
              Salary: 'ring-blue-500 border-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-500/5',
              Fuel: 'ring-orange-500 border-orange-500 bg-gradient-to-br from-orange-500/10 to-orange-500/5',
              Vehicle: 'ring-cyan-500 border-cyan-500 bg-gradient-to-br from-cyan-500/10 to-cyan-500/5',
            };
            
            const textColors: Record<string, string> = {
              all: 'text-primary',
              Approved: 'text-green-600',
              Pending: 'text-amber-600',
              Salary: 'text-blue-600',
              Fuel: 'text-orange-600',
              Vehicle: 'text-cyan-600',
            };

            const icons: Record<string, React.ReactNode> = {
              all: <Wallet className={`h-4 w-4 ${isActive ? 'text-primary' : 'text-muted-foreground'}`} />,
              Approved: <CheckCircle className={`h-4 w-4 ${isActive ? 'text-green-600' : 'text-green-500'}`} />,
              Pending: <Clock className={`h-4 w-4 ${isActive ? 'text-amber-600' : 'text-amber-500'}`} />,
              Salary: <Users className={`h-4 w-4 ${isActive ? 'text-blue-600' : 'text-blue-500'}`} />,
              Fuel: <Fuel className={`h-4 w-4 ${isActive ? 'text-orange-600' : 'text-orange-500'}`} />,
              Vehicle: <Car className={`h-4 w-4 ${isActive ? 'text-cyan-600' : 'text-cyan-500'}`} />,
            };
            
            return (
              <Card 
                key={tab.id}
                className={`cursor-pointer transition-all hover:shadow-md ${isActive ? `ring-2 ${colorClasses[tab.id]}` : ''}`}
                onClick={() => handleTabChange(tab.id)}
              >
                <CardContent className="p-2 sm:p-3 flex flex-col items-center text-center">
                  {icons[tab.id]}
                  <p className="text-xs text-muted-foreground mt-1">{tab.label}</p>
                  <p className={`text-base sm:text-lg font-bold ${textColors[tab.id]}`}>{tab.count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Mobile Collapsible Filters */}
        <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen} className="md:hidden">
          <CollapsibleContent>
            <Card className="mb-4">
              <CardContent className="pt-4 space-y-3">
                <div>
                  <Label className="text-xs text-muted-foreground">Category</Label>
                  <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map((cat) => (
                        <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full"
                  onClick={() => {
                    setCategoryFilter('all');
                    setStatusFilter('all');
                  }}
                >
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Desktop Filters */}
        <Card className="hidden md:block">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-base">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-4">
              <div className="w-48">
                <Label className="text-xs text-muted-foreground">Category</Label>
                <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-48">
                <Label className="text-xs text-muted-foreground">Status</Label>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Approved">Approved</SelectItem>
                    <SelectItem value="Rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={() => {
                  setCategoryFilter('all');
                  setStatusFilter('all');
                }}>
                  Clear
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="flex items-center justify-between rounded-lg border bg-card p-3">
          <span className="text-sm text-muted-foreground">
            {filteredExpenses?.length || 0} expenses
          </span>
          <span className="font-semibold">
            Total: ₹{totalExpenses.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
          ) : (
            filteredExpenses?.map((expense) => <ExpenseCard key={expense.id} expense={expense} />)
          )}
        </div>

        {/* Desktop View - Table */}
        <Card className="hidden md:block">
          <CardContent className="pt-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Payment Mode</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses?.map((expense) => (
                    <tr key={expense.id} className="border-b last:border-0">
                      <td className="py-3 font-medium">{expense.id}</td>
                      <td className="py-3">
                        <Badge variant="outline" className={categoryColors[expense.category]}>
                          {expense.category}
                        </Badge>
                      </td>
                      <td className="py-3">₹{expense.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3">{expense.paymentMode || '-'}</td>
                      <td className="py-3">{expense.date}</td>
                      <td className="py-3">
                        <Badge variant="outline" className={statusColors[expense.status]}>
                          {expense.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <Button variant="ghost" size="icon" onClick={() => openEditDialog(expense)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            setSelectedExpense(expense);
                            setIsDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
            <DialogDescription>
              {selectedExpense ? 'Update the expense details.' : 'Enter the expense details below.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category}
                onValueChange={(value: ExpenseCategory) => setFormData({ ...formData, category: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={formData.amount}
                onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="paymentMode">Payment Mode</Label>
              <Select
                value={formData.paymentMode}
                onValueChange={(value: Expense['paymentMode']) => setFormData({ ...formData, paymentMode: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Cash">Cash</SelectItem>
                  <SelectItem value="Card">Card</SelectItem>
                  <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                  <SelectItem value="UPI">UPI</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                rows={3}
              />
            </div>

            {/* Attachments Section */}
            <div className="space-y-3">
              <Label>Attachments</Label>
              <div 
                className="border-2 border-dashed rounded-lg p-4 text-center cursor-pointer hover:border-primary transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  Click to upload receipts, bills, or documents
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx"
                  className="hidden"
                  onChange={handleFileUpload}
                />
              </div>
              {formData.attachments.length > 0 && (
                <div className="space-y-2">
                  {formData.attachments.map((attachment) => (
                    <div key={attachment.id} className="flex items-center gap-2 p-2 bg-muted rounded-lg">
                      {getAttachmentIcon(attachment.type)}
                      <span className="flex-1 text-sm truncate">{attachment.name}</span>
                      <span className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => removeAttachment(attachment.id)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={closeDialog} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={isMutating} className="w-full sm:w-auto">
                {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedExpense ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Expense</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this expense? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedExpense && deleteMutation.mutate(selectedExpense.id)}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
