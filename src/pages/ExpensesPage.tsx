import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { expenseApi, projectMasterApi, generateExpenseNumber } from '@/services/api';
import { userApi } from '@/services/api';
import { Expense, ExpenseCategory, ExpenseAttachment } from '@/types';
import { generateExpensePDF } from '@/utils/expensePdfExport';
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

import { Plus, Pencil, Trash2, Loader2, Filter, Download, Upload, X, FileText, Image, File, Wallet, Clock, TrendingUp, Building2, CreditCard, Banknote, Car, Fuel, Users, DollarSign, CheckCircle, AlertCircle, Eye, DownloadCloud } from 'lucide-react';
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
  TRAVEL: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  OFFICE: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  MARKETING: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
  EQUIPMENT: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  SALARY: 'bg-green-500/10 text-green-600 border-green-500/20',
  FUEL: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  VEHICLE: 'bg-cyan-500/10 text-cyan-600 border-cyan-500/20',
  OTHER: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const statusColors: Record<Expense['status'], string> = {
  APPROVED: 'bg-green-500/10 text-green-600 border-green-500/20',
  PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  REJECTED: 'bg-destructive/10 text-destructive border-destructive/20',
};

const categories: ExpenseCategory[] = ['TRAVEL', 'OFFICE', 'MARKETING', 'EQUIPMENT', 'SALARY', 'FUEL', 'VEHICLE', 'OTHER'];

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

// Order of payment modes for charts
const PAYMENT_MODES: Expense['paymentMode'][] = ['CASH', 'CARD', 'BANK_TRANSFER', 'UPI'];

