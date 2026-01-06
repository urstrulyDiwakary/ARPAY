import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { invoiceApi } from '@/services/api';
import { Invoice, InvoiceLineItem, InvoiceType, InvoiceAttachment } from '@/types';
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

import { Plus, Pencil, Trash2, Loader2, X, Search, Download, Eye, FileText, Image, File, Upload, FolderKanban, Users, Receipt, Layers } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToCSV } from '@/utils/export';
import { exportInvoiceToPDF } from '@/utils/pdfExport';

const statusColors: Record<Invoice['status'], string> = {
  Paid: 'bg-green-500/10 text-green-600 border-green-500/20',
  Pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Overdue: 'bg-destructive/10 text-destructive border-destructive/20',
};

const invoiceTypeColors: Record<InvoiceType, string> = {
  Project: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Customer: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  Expense: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

const invoiceTypes: InvoiceType[] = ['Project', 'Customer', 'Expense'];

export default function InvoicesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [formData, setFormData] = useState({
    clientName: '',
    status: 'Pending' as Invoice['status'],
    date: new Date().toISOString().split('T')[0],
    dueDate: '',
    invoiceType: 'Customer' as InvoiceType,
    lineItems: [{ id: '1', description: '', quantity: 1, price: 0 }] as InvoiceLineItem[],
    attachments: [] as InvoiceAttachment[],
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: invoiceApi.getAll,
  });

  // Filter invoices based on search, status, and type
  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch = invoice.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          invoice.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
    const matchesType = typeFilter === 'all' || invoice.invoiceType === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const createMutation = useMutation({
    mutationFn: invoiceApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Success', description: 'Invoice created successfully.' });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> }) =>
      invoiceApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Success', description: 'Invoice updated successfully.' });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: invoiceApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Success', description: 'Invoice deleted successfully.' });
      setIsDeleteDialogOpen(false);
      setSelectedInvoice(null);
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedInvoice(null);
    setFormData({
      clientName: '',
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      invoiceType: 'Customer',
      lineItems: [{ id: '1', description: '', quantity: 1, price: 0 }],
      attachments: [],
    });
  };

  const openCreateDialog = (type?: InvoiceType) => {
    setSelectedInvoice(null);
    setFormData({
      clientName: '',
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      dueDate: '',
      invoiceType: type || 'Customer',
      lineItems: [{ id: '1', description: '', quantity: 1, price: 0 }],
      attachments: [],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setFormData({
      clientName: invoice.clientName,
      status: invoice.status,
      date: invoice.date,
      dueDate: invoice.dueDate,
      invoiceType: invoice.invoiceType,
      lineItems: invoice.lineItems,
      attachments: invoice.attachments || [],
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [
        ...formData.lineItems,
        { id: Date.now().toString(), description: '', quantity: 1, price: 0 },
      ],
    });
  };

  const removeLineItem = (id: string) => {
    if (formData.lineItems.length > 1) {
      setFormData({
        ...formData,
        lineItems: formData.lineItems.filter((item) => item.id !== id),
      });
    }
  };

  const updateLineItem = (id: string, field: keyof InvoiceLineItem, value: string | number) => {
    setFormData({
      ...formData,
      lineItems: formData.lineItems.map((item) =>
        item.id === id ? { ...item, [field]: value } : item
      ),
    });
  };

  const calculateTotal = () => {
    return formData.lineItems.reduce((sum, item) => sum + item.quantity * item.price, 0);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newAttachments: InvoiceAttachment[] = [];
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

  const getAttachmentIcon = (type: InvoiceAttachment['type']) => {
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
    const invoiceData = {
      clientName: formData.clientName,
      amount: calculateTotal(),
      status: formData.status,
      date: formData.date,
      dueDate: formData.dueDate,
      invoiceType: formData.invoiceType,
      lineItems: formData.lineItems,
      attachments: formData.attachments,
    };

    if (selectedInvoice) {
      updateMutation.mutate({ id: selectedInvoice.id, data: invoiceData });
    } else {
      createMutation.mutate(invoiceData);
    }
  };

  const handleDownload = (invoice: Invoice) => {
    exportInvoiceToPDF(invoice);
    toast({ title: 'Downloaded', description: `Invoice ${invoice.id} exported to PDF.` });
  };

  const handleExportAll = () => {
    if (!filteredInvoices || filteredInvoices.length === 0) {
      toast({ title: 'No Data', description: 'No invoices to export.', variant: 'destructive' });
      return;
    }
    exportToCSV(
      filteredInvoices,
      `invoices-export-${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Invoice ID' },
        { key: 'clientName', label: 'Client' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
        { key: 'invoiceType', label: 'Type' },
        { key: 'date', label: 'Date' },
        { key: 'dueDate', label: 'Due Date' },
      ]
    );
    toast({ title: 'Exported', description: `${filteredInvoices.length} invoices exported to CSV.` });
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;
  const totalAmount = filteredInvoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0;

  // Count by type
  const projectCount = invoices?.filter(i => i.invoiceType === 'Project').length || 0;
  const customerCount = invoices?.filter(i => i.invoiceType === 'Customer').length || 0;
  const expenseCount = invoices?.filter(i => i.invoiceType === 'Expense').length || 0;

  // Mobile Card Component
  const InvoiceCard = ({ invoice }: { invoice: Invoice }) => (
    <div className="rounded-lg border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{invoice.id}</p>
            <Badge variant="outline" className={invoiceTypeColors[invoice.invoiceType]}>
              {invoice.invoiceType}
            </Badge>
          </div>
          <p className="text-foreground text-sm">{invoice.clientName}</p>
        </div>
        <Badge variant="outline" className={statusColors[invoice.status]}>
          {invoice.status}
        </Badge>
      </div>
      <div className="flex items-center justify-between pt-2 border-t">
        <div>
          <p className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">₹{invoice.amount.toLocaleString('en-IN')}</p>
          <p className="text-xs text-muted-foreground">{invoice.date}</p>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8 text-blue-600" onClick={() => openViewDialog(invoice)}>
            <Eye className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-amber-600" onClick={() => openEditDialog(invoice)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={() => handleDownload(invoice)}>
            <Download className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setSelectedInvoice(invoice);
              setIsDeleteDialogOpen(true);
            }}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>
    </div>
  );

  return (
    <MainLayout title="Invoices">
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="hidden sm:block">
            <p className="text-muted-foreground text-sm">Manage your invoices and billing</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExportAll}>
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Select onValueChange={(value) => openCreateDialog(value as InvoiceType)}>
              <SelectTrigger className="w-auto">
                <Plus className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Create</span>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Project">Project Invoice</SelectItem>
                <SelectItem value="Customer">Customer Invoice</SelectItem>
                <SelectItem value="Expense">Expense Invoice</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Invoice Type Filter Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${typeFilter === 'all' ? 'ring-2 ring-primary border-primary bg-gradient-to-br from-primary/10 to-primary/5' : ''}`}
            onClick={() => setTypeFilter('all')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
              <Layers className={`h-5 w-5 sm:h-6 sm:w-6 mb-1 ${typeFilter === 'all' ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-xs sm:text-sm font-medium">All</p>
              <p className={`text-lg sm:text-xl font-bold ${typeFilter === 'all' ? 'text-primary' : ''}`}>{invoices?.length || 0}</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${typeFilter === 'Project' ? 'ring-2 ring-blue-500 border-blue-500 bg-gradient-to-br from-blue-500/10 to-blue-500/5' : ''}`}
            onClick={() => setTypeFilter('Project')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
              <FolderKanban className={`h-5 w-5 sm:h-6 sm:w-6 mb-1 ${typeFilter === 'Project' ? 'text-blue-600' : 'text-blue-500'}`} />
              <p className="text-xs sm:text-sm font-medium">Project</p>
              <p className="text-lg sm:text-xl font-bold text-blue-600">{projectCount}</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${typeFilter === 'Customer' ? 'ring-2 ring-purple-500 border-purple-500 bg-gradient-to-br from-purple-500/10 to-purple-500/5' : ''}`}
            onClick={() => setTypeFilter('Customer')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
              <Users className={`h-5 w-5 sm:h-6 sm:w-6 mb-1 ${typeFilter === 'Customer' ? 'text-purple-600' : 'text-purple-500'}`} />
              <p className="text-xs sm:text-sm font-medium">Customer</p>
              <p className="text-lg sm:text-xl font-bold text-purple-600">{customerCount}</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${typeFilter === 'Expense' ? 'ring-2 ring-orange-500 border-orange-500 bg-gradient-to-br from-orange-500/10 to-orange-500/5' : ''}`}
            onClick={() => setTypeFilter('Expense')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
              <Receipt className={`h-5 w-5 sm:h-6 sm:w-6 mb-1 ${typeFilter === 'Expense' ? 'text-orange-600' : 'text-orange-500'}`} />
              <p className="text-xs sm:text-sm font-medium">Expense</p>
              <p className="text-lg sm:text-xl font-bold text-orange-600">{expenseCount}</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Paid">Paid</SelectItem>
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Overdue">Overdue</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="flex items-center justify-between rounded-lg border bg-card p-3">
          <span className="text-sm text-muted-foreground">
            {filteredInvoices?.length || 0} invoices found
          </span>
          <span className="font-semibold">
            Total: ₹{totalAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-32 w-full" />)
          ) : filteredInvoices?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No invoices found</div>
          ) : (
            filteredInvoices?.map((invoice) => <InvoiceCard key={invoice.id} invoice={invoice} />)
          )}
        </div>

        {/* Desktop View - Table */}
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>All Invoices</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : filteredInvoices?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No invoices found</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Invoice ID</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Client</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices?.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 font-medium">{invoice.id}</td>
                      <td className="py-3">
                        <Badge variant="outline" className={invoiceTypeColors[invoice.invoiceType]}>
                          {invoice.invoiceType}
                        </Badge>
                      </td>
                      <td className="py-3">{invoice.clientName}</td>
                      <td className="py-3 font-semibold">₹{invoice.amount.toLocaleString('en-IN')}</td>
                      <td className="py-3">
                        <Badge variant="outline" className={statusColors[invoice.status]}>
                          {invoice.status}
                        </Badge>
                      </td>
                      <td className="py-3">{invoice.date}</td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openViewDialog(invoice)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => openEditDialog(invoice)}>
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDownload(invoice)}>
                            <Download className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => {
                              setSelectedInvoice(invoice);
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

      {/* View Invoice Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Invoice {selectedInvoice?.id}</DialogTitle>
            <DialogDescription>Invoice details</DialogDescription>
          </DialogHeader>
          {selectedInvoice && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Client</Label>
                  <p className="font-medium">{selectedInvoice.clientName}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Badge variant="outline" className={invoiceTypeColors[selectedInvoice.invoiceType]}>
                    {selectedInvoice.invoiceType}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge variant="outline" className={statusColors[selectedInvoice.status]}>
                    {selectedInvoice.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <p className="font-medium">{selectedInvoice.dueDate}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <Label className="text-xs text-muted-foreground mb-2 block">Line Items</Label>
                <div className="space-y-2">
                  {selectedInvoice.lineItems.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span>{item.description || 'Item'}</span>
                      <span className="font-medium">{item.quantity} x ₹{item.price} = ₹{item.quantity * item.price}</span>
                    </div>
                  ))}
                </div>
              </div>
              {selectedInvoice.attachments && selectedInvoice.attachments.length > 0 && (
                <div className="border-t pt-4">
                  <Label className="text-xs text-muted-foreground mb-2 block">Attachments</Label>
                  <div className="space-y-2">
                    {selectedInvoice.attachments.map((attachment) => (
                      <div key={attachment.id} className="flex items-center gap-2 text-sm p-2 bg-muted rounded">
                        {getAttachmentIcon(attachment.type)}
                        <span className="flex-1 truncate">{attachment.name}</span>
                        <span className="text-muted-foreground">{formatFileSize(attachment.size)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="border-t pt-4 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold">₹{selectedInvoice.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            <Button onClick={() => selectedInvoice && handleDownload(selectedInvoice)}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedInvoice ? 'Edit Invoice' : `Create ${formData.invoiceType} Invoice`}</DialogTitle>
            <DialogDescription>
              {selectedInvoice ? 'Update the invoice details below.' : 'Fill in the details to create a new invoice.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="invoiceType">Invoice Type</Label>
                <Select
                  value={formData.invoiceType}
                  onValueChange={(value: InvoiceType) => setFormData({ ...formData, invoiceType: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {invoiceTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name</Label>
                <Input
                  id="clientName"
                  value={formData.clientName}
                  onChange={(e) => setFormData({ ...formData, clientName: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
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
                <Label htmlFor="date">Invoice Date</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label>Line Items</Label>
                <Button type="button" variant="outline" size="sm" onClick={addLineItem}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add
                </Button>
              </div>
              {formData.lineItems.map((item) => (
                <div key={item.id} className="space-y-2 p-3 border rounded-lg">
                  <Input
                    placeholder="Description"
                    value={item.description}
                    onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                  />
                  <div className="flex gap-2 items-center">
                    <Input
                      type="number"
                      placeholder="Qty"
                      value={item.quantity}
                      onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 0)}
                      className="w-20"
                    />
                    <Input
                      type="number"
                      placeholder="Price"
                      value={item.price}
                      onChange={(e) => updateLineItem(item.id, 'price', parseFloat(e.target.value) || 0)}
                      className="flex-1"
                    />
                    <span className="text-sm font-medium w-20 text-right">
                      ₹{(item.quantity * item.price).toFixed(0)}
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(item.id)}
                      disabled={formData.lineItems.length === 1}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              <div className="flex justify-end border-t pt-3">
                <div className="text-lg font-semibold">Total: ₹{calculateTotal().toFixed(2)}</div>
              </div>
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
                  Click to upload images, PDFs, or documents
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
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
                {selectedInvoice ? 'Update' : 'Create'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Invoice</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete invoice {selectedInvoice?.id}? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedInvoice && deleteMutation.mutate(selectedInvoice.id)}
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
