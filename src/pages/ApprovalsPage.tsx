import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { approvalApi } from '@/services/api';
import { ApprovalRequest } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Check, X, Loader2, Clock, CheckCircle, XCircle, Search, Download, Eye, Filter, Plus, AlertTriangle, FileText } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToCSV } from '@/utils/export';
import { Textarea } from '@/components/ui/textarea';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';

const statusColors: Record<ApprovalRequest['status'], string> = {
  Approved: 'bg-green-500/10 text-green-600 border-green-500/20',
  Pending: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Rejected: 'bg-destructive/10 text-destructive border-destructive/20',
};

const typeColors: Record<ApprovalRequest['type'], string> = {
  Expense: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  Invoice: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'Time Off': 'bg-teal-500/10 text-teal-600 border-teal-500/20',
  Budget: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  Leave: 'bg-green-500/10 text-green-600 border-green-500/20',
  Purchase: 'bg-pink-500/10 text-pink-600 border-pink-500/20',
};

const types: ApprovalRequest['type'][] = ['Expense', 'Invoice', 'Time Off', 'Budget', 'Leave', 'Purchase'];

export default function ApprovalsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [newRequest, setNewRequest] = useState({
    type: 'Expense' as ApprovalRequest['type'],
    description: '',
    amount: '',
    priority: 'Normal' as 'Urgent' | 'Normal',
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: approvals, isLoading } = useQuery({
    queryKey: ['approvals'],
    queryFn: approvalApi.getAll,
  });

  // Filter approvals based on tab and filters
  const filteredApprovals = approvals?.filter((approval) => {
    const matchesSearch = approval.requestedBy.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          approval.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          approval.id.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || approval.status === statusFilter;
    const matchesType = typeFilter === 'all' || approval.type === typeFilter;
    
    // Tab filtering
    let matchesTab = true;
    if (activeTab === 'urgent') {
      matchesTab = approval.priority === 'Urgent';
    } else if (activeTab === 'pending') {
      matchesTab = approval.status === 'Pending';
    } else if (activeTab === 'approved') {
      matchesTab = approval.status === 'Approved';
    } else if (activeTab === 'rejected') {
      matchesTab = approval.status === 'Rejected';
    }
    
    return matchesSearch && matchesStatus && matchesType && matchesTab;
  });

  const approveMutation = useMutation({
    mutationFn: approvalApi.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast({ title: 'Approved', description: 'Request has been approved.' });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: approvalApi.reject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['approvals'] });
      toast({ title: 'Rejected', description: 'Request has been rejected.' });
    },
  });

  const handleExport = () => {
    if (!filteredApprovals || filteredApprovals.length === 0) {
      toast({ title: 'No Data', description: 'No approvals to export.', variant: 'destructive' });
      return;
    }
    exportToCSV(
      filteredApprovals,
      `approvals-export-${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Approval ID' },
        { key: 'type', label: 'Type' },
        { key: 'requestedBy', label: 'Requested By' },
        { key: 'description', label: 'Description' },
        { key: 'amount', label: 'Amount' },
        { key: 'status', label: 'Status' },
        { key: 'date', label: 'Date' },
      ]
    );
    toast({ title: 'Exported', description: `${filteredApprovals.length} approvals exported to CSV.` });
  };

  const openViewDialog = (approval: ApprovalRequest) => {
    setSelectedApproval(approval);
    setIsViewDialogOpen(true);
  };

  const clearFilters = () => {
    setSearchQuery('');
    setStatusFilter('all');
    setTypeFilter('all');
  };

  const pendingCount = approvals?.filter(a => a.status === 'Pending').length || 0;
  const approvedCount = approvals?.filter(a => a.status === 'Approved').length || 0;
  const rejectedCount = approvals?.filter(a => a.status === 'Rejected').length || 0;
  const totalCount = approvals?.length || 0;
  const urgentCount = approvals?.filter(a => a.priority === 'Urgent').length || 0;
  const totalAmount = filteredApprovals?.reduce((sum, a) => sum + a.amount, 0) || 0;

  const handleCreateRequest = () => {
    const newApproval: ApprovalRequest = {
      id: `APR-${String(totalCount + 1).padStart(3, '0')}`,
      type: newRequest.type,
      requestedBy: 'Current User',
      description: newRequest.description,
      amount: parseFloat(newRequest.amount) || 0,
      status: 'Pending',
      date: new Date().toISOString().split('T')[0],
      priority: newRequest.priority,
      department: 'General',
    };
    
    toast({ 
      title: 'Request Submitted', 
      description: `${newRequest.type} request has been submitted for approval.` 
    });
    
    setIsCreateDialogOpen(false);
    setNewRequest({ type: 'Expense', description: '', amount: '', priority: 'Normal' });
    queryClient.invalidateQueries({ queryKey: ['approvals'] });
  };

  // Mobile Card Component
  const ApprovalCard = ({ approval }: { approval: ApprovalRequest }) => (
    <div className="rounded-lg border bg-card p-4 space-y-3 overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="flex gap-2 flex-wrap min-w-0 flex-1">
          <Badge variant="outline" className={`${typeColors[approval.type]} shrink-0`}>
            {approval.type}
          </Badge>
          <Badge variant="outline" className={`${statusColors[approval.status]} shrink-0`}>
            {approval.status}
          </Badge>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => openViewDialog(approval)}>
          <Eye className="h-4 w-4" />
        </Button>
      </div>
      <div className="space-y-1 min-w-0">
        <p className="text-sm font-medium truncate">{approval.requestedBy}</p>
        <p className="text-xs text-muted-foreground line-clamp-2">{approval.description}</p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t gap-2">
        <div className="min-w-0 flex-1">
          {approval.amount > 0 && (
            <p className="text-lg font-bold truncate">₹{approval.amount.toLocaleString('en-IN')}</p>
          )}
          <p className="text-xs text-muted-foreground truncate">{approval.date}</p>
        </div>
        {approval.status === 'Pending' && (
          <div className="flex gap-2 shrink-0">
            <Button
              variant="outline"
              size="sm"
              className="text-green-600 border-green-600 hover:bg-green-600 hover:text-green-50"
              onClick={() => approveMutation.mutate(approval.id)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              {approveMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="text-destructive border-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => rejectMutation.mutate(approval.id)}
              disabled={approveMutation.isPending || rejectMutation.isPending}
            >
              {rejectMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <X className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <MainLayout title="Approvals">
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="hidden sm:block">
            <p className="text-muted-foreground text-sm">Review and manage approval requests</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleExport}>
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              New Request
            </Button>
          </div>
        </div>

        {/* Category Filter Cards */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 sm:gap-3">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${activeTab === 'all' ? 'ring-2 ring-primary border-primary' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
              <FileText className={`h-5 w-5 sm:h-6 sm:w-6 mb-1 shrink-0 ${activeTab === 'all' ? 'text-primary' : 'text-muted-foreground'}`} />
              <p className="text-xs sm:text-sm font-medium truncate w-full">Total Requests</p>
              <p className={`text-lg sm:text-xl font-bold ${activeTab === 'all' ? 'text-primary' : ''}`}>{totalCount}</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${activeTab === 'urgent' ? 'ring-2 ring-destructive border-destructive' : ''}`}
            onClick={() => setActiveTab('urgent')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
              <AlertTriangle className={`h-5 w-5 sm:h-6 sm:w-6 mb-1 shrink-0 ${activeTab === 'urgent' ? 'text-destructive' : 'text-orange-500'}`} />
              <p className="text-xs sm:text-sm font-medium truncate w-full">Urgent</p>
              <p className={`text-lg sm:text-xl font-bold ${activeTab === 'urgent' ? 'text-destructive' : 'text-orange-500'}`}>{urgentCount}</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${activeTab === 'pending' ? 'ring-2 ring-amber-500 border-amber-500' : ''}`}
            onClick={() => setActiveTab('pending')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
              <Clock className={`h-5 w-5 sm:h-6 sm:w-6 mb-1 shrink-0 ${activeTab === 'pending' ? 'text-amber-600' : 'text-amber-500'}`} />
              <p className="text-xs sm:text-sm font-medium truncate w-full">Pending</p>
              <p className={`text-lg sm:text-xl font-bold text-amber-600`}>{pendingCount}</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${activeTab === 'approved' ? 'ring-2 ring-green-500 border-green-500' : ''}`}
            onClick={() => setActiveTab('approved')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
              <CheckCircle className={`h-5 w-5 sm:h-6 sm:w-6 mb-1 shrink-0 ${activeTab === 'approved' ? 'text-green-600' : 'text-green-500'}`} />
              <p className="text-xs sm:text-sm font-medium truncate w-full">Approved</p>
              <p className={`text-lg sm:text-xl font-bold text-green-600`}>{approvedCount}</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md overflow-hidden ${activeTab === 'rejected' ? 'ring-2 ring-destructive border-destructive' : ''}`}
            onClick={() => setActiveTab('rejected')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
              <XCircle className={`h-5 w-5 sm:h-6 sm:w-6 mb-1 shrink-0 text-destructive`} />
              <p className="text-xs sm:text-sm font-medium truncate w-full">Rejected</p>
              <p className={`text-lg sm:text-xl font-bold text-destructive`}>{rejectedCount}</p>
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
            {filteredApprovals?.length || 0} results
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
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Approved">Approved</SelectItem>
                      <SelectItem value="Rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Select value={typeFilter} onValueChange={setTypeFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {types.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
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
                  placeholder="Search approvals..."
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
                  <SelectItem value="Pending">Pending</SelectItem>
                  <SelectItem value="Approved">Approved</SelectItem>
                  <SelectItem value="Rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Summary */}
        <div className="flex items-center justify-between rounded-lg border bg-card p-3">
          <span className="text-sm text-muted-foreground">
            {filteredApprovals?.length || 0} requests found
          </span>
          <span className="font-semibold">
            Total: ₹{totalAmount.toLocaleString('en-IN')}
          </span>
        </div>

        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-36 w-full" />)
          ) : filteredApprovals?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No approvals found</div>
          ) : (
            filteredApprovals?.map((approval) => <ApprovalCard key={approval.id} approval={approval} />)
          )}
        </div>

        {/* Desktop View - Table */}
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>Approval Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filteredApprovals?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No approvals found</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">ID</th>
                    <th className="pb-3 font-medium">Type</th>
                    <th className="pb-3 font-medium">Requested By</th>
                    <th className="pb-3 font-medium">Description</th>
                    <th className="pb-3 font-medium">Amount</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredApprovals?.map((approval) => (
                    <tr key={approval.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 font-medium">{approval.id}</td>
                      <td className="py-3">
                        <Badge variant="outline" className={typeColors[approval.type]}>
                          {approval.type}
                        </Badge>
                      </td>
                      <td className="py-3">{approval.requestedBy}</td>
                      <td className="py-3 max-w-[200px] truncate">{approval.description}</td>
                      <td className="py-3">
                        {approval.amount > 0 ? `₹${approval.amount.toLocaleString('en-IN')}` : '-'}
                      </td>
                      <td className="py-3">
                        <Badge variant="outline" className={statusColors[approval.status]}>
                          {approval.status}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-1">
                          <Button variant="ghost" size="icon" onClick={() => openViewDialog(approval)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          {approval.status === 'Pending' && (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-green-600 hover:bg-green-600/10"
                                onClick={() => approveMutation.mutate(approval.id)}
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                              >
                                {approveMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <Check className="h-4 w-4" />
                                )}
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive hover:bg-destructive/10"
                                onClick={() => rejectMutation.mutate(approval.id)}
                                disabled={approveMutation.isPending || rejectMutation.isPending}
                              >
                                {rejectMutation.isPending ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <X className="h-4 w-4" />
                                )}
                              </Button>
                            </>
                          )}
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

      {/* View Details Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Approval Request {selectedApproval?.id}</DialogTitle>
            <DialogDescription>Request details</DialogDescription>
          </DialogHeader>
          {selectedApproval && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Type</Label>
                  <Badge variant="outline" className={typeColors[selectedApproval.type]}>
                    {selectedApproval.type}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <Badge variant="outline" className={statusColors[selectedApproval.status]}>
                    {selectedApproval.status}
                  </Badge>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Requested By</Label>
                  <p className="font-medium">{selectedApproval.requestedBy}</p>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <p className="font-medium">{selectedApproval.date}</p>
                </div>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Description</Label>
                <p className="font-medium">{selectedApproval.description}</p>
              </div>
              {selectedApproval.amount > 0 && (
                <div className="border-t pt-4 flex justify-between items-center">
                  <span className="font-medium">Amount</span>
                  <span className="text-2xl font-bold">₹{selectedApproval.amount.toLocaleString('en-IN')}</span>
                </div>
              )}
              {selectedApproval.status === 'Pending' && (
                <div className="flex gap-2 pt-2">
                  <Button
                    className="flex-1"
                    variant="outline"
                    onClick={() => {
                      approveMutation.mutate(selectedApproval.id);
                      setIsViewDialogOpen(false);
                    }}
                    disabled={approveMutation.isPending}
                  >
                    <Check className="mr-2 h-4 w-4" />
                    Approve
                  </Button>
                  <Button
                    className="flex-1"
                    variant="destructive"
                    onClick={() => {
                      rejectMutation.mutate(selectedApproval.id);
                      setIsViewDialogOpen(false);
                    }}
                    disabled={rejectMutation.isPending}
                  >
                    <X className="mr-2 h-4 w-4" />
                    Reject
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* New Approval Request Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>New Approval Request</DialogTitle>
            <DialogDescription>Submit a new request for approval</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Request Type</Label>
              <Select
                value={newRequest.type}
                onValueChange={(value) => setNewRequest({ ...newRequest, type: value as ApprovalRequest['type'] })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {types.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={newRequest.priority}
                onValueChange={(value) => setNewRequest({ ...newRequest, priority: value as 'Urgent' | 'Normal' })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Normal">Normal</SelectItem>
                  <SelectItem value="Urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Amount ($)</Label>
              <Input
                type="number"
                placeholder="0.00"
                value={newRequest.amount}
                onChange={(e) => setNewRequest({ ...newRequest, amount: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Describe your request..."
                value={newRequest.description}
                onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setIsCreateDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleCreateRequest}
                disabled={!newRequest.description.trim()}
              >
                Submit Request
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}