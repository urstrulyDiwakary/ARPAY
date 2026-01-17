import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { invoiceApi } from '@/services/api';
import { Invoice, InvoiceLineItem, InvoiceType } from '@/types';
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
import { Plus, Pencil, Loader2, FileText, Download, Trash2, Filter, Eye, TrendingUp, Calendar, IndianRupee, AlertCircle, CheckCircle, Clock, X } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToCSV } from '@/utils/export';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';

const statusColors: Record<Invoice['status'], string> = {
  Paid: 'bg-green-500/10 text-green-600 border-green-500/20',
  Pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Overdue: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusIcons: Record<Invoice['status'], React.ComponentType<{ className?: string }>> = {
  Paid: CheckCircle,
  Pending: Clock,
  Overdue: AlertCircle,
};

const invoiceTypeColors: Record<InvoiceType, string> = {
  Project: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Customer: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  Expense: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

export default function SalesPage() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const [formData, setFormData] = useState<Omit<Invoice, 'id'>>({
    clientName: '',
    amount: 0,
    status: 'Pending',
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    lineItems: [],
    invoiceType: 'Customer',
  });

  const [lineItemForm, setLineItemForm] = useState<Omit<InvoiceLineItem, 'id'>>({
    description: '',
    quantity: 1,
    price: 0,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: invoiceApi.getAll,
  });

  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch =
      invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      invoice.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesType = typeFilter === 'all' || invoice.invoiceType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const createMutation = useMutation({
    mutationFn: invoiceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsCreateDialogOpen(false);
      resetForm();
      toast({
        title: 'Success',
        description: 'Invoice created successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive',
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> }) =>
      invoiceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsEditDialogOpen(false);
      setSelectedInvoice(null);
      resetForm();
      toast({
        title: 'Success',
        description: 'Invoice updated successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to update invoice',
        variant: 'destructive',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: invoiceApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      setIsDeleteDialogOpen(false);
      setSelectedInvoice(null);
      toast({
        title: 'Success',
        description: 'Invoice deleted successfully',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to delete invoice',
        variant: 'destructive',
      });
    },
  });

  const resetForm = () => {
    setFormData({
      clientName: '',
      amount: 0,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      lineItems: [],
      invoiceType: 'Customer',
    });
    setLineItemForm({
      description: '',
      quantity: 1,
      price: 0,
    });
  };

  const handleCreate = () => {
    if (!formData.clientName || formData.lineItems.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and add at least one line item',
        variant: 'destructive',
      });
      return;
    }
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedInvoice) return;
    if (!formData.clientName || formData.lineItems.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all required fields and add at least one line item',
        variant: 'destructive',
      });
      return;
    }
    updateMutation.mutate({ id: selectedInvoice.id, data: formData });
  };

  const handleDelete = () => {
    if (!selectedInvoice) return;
    deleteMutation.mutate(selectedInvoice.id);
  };

  const handleEditClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      clientName: invoice.clientName,
      amount: invoice.amount,
      status: invoice.status,
      date: invoice.date,
      dueDate: invoice.dueDate,
      lineItems: invoice.lineItems,
      invoiceType: invoice.invoiceType,
    });
    setIsEditDialogOpen(true);
  };

  const handleViewClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const handleDeleteClick = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsDeleteDialogOpen(true);
  };

  const handleAddLineItem = () => {
    if (!lineItemForm.description || lineItemForm.quantity <= 0 || lineItemForm.price <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all line item fields with valid values',
        variant: 'destructive',
      });
      return;
    }

    const newLineItem: InvoiceLineItem = {
      id: Date.now().toString(),
      ...lineItemForm,
    };

    const updatedLineItems = [...formData.lineItems, newLineItem];
    const totalAmount = updatedLineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    setFormData({
      ...formData,
      lineItems: updatedLineItems,
      amount: totalAmount,
    });

    setLineItemForm({
      description: '',
      quantity: 1,
      price: 0,
    });
  };

  const handleRemoveLineItem = (id: string) => {
    const updatedLineItems = formData.lineItems.filter(item => item.id !== id);
    const totalAmount = updatedLineItems.reduce((sum, item) => sum + (item.quantity * item.price), 0);

    setFormData({
      ...formData,
      lineItems: updatedLineItems,
      amount: totalAmount,
    });
  };

  const handleExport = () => {
    if (!filteredInvoices || filteredInvoices.length === 0) {
      toast({
        title: 'No Data',
        description: 'No invoices available to export.',
        variant: 'destructive',
      });
      return;
    }

    exportToCSV(
      filteredInvoices,
      `invoices-export-${new Date().toISOString().split('T')[0]}`,
      ['id', 'clientName', 'amount', 'status', 'date', 'dueDate', 'invoiceType']
    );

    toast({
      title: 'Success',
      description: 'Invoices exported successfully',
    });
  };

  // Calculate summary stats
  const totalRevenue = filteredInvoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0;
  const paidAmount = filteredInvoices?.filter(inv => inv.status === 'Paid').reduce((sum, inv) => sum + inv.amount, 0) || 0;
  const pendingAmount = filteredInvoices?.filter(inv => inv.status === 'Pending').reduce((sum, inv) => sum + inv.amount, 0) || 0;
  const overdueAmount = filteredInvoices?.filter(inv => inv.status === 'Overdue').reduce((sum, inv) => sum + inv.amount, 0) || 0;

  return (
    <MainLayout title="Invoices & Sales">
      <div className="space-y-6">
        {/* Summary Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold flex items-center">
                <IndianRupee className="h-5 w-5 mr-1" />
                {totalRevenue.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredInvoices?.length || 0} total invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Paid</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 flex items-center">
                <IndianRupee className="h-5 w-5 mr-1" />
                {paidAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredInvoices?.filter(inv => inv.status === 'Paid').length || 0} invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending</CardTitle>
              <Clock className="h-4 w-4 text-amber-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-amber-600 flex items-center">
                <IndianRupee className="h-5 w-5 mr-1" />
                {pendingAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredInvoices?.filter(inv => inv.status === 'Pending').length || 0} invoices
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertCircle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive flex items-center">
                <IndianRupee className="h-5 w-5 mr-1" />
                {overdueAmount.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                {filteredInvoices?.filter(inv => inv.status === 'Overdue').length || 0} invoices
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Actions and Filters */}
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
              <div className="flex-1 max-w-sm">
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full"
                />
              </div>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                </Button>
                <Button variant="outline" onClick={handleExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </Button>
                <Button onClick={() => setIsCreateDialogOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  New Invoice
                </Button>
              </div>
            </div>

            <Collapsible open={showFilters}>
              <CollapsibleContent>
                <div className="grid gap-4 md:grid-cols-2 pt-4">
                  <div className="space-y-2">
                    <Label>Status</Label>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="Paid">Paid</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Overdue">Overdue</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select value={typeFilter} onValueChange={setTypeFilter}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Types</SelectItem>
                        <SelectItem value="Customer">Customer</SelectItem>
                        <SelectItem value="Project">Project</SelectItem>
                        <SelectItem value="Expense">Expense</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </CardHeader>

          <CardContent>
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : filteredInvoices && filteredInvoices.length > 0 ? (
              <div className="space-y-3">
                {filteredInvoices.map((invoice) => {
                  const StatusIcon = statusIcons[invoice.status];
                  return (
                    <Card key={invoice.id} className="hover:bg-accent/50 transition-colors">
                      <CardContent className="p-4">
                        <div className="flex flex-col md:flex-row gap-4 md:items-center md:justify-between">
                          <div className="flex-1 space-y-2">
                            <div className="flex items-start gap-3">
                              <FileText className="h-5 w-5 text-primary mt-0.5" />
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h3 className="font-semibold truncate">{invoice.clientName}</h3>
                                  <Badge variant="outline" className={statusColors[invoice.status]}>
                                    <StatusIcon className="mr-1 h-3 w-3" />
                                    {invoice.status}
                                  </Badge>
                                  <Badge variant="outline" className={invoiceTypeColors[invoice.invoiceType]}>
                                    {invoice.invoiceType}
                                  </Badge>
                                </div>
                                <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground flex-wrap">
                                  <span className="flex items-center">
                                    <FileText className="mr-1 h-3 w-3" />
                                    {invoice.id}
                                  </span>
                                  <span className="flex items-center">
                                    <Calendar className="mr-1 h-3 w-3" />
                                    {new Date(invoice.date).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center">
                                    Due: {new Date(invoice.dueDate).toLocaleDateString()}
                                  </span>
                                  <span className="flex items-center">
                                    {invoice.lineItems.length} item{invoice.lineItems.length !== 1 ? 's' : ''}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="text-right">
                              <div className="text-xl font-bold flex items-center justify-end">
                                <IndianRupee className="h-4 w-4 mr-1" />
                                {invoice.amount.toLocaleString()}
                              </div>
                            </div>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleViewClick(invoice)}
                                title="View Details"
                              >
                                <Eye className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleEditClick(invoice)}
                                title="Edit Invoice"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteClick(invoice)}
                                title="Delete Invoice"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <FileText className="mx-auto h-12 w-12 mb-4 opacity-20" />
                <p>No invoices found</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>
              Fill in the invoice details and add line items
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name *</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Enter client name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceType">Invoice Type *</Label>
                <Select
                  value={formData.invoiceType}
                  onValueChange={(value: InvoiceType) => setFormData({ ...formData, invoiceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Project">Project</SelectItem>
                    <SelectItem value="Expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="date">Invoice Date *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Invoice['status']) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                  <IndianRupee className="h-4 w-4 mr-2" />
                  <span className="font-semibold">{formData.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-3">Line Items</h3>
              <div className="space-y-3">
                {formData.lineItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-3 border rounded-lg bg-accent/50">
                    <div className="flex-1">
                      <div className="font-medium">{item.description}</div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × ₹{item.price.toLocaleString()} = ₹{(item.quantity * item.price).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLineItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 border rounded-lg">
                  <div className="md:col-span-2 space-y-2">
                    <Input
                      placeholder="Description"
                      value={lineItemForm.description}
                      onChange={(e) => setLineItemForm({ ...lineItemForm, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={lineItemForm.quantity}
                      onChange={(e) => setLineItemForm({ ...lineItemForm, quantity: Number(e.target.value) })}
                      min="1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Price"
                      value={lineItemForm.price}
                      onChange={(e) => setLineItemForm({ ...lineItemForm, price: Number(e.target.value) })}
                      min="0"
                    />
                    <Button onClick={handleAddLineItem} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Invoice Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Invoice</DialogTitle>
            <DialogDescription>
              Update the invoice details and line items
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-clientName">Client Name *</Label>
                <Input
                  id="edit-clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  placeholder="Enter client name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-invoiceType">Invoice Type *</Label>
                <Select
                  value={formData.invoiceType}
                  onValueChange={(value: InvoiceType) => setFormData({ ...formData, invoiceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Customer">Customer</SelectItem>
                    <SelectItem value="Project">Project</SelectItem>
                    <SelectItem value="Expense">Expense</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-date">Invoice Date *</Label>
                <Input
                  id="edit-date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-dueDate">Due Date *</Label>
                <Input
                  id="edit-dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-status">Status *</Label>
                <Select
                  value={formData.status}
                  onValueChange={(value: Invoice['status']) => setFormData({ ...formData, status: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Pending">Pending</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Total Amount</Label>
                <div className="flex items-center h-10 px-3 border rounded-md bg-muted">
                  <IndianRupee className="h-4 w-4 mr-2" />
                  <span className="font-semibold">{formData.amount.toLocaleString()}</span>
                </div>
              </div>
            </div>

            <div className="border-t pt-4 mt-4">
              <h3 className="font-semibold mb-3">Line Items</h3>
              <div className="space-y-3">
                {formData.lineItems.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 p-3 border rounded-lg bg-accent/50">
                    <div className="flex-1">
                      <div className="font-medium">{item.description}</div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × ₹{item.price.toLocaleString()} = ₹{(item.quantity * item.price).toLocaleString()}
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveLineItem(item.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}

                <div className="grid grid-cols-1 md:grid-cols-4 gap-2 p-3 border rounded-lg">
                  <div className="md:col-span-2 space-y-2">
                    <Input
                      placeholder="Description"
                      value={lineItemForm.description}
                      onChange={(e) => setLineItemForm({ ...lineItemForm, description: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Input
                      type="number"
                      placeholder="Quantity"
                      value={lineItemForm.quantity}
                      onChange={(e) => setLineItemForm({ ...lineItemForm, quantity: Number(e.target.value) })}
                      min="1"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      placeholder="Price"
                      value={lineItemForm.price}
                      onChange={(e) => setLineItemForm({ ...lineItemForm, price: Number(e.target.value) })}
                      min="0"
                    />
                    <Button onClick={handleAddLineItem} size="icon">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              {updateMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Update Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Invoice Details</DialogTitle>
            <DialogDescription>
              Complete invoice information
            </DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-muted-foreground">Invoice ID</Label>
                  <p className="font-semibold">{selectedInvoice.id}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Client Name</Label>
                  <p className="font-semibold">{selectedInvoice.clientName}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Invoice Type</Label>
                  <Badge variant="outline" className={invoiceTypeColors[selectedInvoice.invoiceType]}>
                    {selectedInvoice.invoiceType}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Status</Label>
                  <Badge variant="outline" className={statusColors[selectedInvoice.status]}>
                    {selectedInvoice.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-muted-foreground">Invoice Date</Label>
                  <p className="font-semibold">{new Date(selectedInvoice.date).toLocaleDateString()}</p>
                </div>
                <div>
                  <Label className="text-muted-foreground">Due Date</Label>
                  <p className="font-semibold">{new Date(selectedInvoice.dueDate).toLocaleDateString()}</p>
                </div>
              </div>

              <div className="border-t pt-4">
                <h3 className="font-semibold mb-3">Line Items</h3>
                <div className="space-y-2">
                  {selectedInvoice.lineItems.map((item) => (
                    <div key={item.id} className="p-3 border rounded-lg bg-accent/50">
                      <div className="font-medium">{item.description}</div>
                      <div className="text-sm text-muted-foreground">
                        Qty: {item.quantity} × ₹{item.price.toLocaleString()} = ₹{(item.quantity * item.price).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-lg font-bold">
                  <span>Total Amount</span>
                  <span className="flex items-center">
                    <IndianRupee className="h-5 w-5 mr-1" />
                    {selectedInvoice.amount.toLocaleString()}
                  </span>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the invoice
              {selectedInvoice && ` "${selectedInvoice.id}"`}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
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
