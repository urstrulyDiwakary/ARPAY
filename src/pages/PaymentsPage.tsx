import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { paymentApi, invoiceApi } from '@/services/api';
import { Payment } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
import { Plus, Pencil, Loader2, CreditCard, Banknote, CheckCircle, Search, Download, Trash2, Filter, AlertCircle, Eye, TrendingUp, Calendar, IndianRupee } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToCSV } from '@/utils/export';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';

const statusColors: Record<Payment['status'], string> = {
  Completed: 'bg-green-500/10 text-green-600 border-green-500/20',
  Pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Failed: 'bg-destructive/10 text-destructive border-destructive/20',
};

const methodIcons: Record<Payment['method'], React.ComponentType<{ className?: string }>> = {
  'Credit Card': CreditCard,
  'Bank Transfer': Banknote,
  'Cash': Banknote,
  'Check': Banknote,
};

const methods: Payment['method'][] = ['Credit Card', 'Bank Transfer', 'Cash', 'Check'];

export default function PaymentsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [methodFilter, setMethodFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [formData, setFormData] = useState({
    invoiceId: '',
    amount: 0,
    method: 'Bank Transfer' as Payment['method'],
    status: 'Pending' as Payment['status'],
    date: new Date().toISOString().split('T')[0],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: payments, isLoading } = useQuery({
    queryKey: ['payments'],
    queryFn: paymentApi.getAll,
  });

  const { data: invoices } = useQuery({
    queryKey: ['invoices'],
    queryFn: invoiceApi.getAll,
  });

  // Filter payments
  const filteredPayments = payments?.filter((payment) => {
    const matchesSearch = payment.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          payment.invoiceId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || payment.status === statusFilter;
    const matchesMethod = methodFilter === 'all' || payment.method === methodFilter;
    return matchesSearch && matchesStatus && matchesMethod;
  });

  const createMutation = useMutation({
    mutationFn: paymentApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({ title: 'Success', description: 'Payment recorded successfully.' });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Payment> }) =>
      paymentApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({ title: 'Success', description: 'Payment updated successfully.' });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: paymentApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payments'] });
      toast({ title: 'Success', description: 'Payment deleted successfully.' });
      setIsDeleteDialogOpen(false);
      setSelectedPayment(null);
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedPayment(null);
    setFormData({
      invoiceId: '',
      amount: 0,
      method: 'Bank Transfer',
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
    });
  };

  const openCreateDialog = () => {
    setSelectedPayment(null);
    setFormData({
      invoiceId: '',
      amount: 0,
      method: 'Bank Transfer',
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setFormData({
      invoiceId: payment.invoiceId,
      amount: payment.amount,
      method: payment.method,
      status: payment.status,
      date: payment.date,
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = (payment: Payment) => {
    setSelectedPayment(payment);
    setIsViewDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedPayment) {
      updateMutation.mutate({ id: selectedPayment.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleExport = () => {
    if (!filteredPayments || filteredPayments.length === 0) {
      toast({ title: 'No Data', description: 'No payments to export.', variant: 'destructive' });
      return;
    }
    exportToCSV(
      filteredPayments,
      `payments-export-${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Payment ID' },
        { key: 'invoiceId', label: 'Invoice ID' },
        { key: 'amount', label: 'Amount' },
        { key: 'method', label: 'Method' },
        { key: 'status', label: 'Status' },
        { key: 'date', label: 'Date' },
      ]
    );
    toast({ title: 'Exported', description: `${filteredPayments.length} payments exported to CSV.` });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setMethodFilter('all');
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  const totalCompleted = payments?.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0) || 0;
  const totalPending = payments?.filter(p => p.status === 'Pending').reduce((sum, p) => sum + p.amount, 0) || 0;
  const failedCount = payments?.filter(p => p.status === 'Failed').length || 0;
  
  // New stats
  const todayDate = new Date().toISOString().split('T')[0];
  const todayCollections = payments?.filter(p => p.date === todayDate && p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0) || 0;
  const overdueAmount = invoices?.filter(i => i.status === 'Overdue').reduce((sum, i) => sum + i.amount, 0) || 0;
  const totalReceived = payments?.filter(p => p.status === 'Completed').reduce((sum, p) => sum + p.amount, 0) || 0;

  // Mobile Card Component
  const PaymentCard = ({ payment }: { payment: Payment }) => {
    const MethodIcon = methodIcons[payment.method];
    return (
      <div className="rounded-lg border bg-card p-4 space-y-3 overflow-hidden">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <MethodIcon className="h-4 w-4 text-muted-foreground shrink-0" />
              <p className="font-semibold text-sm truncate">{payment.id}</p>
            </div>
            <p className="text-xs text-muted-foreground truncate">Invoice: {payment.invoiceId}</p>
          </div>
          <Badge variant="outline" className={`${statusColors[payment.status]} shrink-0`}>
            {payment.status}
          </Badge>
        </div>
        <div className="flex items-end justify-between pt-2 border-t gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-xl font-bold truncate">₹{payment.amount.toLocaleString('en-IN')}</p>
            <p className="text-xs text-muted-foreground truncate">{payment.method}</p>
          </div>
          <div className="flex flex-col items-end gap-1 shrink-0">
            <p className="text-xs text-muted-foreground">{payment.date}</p>
            <div className="flex gap-1">
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openViewDialog(payment)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(payment)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => {
                  setSelectedPayment(payment);
                  setIsDeleteDialogOpen(true);
                }}
              >
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout title="Payments">
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="hidden sm:block">
            <p className="text-muted-foreground text-sm">Track and manage all payment transactions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-6 sm:gap-3">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-600/5 border-green-500/20 overflow-hidden">
            <CardHeader className="pb-2 px-3 pt-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                <span className="hidden sm:inline truncate">Total Received</span>
                <span className="sm:hidden truncate">Received</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-xl font-bold text-green-600 truncate">₹{totalReceived.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-red-500/10 to-red-600/5 border-red-500/20 overflow-hidden">
            <CardHeader className="pb-2 px-3 pt-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-red-600 shrink-0" />
                <span className="hidden sm:inline truncate">Overdue Amount</span>
                <span className="sm:hidden truncate">Overdue</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-xl font-bold text-red-600 truncate">₹{overdueAmount.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-600/5 border-blue-500/20 overflow-hidden">
            <CardHeader className="pb-2 px-3 pt-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-blue-600 shrink-0" />
                <span className="hidden sm:inline truncate">Today Collections</span>
                <span className="sm:hidden truncate">Today</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-xl font-bold text-blue-600 truncate">₹{todayCollections.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 overflow-hidden">
            <CardHeader className="pb-2 px-3 pt-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4 text-emerald-600 shrink-0" />
                <span className="truncate">Completed</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-xl font-bold text-emerald-600 truncate">₹{totalCompleted.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-amber-500/10 to-amber-600/5 border-amber-500/20 overflow-hidden">
            <CardHeader className="pb-2 px-3 pt-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Banknote className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600 shrink-0" />
                <span className="truncate">Pending</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-xl font-bold text-amber-600 truncate">₹{totalPending.toLocaleString('en-IN')}</div>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-600/5 border-purple-500/20 overflow-hidden">
            <CardHeader className="pb-2 px-3 pt-3 sm:p-4 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <CreditCard className="h-3 w-3 sm:h-4 sm:w-4 text-purple-600 shrink-0" />
                <span className="hidden sm:inline truncate">Total Txns</span>
                <span className="sm:hidden truncate">Txns</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:p-4 sm:pt-0">
              <div className="text-lg sm:text-xl font-bold text-purple-600 truncate">{payments?.length || 0}</div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Filter Toggle */}
        <div className="flex items-center justify-between md:hidden">
          <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(!isFilterOpen)}>
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
          <span className="text-sm text-muted-foreground">
            {filteredPayments?.length || 0} results
          </span>
        </div>

        {/* Mobile Collapsible Filters */}
        <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen} className="md:hidden">
          <CollapsibleContent>
            <Card className="mb-4">
              <CardContent className="pt-4 space-y-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="Completed">Completed</SelectItem>
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Failed">Failed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Method</Label>
                  <Select value={methodFilter} onValueChange={setMethodFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Methods</SelectItem>
                      {methods.map((method) => (
                        <SelectItem key={method} value={method}>{method}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <Button variant="outline" size="sm" className="w-full" onClick={clearFilters}>
                  Clear Filters
                </Button>
              </CardContent>
            </Card>
          </CollapsibleContent>
        </Collapsible>

        {/* Desktop Search and Filters */}
        <Card className="hidden md:block">
          <CardContent className="p-4">
            <div className="flex flex-wrap gap-3 items-center">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search payments..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={methodFilter} onValueChange={setMethodFilter}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  {methods.map((method) => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
          ) : filteredPayments?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No payments found</div>
          ) : (
            filteredPayments?.map((payment) => <PaymentCard key={payment.id} payment={payment} />)
          )}
        </div>

        {/* Desktop View - Table */}
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>All Payments</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filteredPayments?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No payments found</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Payment ID</th>
                    <th className="pb-3 font-medium">Invoice</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Method</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments?.map((payment) => (
                    <tr key={payment.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 font-medium">{payment.id}</td>
                      <td className="py-3">{payment.invoiceId}</td>
                      <td className="py-3 font-semibold">₹{payment.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3">{payment.method}</td>
                      <td className="py-3">
                        <Badge variant="outline" className={statusColors[payment.status]}>
                          {payment.status}
                        </Badge>
                      </td>
                      <td className="py-3">{payment.date}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openViewDialog(payment)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(payment)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedPayment(payment);
                              setIsDeleteDialogOpen(true);
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* View Payment Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Payment {selectedPayment?.id}</DialogTitle>
            <DialogDescription>Payment details</DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Invoice Reference</Label>
                  <p className="font-medium">{selectedPayment.invoiceId}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge variant="outline" className={statusColors[selectedPayment.status]}>
                    {selectedPayment.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Method</Label>
                  <p className="font-medium">{selectedPayment.method}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <p className="font-medium">{selectedPayment.date}</p>
                </div>
              </div>
              <div className="border-t pt-4 flex justify-between items-center">
                <span className="font-medium">Amount</span>
                <span className="text-2xl font-bold">₹{selectedPayment.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{selectedPayment ? 'Edit Payment' : 'Add Payment'}</DialogTitle>
            <DialogDescription>
              {selectedPayment ? 'Update the payment details.' : 'Record a new payment.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="invoiceId">Invoice Reference</Label>
              <Select
                value={formData.invoiceId}
                onValueChange={(value) => setFormData({ ...formData, invoiceId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select invoice" />
                </SelectTrigger>
                <SelectContent>
                  {invoices?.map((inv) => (
                    <SelectItem key={inv.id} value={inv.id}>
                      {inv.id} - {inv.clientName}
                    </SelectItem>
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
              <Label htmlFor="method">Payment Method</Label>
              <Select
                value={formData.method}
                onValueChange={(value: Payment['method']) => setFormData({ ...formData, method: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((method) => (
                    <SelectItem key={method} value={method}>{method}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value: Payment['status']) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Completed">Completed</SelectItem>
                  <SelectItem value="Failed">Failed</SelectItem>
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
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={closeDialog} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={isMutating} className="w-full sm:w-auto">
                {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedPayment ? 'Update' : 'Add'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Payment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this payment? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedPayment && deleteMutation.mutate(selectedPayment.id)}
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