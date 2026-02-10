import { useState, useRef, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { invoiceApi, projectApi, userApi, projectMasterApi } from '@/services/api';
import { Invoice, InvoiceLineItem, InvoiceType, InvoiceAttachment, Project } from '@/types';
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

import { Plus, Pencil, Trash2, Loader2, X, Search, Download, Eye, FileText, Image, File, Upload, FolderKanban, Users, Receipt, Layers, CheckCircle2 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToCSV } from '@/utils/export';
import { exportInvoiceToPDF } from '@/utils/pdfExport';

const statusColors: Record<Invoice['status'], string> = {
  PAID: 'bg-green-500/10 text-green-600 border-green-500/20',
  PENDING: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  OVERDUE: 'bg-destructive/10 text-destructive border-destructive/20',
  PARTIAL: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

const invoiceTypeColors: Record<InvoiceType, string> = {
  PROJECT: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  CUSTOMER: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  EXPENSE: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
};

// Helper functions to format enum values for display
const formatStatus = (status: Invoice['status']): string => {
  return status.charAt(0) + status.slice(1).toLowerCase();
};

const formatInvoiceType = (type: InvoiceType): string => {
  return type.charAt(0) + type.slice(1).toLowerCase();
};

export default function InvoicesPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [plotSearchQuery, setPlotSearchQuery] = useState('');

  const queryClient = useQueryClient();

  // Fetch project masters from database
  const { data: projectMasters = [] } = useQuery({
    queryKey: ['projectMasters'],
    queryFn: projectMasterApi.getAll,
  });

  // Generate unique project names from database
  const projectNames = useMemo(() => {
    const uniqueProjects = [...new Set(projectMasters.map(pm => pm.projectName))];
    return uniqueProjects.map(name => ({ value: name, label: name }));
  }, [projectMasters]);

  // Generate project/property options from database
  const projectOptions = useMemo(() => {
    const uniqueProperties = new Map();
    projectMasters.forEach(pm => {
      if (!uniqueProperties.has(pm.propertyName)) {
        uniqueProperties.set(pm.propertyName, {
          value: pm.propertyName,
          label: pm.propertyName,
          pricePerCent: pm.plotPrice,
          project: pm.projectName,
        });
      }
    });
    return Array.from(uniqueProperties.values());
  }, [projectMasters]);

  // Get plots by project name
  const getPlotsByProject = (projectName: string) => {
    return projectMasters
      .filter(pm => pm.projectName === projectName)
      .map(pm => ({
        plotNo: pm.plotNumber,
        cents: pm.plotArea,
      }));
  };

  // Get plots by property name
  const getPlotsByProperty = (propertyName: string) => {
    return projectMasters
      .filter(pm => pm.propertyName === propertyName)
      .map(pm => ({
        plotNo: pm.plotNumber,
        cents: pm.plotArea,
      }));
  };

  const { toast } = useToast();

  const { data: invoices, isLoading } = useQuery({
    queryKey: ['invoices'],
    queryFn: async () => {
      const data = await invoiceApi.getAll();
      console.log('Fetched invoices:', data);
      return data;
    },
  });

  const { data: projects } = useQuery({
    queryKey: ['projects'],
    queryFn: projectApi.getAll,
  });

  const { data: users = [] } = useQuery({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
  });

  // Get used plot numbers from existing invoices
  const getUsedPlots = (propertyName: string, excludeInvoiceId?: string) => {
    if (!invoices) return [];
    return invoices
      .filter(inv => inv.id !== excludeInvoiceId)
      .flatMap(inv =>
        inv.lineItems
          .filter(item => item.description === propertyName)
          .map(item => item.plotNo)
      );
  };

  // Get available plots based on property selection
  const getAvailablePlots = (propertyName: string, excludeInvoiceId?: string) => {
    const usedPlots = getUsedPlots(propertyName, excludeInvoiceId);
    return getPlotsByProperty(propertyName).filter(plot => !usedPlots.includes(plot.plotNo));
  };

  const [formData, setFormData] = useState({
    projectName: '',
    customerName: '',
    customerPhone: '',
    reference: '',
    leadSource: '',
    status: 'PENDING' as Invoice['status'],
    invoiceDate: new Date().toISOString().split('T')[0],
    dueDate: '',
    invoiceType: 'CUSTOMER' as InvoiceType,
    lineItems: [{
      id: '1',
      description: '',
      plotNo: '',
      cents: 0,
      pricePerCent: 0,
      totalAmount: 0,
      discount: 0,
      finalAmount: 0,
      quantity: 1,
      price: 0
    }] as InvoiceLineItem[],
    attachments: [] as InvoiceAttachment[],
    tokenAmount: 0,
    agreementAmount: 0,
    registrationAmount: 0,
    agreementDueDate: '',
    agreementDueAmount: 0,
    registrationDueDate: '',
    registrationDueAmount: 0,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);


  // Filter invoices based on search, status, and type/project
  const filteredInvoices = invoices?.filter((invoice) => {
    const matchesSearch = (invoice.customerName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (invoice.invoiceNumber?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
                          (invoice.id?.toLowerCase() || '').includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || invoice.status?.toUpperCase() === statusFilter.toUpperCase();

    // Handle invoice status, project name, and type filters
    let matchesType = true;
    if (typeFilter === 'Paid') {
      matchesType = invoice.status?.toUpperCase() === 'PAID';
    } else if (typeFilter !== 'all') {
      // Dynamic project filters (fallback to invoice type if needed)
      matchesType = invoice.projectName === typeFilter || invoice.invoiceType === typeFilter;
    }

    return matchesSearch && matchesStatus && matchesType;
  });

  const createMutation = useMutation({
    mutationFn: invoiceApi.create,
    onSuccess: (newInvoice) => {
      console.log('Invoice created successfully:', newInvoice);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Success', description: 'Invoice created successfully.' });
      closeDialog();
    },
    onError: (error) => {
      console.error('Error creating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to create invoice. Please try again.',
        variant: 'destructive'
      });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Invoice> }) =>
      invoiceApi.update(id, data),
    onSuccess: (updatedInvoice) => {
      console.log('Invoice updated successfully:', updatedInvoice);
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Success', description: 'Invoice updated successfully.' });
      closeDialog();
    },
    onError: (error) => {
      console.error('Error updating invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to update invoice. Please try again.',
        variant: 'destructive'
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: invoiceApi.delete,
    onSuccess: () => {
      console.log('Invoice deleted successfully');
      queryClient.invalidateQueries({ queryKey: ['invoices'] });
      toast({ title: 'Success', description: 'Invoice deleted successfully.' });
      setIsDeleteDialogOpen(false);
      setSelectedInvoice(null);
    },
    onError: (error) => {
      console.error('Error deleting invoice:', error);
      toast({
        title: 'Error',
        description: 'Failed to delete invoice. Please try again.',
        variant: 'destructive'
      });
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedInvoice(null);
    setPlotSearchQuery('');
    setFormData({
      projectName: '',
      customerName: '',
      customerPhone: '',
      status: 'PENDING',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      invoiceType: 'CUSTOMER',
      lineItems: [{
        id: '1',
        description: '',
        plotNo: '',
        cents: 0,
        pricePerCent: 0,
        totalAmount: 0,
        discount: 0,
        finalAmount: 0,
        quantity: 1,
        price: 0
      }],
      attachments: [],
      tokenAmount: 0,
      agreementAmount: 0,
      registrationAmount: 0,
      agreementDueDate: '',
      agreementDueAmount: 0,
      registrationDueDate: '',
      registrationDueAmount: 0,
    });
  };

  const openCreateDialog = () => {
    setSelectedInvoice(null);
    setPlotSearchQuery('');
    setFormData({
      projectName: '',
      customerName: '',
      customerPhone: '',
      status: 'PENDING',
      invoiceDate: new Date().toISOString().split('T')[0],
      dueDate: '',
      invoiceType: 'CUSTOMER',
      lineItems: [{
        id: '1',
        description: '',
        plotNo: '',
        cents: 0,
        pricePerCent: 0,
        totalAmount: 0,
        discount: 0,
        finalAmount: 0,
        quantity: 1,
        price: 0
      }],
      attachments: [],
      tokenAmount: 0,
      agreementAmount: 0,
      registrationAmount: 0,
      agreementDueDate: '',
      agreementDueAmount: 0,
      registrationDueDate: '',
      registrationDueAmount: 0,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (invoice: Invoice) => {
    console.log('Opening edit dialog for invoice:', invoice.id);
    setSelectedInvoice(invoice);
    setFormData({
      projectName: invoice.projectName || '',
      customerName: invoice.customerName,
      customerPhone: invoice.customerPhone || '',
      reference: invoice.reference || '',
      leadSource: invoice.leadSource || '',
      status: invoice.status,
      invoiceDate: invoice.invoiceDate,
      dueDate: invoice.dueDate,
      invoiceType: invoice.invoiceType,
      lineItems: invoice.lineItems,
      attachments: invoice.attachments || [],
      tokenAmount: invoice.tokenAmount || 0,
      agreementAmount: invoice.agreementAmount || 0,
      registrationAmount: invoice.registrationAmount || 0,
      agreementDueDate: invoice.agreementDueDate || '',
      agreementDueAmount: invoice.agreementDueAmount || 0,
      registrationDueDate: invoice.registrationDueDate || '',
      registrationDueAmount: invoice.registrationDueAmount || 0,
    });
    setIsDialogOpen(true);
    console.log('Edit dialog opened, formData set');
  };

  const openViewDialog = (invoice: Invoice) => {
    console.log('Opening view dialog for invoice:', invoice.id);
    console.log('Invoice data:', invoice);
    setSelectedInvoice(invoice);
    setIsViewDialogOpen(true);
    console.log('View dialog state set to true');
  };

  const addLineItem = () => {
    setFormData({
      ...formData,
      lineItems: [
        ...formData.lineItems,
        {
          id: Date.now().toString(),
          description: '',
          plotNo: '',
          cents: 0,
          pricePerCent: 0,
          totalAmount: 0,
          discount: 0,
          finalAmount: 0,
          quantity: 1,
          price: 0
        },
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
    setFormData((prevFormData) => {
      const updatedLineItems = prevFormData.lineItems.map((item) => {
        if (item.id !== id) return item;

        const updatedItem = { ...item, [field]: value };

        // If description (property) changes, update pricePerCent and reset plot
        if (field === 'description') {
          const selectedProject = projectOptions.find(p => p.value === value);
          if (selectedProject) {
            updatedItem.pricePerCent = selectedProject.pricePerCent;
            updatedItem.plotNo = ''; // Reset plot when property changes
            updatedItem.cents = 0; // Reset cents
          }
        }

        // If plot number changes, auto-populate cents
        if (field === 'plotNo') {
          const availablePlots = getAvailablePlots(item.description, selectedInvoice?.id);
          const selectedPlot = availablePlots.find(p => p.plotNo === value);
          if (selectedPlot) {
            updatedItem.cents = selectedPlot.cents;
          }
        }

        // Recalculate totalAmount when cents or pricePerCent changes
        if (field === 'cents' || field === 'pricePerCent' || field === 'description' || field === 'plotNo') {
          updatedItem.totalAmount = updatedItem.cents * updatedItem.pricePerCent;
          updatedItem.finalAmount = updatedItem.totalAmount - updatedItem.discount;
        }

        // Recalculate finalAmount when discount changes
        if (field === 'discount') {
          updatedItem.finalAmount = updatedItem.totalAmount - updatedItem.discount;
        }

        return updatedItem;
      });

      return {
        ...prevFormData,
        lineItems: updatedLineItems,
      };
    });
  };

  const calculateTotal = () => {
    return formData.lineItems.reduce((sum, item) => sum + item.finalAmount, 0);
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

    // Manual validation
    if (!formData.customerName?.trim()) {
      toast({ title: 'Validation Error', description: 'Customer Name is required', variant: 'destructive' });
      return;
    }
    if (!formData.invoiceDate) {
      toast({ title: 'Validation Error', description: 'Invoice Date is required', variant: 'destructive' });
      return;
    }
    if (!formData.dueDate) {
      toast({ title: 'Validation Error', description: 'Due Date is required', variant: 'destructive' });
      return;
    }

    const total = calculateTotal();

    // Sanitize data before sending
    const invoiceData = {
      projectName: formData.projectName,
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      reference: formData.reference,
      leadSource: formData.leadSource,
      amount: total, // Ensure amount is sent
      totalAmount: total,
      status: formData.status,
      invoiceDate: formData.invoiceDate,
      dueDate: formData.dueDate,
      invoiceType: formData.invoiceType,
      lineItems: formData.lineItems,
      attachments: formData.attachments,
      tokenAmount: formData.tokenAmount,
      agreementAmount: formData.agreementAmount,
      registrationAmount: formData.registrationAmount,
      // Send undefined for empty date strings to avoid 400 Bad Request
      agreementDueDate: formData.agreementDueDate || undefined,
      agreementDueAmount: formData.agreementDueAmount,
      registrationDueDate: formData.registrationDueDate || undefined,
      registrationDueAmount: formData.registrationDueAmount,
    };

    if (selectedInvoice) {
      updateMutation.mutate({ id: selectedInvoice.id, data: invoiceData });
    } else {
      createMutation.mutate(invoiceData);
    }
  };

  const handleDownload = (invoice: Invoice) => {
    try {
      exportInvoiceToPDF(invoice);
      toast({ title: 'Success', description: `Invoice ${invoice.id} downloaded successfully.` });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: 'Error',
        description: `Failed to download invoice: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: 'destructive'
      });
    }
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
        { key: 'totalAmount', label: 'Amount' },
        { key: 'status', label: 'Status' },
        { key: 'invoiceType', label: 'Type' },
        { key: 'invoiceDate', label: 'Date' },
        { key: 'dueDate', label: 'Due Date' },
      ]
    );
    toast({ title: 'Exported', description: `${filteredInvoices.length} invoices exported to CSV.` });
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;
  const totalAmount = filteredInvoices?.reduce((sum, inv) => sum + inv.totalAmount, 0) || 0;

  // Helper function to get user name from ID
  const getUserNameById = (userId: string) => {
    if (!Array.isArray(users)) return userId;
    const user = users.find((u: any) => u.id === userId);
    return user ? user.name : userId;
  };

  // Get unique project names and their counts dynamically
  const uniqueProjects = useMemo(() => {
    if (!invoices) return [];
    const projectMap = new Map<string, number>();

    invoices.forEach(invoice => {
      if (invoice.projectName) {
        projectMap.set(
          invoice.projectName,
          (projectMap.get(invoice.projectName) || 0) + 1
        );
      }
    });

    return Array.from(projectMap.entries()).map(([name, count]) => ({
      name,
      count
    }));
  }, [invoices]);

  // Count by status
  const paidCount = invoices?.filter(i => i.status?.toUpperCase() === 'PAID').length || 0;

  // Mobile Card Component
  const InvoiceCard = ({ invoice }: { invoice: Invoice }) => (
    <div className="rounded-lg border bg-card p-4 space-y-3 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-sm">{invoice.invoiceNumber || invoice.id}</p>
            {invoice.projectName && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                {invoice.projectName}
              </Badge>
            )}
          </div>
          <p className="text-foreground text-sm">{invoice.customerName}</p>
        </div>
        <Badge variant="outline" className={statusColors[invoice.status]}>
          {formatStatus(invoice.status)}
        </Badge>
      </div>
      <div className="flex items-center justify-between pt-2 border-t">
        <div>
          <p className="text-xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">₹{invoice.totalAmount.toLocaleString('en-IN')}</p>
          <p className="text-xs text-muted-foreground">Invoice: {invoice.invoiceDate}</p>
          <p className="text-xs text-muted-foreground">Due: {invoice.dueDate || '-'}</p>
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
            <Button size="sm" onClick={openCreateDialog}>
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Create Invoice</span>
            </Button>
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

          {/* Dynamic Project Cards */}
          {uniqueProjects.map((project, index) => {
            const colors = [
              { ring: 'ring-blue-500', border: 'border-blue-500', bg: 'from-blue-500/10 to-blue-500/5', text: 'text-blue-600', icon: 'text-blue-500' },
              { ring: 'ring-orange-500', border: 'border-orange-500', bg: 'from-orange-500/10 to-orange-500/5', text: 'text-orange-600', icon: 'text-orange-500' },
              { ring: 'ring-purple-500', border: 'border-purple-500', bg: 'from-purple-500/10 to-purple-500/5', text: 'text-purple-600', icon: 'text-purple-500' },
              { ring: 'ring-pink-500', border: 'border-pink-500', bg: 'from-pink-500/10 to-pink-500/5', text: 'text-pink-600', icon: 'text-pink-500' },
            ];
            const color = colors[index % colors.length];
            const isActive = typeFilter === project.name;

            return (
              <Card
                key={project.name}
                className={`cursor-pointer transition-all hover:shadow-md ${isActive ? `ring-2 ${color.ring} ${color.border} bg-gradient-to-br ${color.bg}` : ''}`}
                onClick={() => setTypeFilter(project.name)}
              >
                <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
                  <FolderKanban className={`h-5 w-5 sm:h-6 sm:w-6 mb-1 ${isActive ? color.text : color.icon}`} />
                  <p className="text-xs sm:text-sm font-medium">{project.name}</p>
                  <p className={`text-lg sm:text-xl font-bold ${color.text}`}>{project.count}</p>
                </CardContent>
              </Card>
            );
          })}

          <Card
            className={`cursor-pointer transition-all hover:shadow-md ${typeFilter === 'Paid' ? 'ring-2 ring-green-500 border-green-500 bg-gradient-to-br from-green-500/10 to-green-500/5' : ''}`}
            onClick={() => setTypeFilter('Paid')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
              <CheckCircle2 className={`h-5 w-5 sm:h-6 sm:w-6 mb-1 ${typeFilter === 'Paid' ? 'text-green-600' : 'text-green-500'}`} />
              <p className="text-xs sm:text-sm font-medium">Paid</p>
              <p className="text-lg sm:text-xl font-bold text-green-600">{paidCount}</p>
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
                    <th className="pb-3 font-medium">Invoice Number</th>
                    <th className="pb-3 font-medium">Project Name</th>
                    <th className="pb-3 font-medium">Customer</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Due Date</th>
                    <th className="pb-3 font-medium text-center">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices?.map((invoice) => (
                    <tr key={invoice.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 font-medium">{invoice.invoiceNumber || invoice.id}</td>
                      <td className="py-3">
                        {invoice.projectName ? (
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/20">
                            {invoice.projectName}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-sm">-</span>
                        )}
                      </td>
                      <td className="py-3">{invoice.customerName}</td>
                      <td className="py-3 font-semibold">₹{invoice.totalAmount.toLocaleString('en-IN')}</td>
                      <td className="py-3">
                        <Badge variant="outline" className={statusColors[invoice.status]}>
                          {formatStatus(invoice.status)}
                        </Badge>
                      </td>
                      <td className="py-3">{invoice.invoiceDate}</td>
                      <td className="py-3">{invoice.dueDate || '-'}</td>
                      <td className="py-3 text-center">
                        <div className="flex justify-center gap-1">
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
      <Dialog open={isViewDialogOpen} onOpenChange={(open) => { if (!open) { setIsViewDialogOpen(false); setSelectedInvoice(null); } }}>
        <DialogContent className="max-w-[95vw] sm:max-w-lg max-h-[90vh] overflow-y-auto bg-background">
          <DialogHeader>
            <DialogTitle className="text-foreground">Invoice {selectedInvoice?.invoiceNumber || selectedInvoice?.id || 'N/A'}</DialogTitle>
            <DialogDescription>Invoice details</DialogDescription>
          </DialogHeader>
          {selectedInvoice ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Customer</Label>
                  <p className="font-medium">{selectedInvoice.customerName}</p>
                </div>
                {selectedInvoice.reference && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Reference</Label>
                    <p className="font-medium text-sm">{getUserNameById(selectedInvoice.reference)}</p>
                  </div>
                )}
                {selectedInvoice.leadSource && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Lead Source</Label>
                    <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/20">
                      {selectedInvoice.leadSource}
                    </Badge>
                  </div>
                )}
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Badge variant="outline" className={invoiceTypeColors[selectedInvoice.invoiceType]}>
                    {formatInvoiceType(selectedInvoice.invoiceType)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge variant="outline" className={statusColors[selectedInvoice.status]}>
                    {formatStatus(selectedInvoice.status)}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Due Date</Label>
                  <p className="font-medium">{selectedInvoice.dueDate}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <Label className="text-xs text-muted-foreground mb-2 block">Line Items</Label>
                <div className="space-y-3">
                  {selectedInvoice.lineItems.map((item, index) => (
                    <div key={item.id} className="p-3 bg-muted/50 rounded-lg space-y-2">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium">{item.description || 'Item'}</p>
                          {item.plotNo && <p className="text-sm text-muted-foreground">Plot: {item.plotNo}</p>}
                        </div>
                        <span className="text-xs text-muted-foreground">#{index + 1}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-muted-foreground">Cents:</span>
                          <span className="ml-2 font-medium">{item.cents}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Price/Cent:</span>
                          <span className="ml-2 font-medium">₹{item.pricePerCent.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Total:</span>
                          <span className="ml-2 font-medium">₹{item.totalAmount.toLocaleString('en-IN')}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Discount:</span>
                          <span className="ml-2 font-medium text-red-600">-₹{item.discount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
                      <div className="pt-2 border-t">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-semibold">Final Amount:</span>
                          <span className="text-lg font-bold text-green-600">₹{item.finalAmount.toLocaleString('en-IN')}</span>
                        </div>
                      </div>
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
                <span className="text-xl font-bold">₹{selectedInvoice.totalAmount.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              <p>No invoice data available</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>Close</Button>
            <Button onClick={() => selectedInvoice && handleDownload(selectedInvoice)} disabled={!selectedInvoice}>
              <Download className="mr-2 h-4 w-4" />
              Download
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={(open) => { if (!open) closeDialog(); }}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto bg-background text-foreground">
          <DialogHeader>
            <DialogTitle className="text-foreground">{selectedInvoice ? 'Edit Invoice' : 'Create Customer Invoice'}</DialogTitle>
            <DialogDescription>
              {selectedInvoice ? 'Update the invoice details below.' : 'Select a project and fill in the details to create a new invoice.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name</Label>
                <Select
                  value={formData.projectName}
                  onValueChange={(value) => {
                    setFormData({
                      ...formData,
                      projectName: value,
                    });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom">
                    {projectNames.map((project) => (
                      <SelectItem key={project.value} value={project.value}>
                        {project.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
                  <SelectContent position="popper" side="bottom">
                    <SelectItem value="PENDING">Pending</SelectItem>
                    <SelectItem value="PAID">Paid</SelectItem>
                    <SelectItem value="OVERDUE">Overdue</SelectItem>
                    <SelectItem value="PARTIAL">Partial</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerName">Customer Name</Label>
                <Input
                  id="customerName"
                  value={formData.customerName}
                  onChange={(e) => setFormData({ ...formData, customerName: e.target.value })}
                  placeholder="Enter customer name"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="customerPhone">Customer Phone</Label>
                <Input
                  id="customerPhone"
                  value={formData.customerPhone}
                  onChange={(e) => setFormData({ ...formData, customerPhone: e.target.value })}
                  placeholder="Enter customer phone"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reference">Reference (User)</Label>
                <Select
                  key={`reference-${formData.reference || 'empty'}`}
                  value={formData.reference}
                  onValueChange={(value) => setFormData({ ...formData, reference: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select user reference" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom">
                    {Array.isArray(users) && users.length > 0 ? (
                      users.map((user: any) => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.name}
                        </SelectItem>
                      ))
                    ) : (
                      <div className="p-2 text-sm text-muted-foreground text-center">
                        No users available
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="leadSource">Lead Source</Label>
                <Select
                  key={`leadSource-${formData.leadSource || 'empty'}`}
                  value={formData.leadSource}
                  onValueChange={(value) => setFormData({ ...formData, leadSource: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead source" />
                  </SelectTrigger>
                  <SelectContent position="popper" side="bottom">
                    <SelectItem value="Marketing Data">Marketing Data</SelectItem>
                    <SelectItem value="Old Data">Old Data</SelectItem>
                    <SelectItem value="Direct Lead">Direct Lead</SelectItem>
                    <SelectItem value="Referral">Referral</SelectItem>
                    <SelectItem value="Social Media">Social Media</SelectItem>
                    <SelectItem value="Others">Others</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="invoiceDate">Invoice Date</Label>
                <Input
                  id="invoiceDate"
                  type="date"
                  value={formData.invoiceDate}
                  onChange={(e) => setFormData({ ...formData, invoiceDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
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
              {formData.lineItems.map((item, index) => (
                <div key={item.id} className="space-y-4 p-3 sm:p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-muted-foreground">Item #{index + 1}</span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeLineItem(item.id)}
                      disabled={formData.lineItems.length === 1}
                      className="h-7 w-7"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>

                  {/* Project/Description Dropdown */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Project/Property Name</Label>
                    <Select
                      value={item.description}
                      onValueChange={(value) => updateLineItem(item.id, 'description', value)}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select a property" />
                      </SelectTrigger>
                      <SelectContent position="popper" side="bottom" className="max-h-[200px]">
                        {projectOptions.map((project) => (
                          <SelectItem key={project.value} value={project.value}>
                            <span className="text-sm">{project.label} - ₹{project.pricePerCent.toLocaleString('en-IN')}/cent</span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Plot Number Dropdown with Search */}
                  {item.description && (
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Plot Number</Label>
                      <Select
                        value={item.plotNo}
                        onValueChange={(value) => updateLineItem(item.id, 'plotNo', value)}
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Select plot number" />
                        </SelectTrigger>
                        <SelectContent position="popper" side="bottom" className="max-h-[300px]">
                          <div className="p-2">
                            <Input
                              placeholder="Search plot..."
                              value={plotSearchQuery}
                              onChange={(e) => setPlotSearchQuery(e.target.value)}
                              className="mb-2"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                          {getAvailablePlots(item.description, selectedInvoice?.id)
                            ?.filter((plot) =>
                              plot.plotNo.toLowerCase().includes(plotSearchQuery.toLowerCase())
                            )
                            .map((plot) => (
                              <SelectItem key={plot.plotNo} value={plot.plotNo}>
                                {plot.plotNo}
                              </SelectItem>
                            ))}
                          {getAvailablePlots(item.description, selectedInvoice?.id).length === 0 && (
                            <div className="p-2 text-sm text-muted-foreground text-center">
                              No available plots
                            </div>
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  )}

                  {/* Cents and Price per Cent */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Cents</Label>
                      {item.description ? (
                        <Select
                          value={item.cents ? item.cents.toString() : ''}
                          onValueChange={(value) => {
                            const selectedCents = parseFloat(value);
                            // Find the plot with these cents
                            const availablePlots = getAvailablePlots(item.description, selectedInvoice?.id);
                            const matchingPlot = availablePlots.find(p => p.cents === selectedCents);
                            if (matchingPlot) {
                              // Update both cents and plot number
                              updateLineItem(item.id, 'cents', selectedCents);
                              updateLineItem(item.id, 'plotNo', matchingPlot.plotNo);
                            }
                          }}
                        >
                          <SelectTrigger className="w-full">
                            <SelectValue placeholder="Select cents" />
                          </SelectTrigger>
                          <SelectContent position="popper" side="bottom" className="max-h-[300px]">
                            <div className="p-2">
                              <Input
                                placeholder="Search cents..."
                                value={plotSearchQuery}
                                onChange={(e) => setPlotSearchQuery(e.target.value)}
                                className="mb-2"
                                onClick={(e) => e.stopPropagation()}
                              />
                            </div>
                            {getAvailablePlots(item.description, selectedInvoice?.id)
                              ?.filter((plot) =>
                                plot.cents.toString().includes(plotSearchQuery) ||
                                plot.plotNo.toLowerCase().includes(plotSearchQuery.toLowerCase())
                              )
                              .map((plot) => (
                                <SelectItem key={plot.plotNo} value={plot.cents.toString()}>
                                  {plot.cents} cents (Plot {plot.plotNo})
                                </SelectItem>
                              ))}
                            {getAvailablePlots(item.description, selectedInvoice?.id).length === 0 && (
                              <div className="p-2 text-sm text-muted-foreground text-center">
                                No available plots
                              </div>
                            )}
                          </SelectContent>
                        </Select>
                      ) : (
                        <Input
                          type="number"
                          placeholder="Select property first"
                          value=""
                          disabled
                          className="bg-muted w-full"
                        />
                      )}
                      <p className="text-xs text-muted-foreground break-words">
                        {item.plotNo ? `Plot ${item.plotNo}: ${item.cents} cents` : 'Select from dropdown or choose plot'}
                      </p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm font-medium">Price per Cent (₹)</Label>
                      <Input
                        type="number"
                        placeholder="0"
                        value={item.pricePerCent || ''}
                        onChange={(e) => updateLineItem(item.id, 'pricePerCent', parseFloat(e.target.value) || 0)}
                        className="font-semibold w-full"
                        min="0"
                      />
                      <p className="text-xs text-muted-foreground break-words">
                        {(() => {
                          const selectedProject = projectOptions.find(p => p.value === item.description);
                          return selectedProject
                            ? `Default: ₹${selectedProject.pricePerCent.toLocaleString('en-IN')} (editable)`
                            : 'Enter price per cent';
                        })()}
                      </p>
                    </div>
                  </div>

                  {/* Total Amount (Auto-calculated) */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Total Amount</Label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        {item.cents} cents × ₹{item.pricePerCent.toLocaleString('en-IN')} =
                      </span>
                      <span className="text-base sm:text-lg font-bold text-primary sm:ml-auto">
                        ₹{item.totalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>

                  {/* Discount */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Discount (₹)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={item.discount || ''}
                      onChange={(e) => updateLineItem(item.id, 'discount', parseFloat(e.target.value) || 0)}
                      min="0"
                      max={item.totalAmount}
                      className="w-full"
                    />
                  </div>

                  {/* Final Amount (Auto-calculated) */}
                  <div className="space-y-2">
                    <Label className="text-sm font-medium">Final Amount</Label>
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 p-3 bg-green-500/10 rounded-lg border border-green-500/20">
                      <span className="text-xs sm:text-sm text-muted-foreground">
                        ₹{item.totalAmount.toLocaleString('en-IN')} - ₹{item.discount.toLocaleString('en-IN')} =
                      </span>
                      <span className="text-lg sm:text-xl font-bold text-green-600 sm:ml-auto">
                        ₹{item.finalAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex justify-end border-t pt-3 mt-4">
                <div className="text-base sm:text-lg font-semibold">Grand Total: ₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>

            {/* Payment Details Section */}
            <div className="space-y-4 border-t pt-4">
              <Label className="text-base font-semibold">Payment Details</Label>

              {/* Token Amount */}
              <div className="space-y-2">
                <Label htmlFor="tokenAmount">Token Amount (₹)</Label>
                <Input
                  id="tokenAmount"
                  type="number"
                  placeholder="Enter token amount"
                  value={formData.tokenAmount || ''}
                  onChange={(e) => {
                    const tokenAmount = parseFloat(e.target.value) || 0;
                    const grandTotal = calculateTotal();
                    const remainingAfterToken = grandTotal - tokenAmount;
                    setFormData({
                      ...formData,
                      tokenAmount,
                      agreementAmount: remainingAfterToken,
                      agreementDueAmount: remainingAfterToken
                    });
                  }}
                  min="0"
                />
                {formData.tokenAmount > 0 && (
                  <p className="text-sm text-muted-foreground">
                    Remaining Amount: ₹{(calculateTotal() - formData.tokenAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </p>
                )}
              </div>

              {/* Agreement Details */}
              <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                <Label className="text-sm font-semibold text-primary">Agreement Payment</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="agreementDueDate">Due Date for Agreement</Label>
                    <Input
                      id="agreementDueDate"
                      type="date"
                      value={formData.agreementDueDate}
                      onChange={(e) => setFormData({ ...formData, agreementDueDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="agreementDueAmount">Amount to be Paid (₹)</Label>
                    <Input
                      id="agreementDueAmount"
                      type="number"
                      placeholder="Enter agreement amount"
                      value={formData.agreementDueAmount || ''}
                      onChange={(e) => {
                        const agreementDueAmount = parseFloat(e.target.value) || 0;
                        const grandTotal = calculateTotal();
                        const remainingAfterAgreement = grandTotal - formData.tokenAmount - agreementDueAmount;
                        setFormData({
                          ...formData,
                          agreementDueAmount,
                          registrationAmount: remainingAfterAgreement,
                          registrationDueAmount: remainingAfterAgreement
                        });
                      }}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Registration Details */}
              <div className="p-4 border rounded-lg bg-muted/30 space-y-3">
                <Label className="text-sm font-semibold text-primary">Registration Payment</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="registrationDueDate">Due Date for Registration</Label>
                    <Input
                      id="registrationDueDate"
                      type="date"
                      value={formData.registrationDueDate}
                      onChange={(e) => setFormData({ ...formData, registrationDueDate: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="registrationDueAmount">Pending Amount (₹)</Label>
                    <Input
                      id="registrationDueAmount"
                      type="number"
                      placeholder="Enter registration amount"
                      value={formData.registrationDueAmount || ''}
                      onChange={(e) => setFormData({ ...formData, registrationDueAmount: parseFloat(e.target.value) || 0 })}
                      min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Summary */}
              <div className="p-4 bg-gradient-to-r from-primary/10 to-purple-500/10 rounded-lg border-2 border-primary/20">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Grand Total:</span>
                    <span className="font-semibold">₹{calculateTotal().toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Token Amount:</span>
                    <span className="font-semibold text-blue-600">-₹{formData.tokenAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Agreement Amount:</span>
                    <span className="font-semibold text-blue-600">-₹{formData.agreementDueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Registration Amount:</span>
                    <span className="font-semibold text-blue-600">-₹{formData.registrationDueAmount.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </div>
                  <div className="border-t pt-2 flex justify-between">
                    <span className="font-semibold">Balance Remaining:</span>
                    <span className="text-lg font-bold text-primary">
                      ₹{(calculateTotal() - formData.tokenAmount - formData.agreementDueAmount - formData.registrationDueAmount).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>
                </div>
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
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={(open) => { if (!open) { setIsDeleteDialogOpen(false); setSelectedInvoice(null); } }}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg bg-background text-foreground">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-foreground">Delete Invoice</AlertDialogTitle>
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