// Helper function to format enum values for display
const formatForDisplay = (value: string): string => {
  if (!value) return '';
  // Handle special cases like BANK_TRANSFER -> Bank Transfer
  return value
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export default function ExpensesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<Expense | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [formData, setFormData] = useState({
    category: 'OTHER' as ExpenseCategory,
    amount: 0,
    date: new Date().toISOString().split('T')[0],
    notes: '',
    status: 'PENDING' as Expense['status'],
    paymentMode: 'CASH' as Expense['paymentMode'],
    projectName: '' as string,
    invoiceNumber: '' as string,
    attachments: [] as ExpenseAttachment[],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: expenses, isLoading } = useQuery({
    queryKey: ['expenses'],
    queryFn: expenseApi.getAll,
  });
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.getAll,
  });
  const { data: projectMasters = [] } = useQuery({
    queryKey: ['projectMasters'],
    queryFn: projectMasterApi.getAll,
  });

  // Get unique project names from project masters
  const uniqueProjects = useMemo(() => {
    if (!projectMasters) return [];
    return [...new Set(projectMasters.map(m => m.projectName))];
  }, [projectMasters]);

  const filteredExpenses = expenses?.filter((expense) => {
    if (categoryFilter !== 'all' && expense.category !== categoryFilter) return false;
    if (statusFilter !== 'all' && expense.status !== statusFilter) return false;
    return true;
  });

  const createMutation = useMutation({
    mutationFn: (data: Omit<Expense, 'id'>) => {
      console.log('Creating expense:', data);
      return expenseApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Success', description: 'Expense added successfully and saved to database.' });
      closeDialog();
    },
    onError: (error: any) => {
      console.error('Error creating expense:', error);
      const errorMsg = error?.message || 'Failed to save expense to database';
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Expense> }) => {
      console.log('Updating expense:', id, data);
      return expenseApi.update(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Success', description: 'Expense updated successfully in database.' });
      closeDialog();
    },
    onError: (error: any) => {
      console.error('Error updating expense:', error);
      const errorMsg = error?.message || 'Failed to update expense in database';
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: expenseApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['expenses'] });
      toast({ title: 'Success', description: 'Expense deleted successfully from database.' });
      setIsDeleteDialogOpen(false);
      setSelectedExpense(null);
    },
    onError: (error: any) => {
      console.error('Error deleting expense:', error);
      const errorMsg = error?.message || 'Failed to delete expense from database';
      toast({ title: 'Error', description: errorMsg, variant: 'destructive' });
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedExpense(null);
    setFormData({
      category: 'OTHER',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      status: 'PENDING',
      paymentMode: 'CASH',
      projectName: '',
      invoiceNumber: '',
      attachments: [],
    });
  };

  const openCreateDialog = () => {
    setSelectedExpense(null);
    setFormData({
      category: 'OTHER',
      amount: 0,
      date: new Date().toISOString().split('T')[0],
      notes: '',
      status: 'PENDING',
      paymentMode: 'CASH',
      projectName: '',
      invoiceNumber: generateExpenseNumber(), // Auto-generate for new expenses
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
      paymentMode: expense.paymentMode || 'CASH',
      projectName: expense.projectName || '',
      invoiceNumber: expense.invoiceNumber || '',
      attachments: expense.attachments || [],
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = (expense: Expense) => {
    setSelectedExpense(expense);
    setIsViewDialogOpen(true);
  };

  // Constants for file upload
  const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB in bytes
  const MAX_TOTAL_ATTACHMENTS = 10; // Maximum number of attachments per expense

  const getFileTypeFromMimeType = (mimeType: string, fileName: string): ExpenseAttachment['type'] => {
    if (mimeType.startsWith('image/')) return 'image';
    if (mimeType === 'application/pdf') return 'pdf';

    // Check by file extension for documents
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx', 'txt', 'odt', 'rtf'].includes(ext || '')) {
      return 'document';
    }

    return 'document'; // Default to document for unknown types
  };

  const readFileAsDataUrl = (file: File) => new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: ExpenseAttachment[] = [];
    const errors: string[] = [];

    for (const file of Array.from(files)) {
      // Check file size (20MB max)
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name} exceeds 20MB size limit (${formatFileSize(file.size)})`);
        continue;
      }

      // Check total attachment count
      if (formData.attachments.length + newAttachments.length >= MAX_TOTAL_ATTACHMENTS) {
        errors.push(`Maximum ${MAX_TOTAL_ATTACHMENTS} attachments allowed per expense`);
        break;
      }

      const fileType = getFileTypeFromMimeType(file.type, file.name);
      try {
        const dataUrl = await readFileAsDataUrl(file);
        newAttachments.push({
          id: Date.now().toString() + Math.random().toString(36).substring(7),
          name: file.name,
          type: fileType,
          url: dataUrl,
          dataUrl,
          mimeType: file.type || 'application/octet-stream',
          size: file.size,
        });
      } catch {
        errors.push(`Failed to read ${file.name}`);
      }
    }

    // Show errors if any
    if (errors.length > 0) {
      errors.forEach(error => {
        toast({ title: 'File Upload Error', description: error, variant: 'destructive' });
      });
    }

    // Add successfully validated attachments
    if (newAttachments.length > 0) {
      setFormData({
        ...formData,
        attachments: [...formData.attachments, ...newAttachments],
      });
      toast({
        title: 'Files Added',
        description: `${newAttachments.length} file(s) attached (${formatFileSize(newAttachments.reduce((sum, a) => sum + a.size, 0))} total).`
      });
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setFormData({
      ...formData,
      attachments: formData.attachments.filter((a) => a.id !== id),
    });
  };

  const isLikelyBase64 = (value: string) => {
    const trimmed = value.trim();
    return trimmed.length > 0 && trimmed.length % 4 === 0 && /^[A-Za-z0-9+/=\r\n]+$/.test(trimmed);
  };

  const buildDataUrlFromBase64 = (base64: string, mimeType?: string) => {
    const safeMimeType = mimeType && mimeType.trim().length > 0 ? mimeType : 'application/octet-stream';
    return `data:${safeMimeType};base64,${base64}`;
  };

  const getAttachmentDataUrl = (attachment: ExpenseAttachment) => {
    if (attachment.dataUrl?.startsWith('data:')) return attachment.dataUrl;
    if (attachment.url?.startsWith('data:')) return attachment.url;

    if (attachment.dataUrl && isLikelyBase64(attachment.dataUrl)) {
      return buildDataUrlFromBase64(attachment.dataUrl, attachment.mimeType);
    }

    if (attachment.url && isLikelyBase64(attachment.url)) {
      return buildDataUrlFromBase64(attachment.url, attachment.mimeType);
    }

    return null;
  };

  const resolveAttachmentObjectUrl = async (attachment: ExpenseAttachment) => {
    const dataUrl = getAttachmentDataUrl(attachment);
    if (dataUrl) {
      const blob = await fetch(dataUrl).then((response) => response.blob());
      return URL.createObjectURL(blob);
    }

    const href = attachment.url;
    if (!href) return null;

    if (href.startsWith('blob:')) {
      return href;
    }

    if (href.startsWith('http://') || href.startsWith('https://') || href.startsWith('/')) {
      const response = await fetch(href);
      if (!response.ok) throw new Error('Failed to fetch attachment');
      const blob = await response.blob();
      return URL.createObjectURL(blob);
    }

    if (isLikelyBase64(href)) {
      const blob = await fetch(buildDataUrlFromBase64(href, attachment.mimeType)).then((response) => response.blob());
      return URL.createObjectURL(blob);
    }

    return href;
  };

  const downloadAttachment = async (attachment: ExpenseAttachment) => {
    try {
      const objectUrl = await resolveAttachmentObjectUrl(attachment);
      if (!objectUrl) {
        toast({ title: 'Error', description: 'Attachment data not available.', variant: 'destructive' });
        return;
      }

      const link = document.createElement('a');
      link.href = objectUrl;
      link.download = attachment.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      if (objectUrl.startsWith('blob:')) {
        URL.revokeObjectURL(objectUrl);
      }

      toast({ title: 'Downloaded', description: `${attachment.name} downloaded successfully.` });
    } catch (error) {
      console.error('Error downloading attachment:', error);
      toast({ title: 'Error', description: 'Failed to download attachment.', variant: 'destructive' });
    }
  };

  const viewAttachment = async (attachment: ExpenseAttachment) => {
    try {
      const objectUrl = await resolveAttachmentObjectUrl(attachment);
      if (!objectUrl) {
        toast({ title: 'Error', description: 'Attachment data not available.', variant: 'destructive' });
        return;
      }

      window.open(objectUrl, '_blank');

      if (objectUrl.startsWith('blob:')) {
        setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
      }

      toast({ title: 'Opening', description: `Opening ${attachment.name}...` });
    } catch (error) {
      console.error('Error viewing attachment:', error);
      toast({ title: 'Error', description: 'Failed to view attachment.', variant: 'destructive' });
    }
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

  // Download expense as PDF
  const handleDownloadExpense = (expense: Expense) => {
    const expenseNumber = expense.invoiceNumber || 'AR-EXP-000'; // Should always have invoiceNumber
    try {
      generateExpensePDF(expense, expenseNumber);
      toast({ title: 'Downloaded', description: `${expenseNumber} downloaded successfully as PDF.` });
    } catch (error) {
      console.error('Error generating PDF:', error);
      toast({ title: 'Error', description: 'Failed to generate PDF. Please try again.', variant: 'destructive' });
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedExpense) {
      // When editing, don't include invoiceNumber (it's read-only)
      const { invoiceNumber, ...dataToUpdate } = formData;
      updateMutation.mutate({ id: selectedExpense.id, data: dataToUpdate });
    } else {
      // When creating, formData already has the auto-generated invoiceNumber
      createMutation.mutate(formData);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;
  const totalExpenses = filteredExpenses?.reduce((sum, exp) => sum + exp.amount, 0) || 0;

  // Calculate stats for tabs
  const totalAllExpenses = expenses?.reduce((sum, e) => sum + e.amount, 0) || 0;
  const paidExpenses = expenses?.filter(e => e.status === 'APPROVED').reduce((sum, e) => sum + e.amount, 0) || 0;
  const pendingExpenses = expenses?.filter(e => e.status === 'PENDING').reduce((sum, e) => sum + e.amount, 0) || 0;
  const salaryExpenses = expenses?.filter(e => e.category === 'SALARY').reduce((sum, e) => sum + e.amount, 0) || 0;
  const fuelExpenses = expenses?.filter(e => e.category === 'FUEL').reduce((sum, e) => sum + e.amount, 0) || 0;
  const vehicleExpenses = expenses?.filter(e => e.category === 'VEHICLE').reduce((sum, e) => sum + e.amount, 0) || 0;
  const highestExpense = expenses?.reduce((max, e) => e.amount > max ? e.amount : max, 0) || 0;

  // Property-wise and trend data derived from real expenses
  const propertyData = useMemo(() => {
    if (!expenses) return [];
    const totals = new Map<string, number>();
    expenses.forEach((expense) => {
      if (!expense.property) return;
      totals.set(expense.property, (totals.get(expense.property) || 0) + expense.amount);
    });
    return Array.from(totals.entries()).map(([name, value], index) => ({
      name,
      value,
      fill: CHART_COLORS[index % CHART_COLORS.length],
    }));
  }, [expenses]);

  const monthlyTrendData = useMemo(() => {
    if (!expenses) return [];
    const monthlyTotals = new Map<string, { label: string; total: number }>();

    expenses.forEach((expense) => {
      const date = new Date(expense.date);
      if (Number.isNaN(date.getTime())) return;
      const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const label = date.toLocaleString('en-US', { month: 'short' });
      const current = monthlyTotals.get(key)?.total || 0;
      monthlyTotals.set(key, { label, total: current + expense.amount });
    });

    return Array.from(monthlyTotals.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([, { label, total }]) => ({ month: label, amount: total }));
  }, [expenses]);

  // Chart Data
  const paymentModeData = useMemo(() => {
    if (!expenses) return [];
    return PAYMENT_MODES.map((mode, index) => {
      const value = expenses.filter((e) => e.paymentMode === mode).reduce((sum, e) => sum + e.amount, 0);
      return {
        name: formatForDisplay(mode),
        value,
        fill: CHART_COLORS[index % CHART_COLORS.length],
      };
    }).filter((entry) => entry.value > 0);
  }, [expenses]);

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


  // Mobile Card Component
  const ExpenseCard = ({ expense }: { expense: Expense }) => {
    return (
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-muted-foreground">Expense #{expense.invoiceNumber}</p>
            <div className="flex gap-2 flex-wrap mt-2">
              {expense.projectName && (
                <Badge variant="outline" className="bg-indigo-500/10 text-indigo-600 border-indigo-500/20">
                  {expense.projectName}
                </Badge>
              )}
              <Badge variant="outline" className={categoryColors[expense.category]}>
                {formatForDisplay(expense.category)}
              </Badge>
              <Badge variant="outline" className={statusColors[expense.status]}>
                {formatForDisplay(expense.status)}
              </Badge>
            </div>
          </div>
        </div>
        <div className="flex items-end justify-between">
          <div>
            <p className="text-xl font-bold">₹{expense.amount.toLocaleString('en-IN')}</p>
            <p className="text-xs text-muted-foreground">{expense.date}</p>
          </div>
          {expense.notes && (
            <p className="text-xs text-muted-foreground max-w-[40%] text-right truncate">{expense.notes}</p>
          )}
        </div>
        <div className="flex gap-1 pt-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => openViewDialog(expense)}
            title="View"
          >
            <Eye className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => openEditDialog(expense)}
            title="Edit"
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => handleDownloadExpense(expense)}
            title="Download"
          >
            <DownloadCloud className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setSelectedExpense(expense);
              setIsDeleteDialogOpen(true);
            }}
            title="Delete"
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    );
  };

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

        {/* Summary Cards with Icons */}
        <Card className="bg-gradient-to-br from-background to-muted/30">
          <CardHeader className="pb-2 p-3 sm:p-6 sm:pb-2">
            <CardTitle className="text-sm sm:text-base flex items-center gap-2">
              <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
              Expense Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-7 gap-2 sm:gap-3">
              <div className="p-3 bg-gradient-to-br from-primary/15 to-primary/5 rounded-lg border border-primary/20">
                <div className="flex items-center gap-2 mb-1">
                  <Wallet className="h-4 w-4 text-primary" />
                  <p className="text-xs text-muted-foreground">All</p>
                </div>
                <p className="text-lg sm:text-xl font-bold text-primary">₹{totalAllExpenses.toLocaleString('en-IN')}</p>
              </div>
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
              <div className="p-3 bg-gradient-to-br from-orange-500/20 to-orange-600/10 rounded-lg border border-orange-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Fuel className="h-4 w-4 text-orange-600" />
                  <p className="text-xs text-muted-foreground">Fuel</p>
                </div>
                <p className="text-lg sm:text-xl font-bold text-orange-600">₹{fuelExpenses.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-cyan-500/20 to-cyan-600/10 rounded-lg border border-cyan-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <Car className="h-4 w-4 text-cyan-600" />
                  <p className="text-xs text-muted-foreground">Vehicle Service</p>
                </div>
                <p className="text-lg sm:text-xl font-bold text-cyan-600">₹{vehicleExpenses.toLocaleString('en-IN')}</p>
              </div>
              <div className="p-3 bg-gradient-to-br from-purple-500/20 to-purple-600/10 rounded-lg border border-purple-500/20">
                <div className="flex items-center gap-2 mb-1">
                  <TrendingUp className="h-4 w-4 text-purple-600" />
                  <p className="text-xs text-muted-foreground">Highest Expense</p>
                </div>
                <p className="text-lg sm:text-xl font-bold text-purple-600">₹{highestExpense.toLocaleString('en-IN')}</p>
              </div>
            </div>
          </CardContent>
        </Card>

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
            {/* Empty - placeholder for layout */}
          </div>

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
                        <SelectItem key={cat} value={cat}>{formatForDisplay(cat)}</SelectItem>
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
                      <SelectItem key={cat} value={cat}>{formatForDisplay(cat)}</SelectItem>
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
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="APPROVED">Approved</SelectItem>
                    <SelectItem value="REJECTED">Rejected</SelectItem>
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
                    <th className="pb-3 font-medium">Expense No</th>
                    <th className="pb-3 font-medium">Project Name</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Payment Mode</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredExpenses?.map((expense) => {
                    return (
                      <tr key={expense.id} className="border-b last:border-0">
                        <td className="py-3 font-medium text-sm">{expense.invoiceNumber}</td>
                        <td className="py-3">{expense.projectName ? expense.projectName : '-'}</td>
                        <td className="py-3">
                          <Badge variant="outline" className={categoryColors[expense.category]}>
                            {formatForDisplay(expense.category)}
                          </Badge>
                        </td>
                        <td className="py-3">₹{expense.amount.toLocaleString('en-IN')}</td>
                        <td className="py-3">{expense.paymentMode ? formatForDisplay(expense.paymentMode) : '-'}</td>
                        <td className="py-3">{expense.date}</td>
                        <td className="py-3">
                          <Badge variant="outline" className={statusColors[expense.status]}>
                            {formatForDisplay(expense.status)}
                          </Badge>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex gap-1 justify-end">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openViewDialog(expense)}
                              title="View"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => openEditDialog(expense)}
                              title="Edit"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDownloadExpense(expense)}
                              title="Download"
                            >
                              <DownloadCloud className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => {
                                setSelectedExpense(expense);
                                setIsDeleteDialogOpen(true);
                              }}
                              title="Delete"
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
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
            <DialogTitle>
              {selectedExpense ? 'Edit Expense' : 'Add Expense'}
            </DialogTitle>
            {selectedExpense && selectedExpense.invoiceNumber && (
              <div className="text-sm font-semibold text-primary mt-1">
                Expense No: {selectedExpense.invoiceNumber}
              </div>
            )}
            <DialogDescription>
              {selectedExpense ? 'Update the expense details.' : 'Enter the expense details below.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="projectName">Project Name</Label>
              <Select
                value={formData.projectName || ""}
                onValueChange={(value: string) => setFormData({ ...formData, projectName: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a project" />
                </SelectTrigger>
                <SelectContent>
                  {uniqueProjects.map((project) => (
                    <SelectItem key={project} value={project}>{project}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
                    <SelectItem key={cat} value={cat}>{formatForDisplay(cat)}</SelectItem>
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
                  <SelectItem value="CASH">Cash</SelectItem>
                  <SelectItem value="CARD">Card</SelectItem>
                  <SelectItem value="BANK_TRANSFER">Bank Transfer</SelectItem>
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
                    <div key={attachment.id} className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
                      {getAttachmentIcon(attachment.type)}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{attachment.name}</p>
                        <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => viewAttachment(attachment)}
                          title="View attachment"
                        >
                          <Eye className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => downloadAttachment(attachment)}
                          title="Download attachment"
                        >
                          <Download className="h-3 w-3" />
                        </Button>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2 text-destructive hover:text-destructive"
                          onClick={() => removeAttachment(attachment.id)}
                          title="Remove attachment"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
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

      {/* View Expense Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedExpense?.invoiceNumber || 'Expense Details'}
            </DialogTitle>
            <DialogDescription>
              Expense Details
            </DialogDescription>
          </DialogHeader>
          {selectedExpense && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground">Date</p>
                  <p className="font-semibold">{selectedExpense.date}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="font-semibold">{formatForDisplay(selectedExpense.category)}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Amount</p>
                  <p className="font-semibold text-lg">₹{selectedExpense.amount.toLocaleString('en-IN')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Payment Mode</p>
                  <p className="font-semibold">{selectedExpense.paymentMode ? formatForDisplay(selectedExpense.paymentMode) : '-'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant="outline" className={statusColors[selectedExpense.status]}>
                    {formatForDisplay(selectedExpense.status)}
                  </Badge>
                </div>
                {selectedExpense.projectName && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground">Project Name</p>
                    <p className="font-semibold">{selectedExpense.projectName}</p>
                  </div>
                )}
              </div>

              {selectedExpense.notes && (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Notes</p>
                  <p className="text-sm bg-muted p-3 rounded-lg">{selectedExpense.notes}</p>
                </div>
              )}

              {selectedExpense.attachments && selectedExpense.attachments.length > 0 && (
                <div className="border-t pt-4">
                  <p className="text-xs text-muted-foreground mb-2">Attachments ({selectedExpense.attachments.length})</p>
                  <div className="space-y-2">
                    {selectedExpense.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-2 p-3 bg-muted rounded-lg border border-border">
                        {getAttachmentIcon(attachment.type)}
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{attachment.name}</p>
                          <p className="text-xs text-muted-foreground">{formatFileSize(attachment.size)}</p>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => viewAttachment(attachment)}
                            title="View attachment"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="h-8 px-2"
                            onClick={() => downloadAttachment(attachment)}
                            title="Download attachment"
                          >
                            <Download className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <DialogFooter className="border-t pt-4 flex-col sm:flex-row gap-2">
                <Button
                  variant="outline"
                  onClick={() => setIsViewDialogOpen(false)}
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
                <Button
                  variant="default"
                  onClick={() => handleDownloadExpense(selectedExpense)}
                  className="w-full sm:w-auto"
                >
                  <DownloadCloud className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </DialogFooter>
            </div>
          )}
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
