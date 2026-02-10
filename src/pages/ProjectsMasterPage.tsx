import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { projectMasterApi } from '@/services/api';
import { ProjectMaster } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Pencil, Trash2, Loader2, Download, Building2, MapPin } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToCSV } from '@/utils/export';

export default function ProjectsMasterPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isProjectDialogOpen, setIsProjectDialogOpen] = useState(false);
  const [selectedMaster, setSelectedMaster] = useState<ProjectMaster | null>(null);
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [projectFormData, setProjectFormData] = useState({
    projectName: '',
    propertyName: '',
  });
  const [formData, setFormData] = useState({
    projectName: '',
    propertyName: '',
    plotNumber: '',
    plotArea: 0,
    plotPrice: 0,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: masters, isLoading } = useQuery({
    queryKey: ['projectMasters'],
    queryFn: projectMasterApi.getAll,
  });

  const { data: projects = [] } = useQuery({
    queryKey: ['uniqueProjects'],
    queryFn: async () => {
      if (!masters) return [];
      return [...new Set(masters.map(m => m.projectName))];
    },
    enabled: !!masters,
  });

  const { data: properties = [] } = useQuery({
    queryKey: ['uniqueProperties'],
    queryFn: async () => {
      if (!masters) return [];
      return [...new Set(masters.map(m => m.propertyName))];
    },
    enabled: !!masters,
  });

  const filteredMasters = masters?.filter((master) => {
    // Hide placeholder entries from the table view
    if (master.plotNumber === '__PLACEHOLDER__') return false;
    if (projectFilter !== 'all' && master.projectName !== projectFilter) return false;
    return true;
  });

  const createMutation = useMutation({
    mutationFn: projectMasterApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMasters'] });
      queryClient.invalidateQueries({ queryKey: ['uniqueProjects'] });
      toast({ title: 'Success', description: 'Project master created successfully.' });
      closeDialog();
    },
    onError: (error: any) => {
      console.error('Create mutation error:', error);
      const errorMessage = error?.message || 'Failed to create project master.';
      toast({ title: 'Error', description: errorMessage, variant: 'destructive' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<ProjectMaster> }) =>
      projectMasterApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMasters'] });
      queryClient.invalidateQueries({ queryKey: ['uniqueProjects'] });
      toast({ title: 'Success', description: 'Project master updated successfully.' });
      closeDialog();
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to update project master.', variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: projectMasterApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projectMasters'] });
      queryClient.invalidateQueries({ queryKey: ['uniqueProjects'] });
      toast({ title: 'Success', description: 'Project master deleted successfully.' });
      setIsDeleteDialogOpen(false);
      setSelectedMaster(null);
    },
    onError: () => {
      toast({ title: 'Error', description: 'Failed to delete project master.', variant: 'destructive' });
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedMaster(null);
    setFormData({
      projectName: '',
      propertyName: '',
      plotNumber: '',
      plotArea: 0,
      plotPrice: 0,
    });
  };

  const openCreateDialog = () => {
    setSelectedMaster(null);
    setFormData({
      projectName: '',
      propertyName: '',
      plotNumber: '',
      plotArea: 0,
      plotPrice: 0,
    });
    setIsDialogOpen(true);
  };

  const openProjectDialog = () => {
    setProjectFormData({ projectName: '', propertyName: '' });
    setIsProjectDialogOpen(true);
  };

  const closeProjectDialog = () => {
    setIsProjectDialogOpen(false);
    setProjectFormData({ projectName: '', propertyName: '' });
  };

  const handleProjectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!projectFormData.projectName.trim()) {
      toast({ title: 'Validation Error', description: 'Project name is required.', variant: 'destructive' });
      return;
    }

    if (!projectFormData.propertyName.trim()) {
      toast({ title: 'Validation Error', description: 'Property/Phase name is required.', variant: 'destructive' });
      return;
    }

    // Check if this exact project+property combination already exists
    const exists = masters?.some(
      m => m.projectName === projectFormData.projectName &&
           m.propertyName === projectFormData.propertyName
    );

    if (exists) {
      toast({
        title: 'Already Exists',
        description: `Project "${projectFormData.projectName}" with property "${projectFormData.propertyName}" already exists.`,
        variant: 'destructive'
      });
      return;
    }

    // Create a placeholder entry to register the project+property combination
    // This will make them available in the dropdowns
    createMutation.mutate({
      projectName: projectFormData.projectName,
      propertyName: projectFormData.propertyName,
      plotNumber: '__PLACEHOLDER__', // Placeholder plot number
      plotArea: 0,
      plotPrice: 0,
    });

    toast({
      title: 'Success',
      description: `Project "${projectFormData.projectName}" with property "${projectFormData.propertyName}" registered. You can now add plots to it.`
    });
    closeProjectDialog();
  };

  const openEditDialog = (master: ProjectMaster) => {
    setSelectedMaster(master);
    setFormData({
      projectName: master.projectName,
      propertyName: master.propertyName,
      plotNumber: master.plotNumber,
      plotArea: master.plotArea,
      plotPrice: master.plotPrice,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.projectName.trim()) {
      toast({ title: 'Validation Error', description: 'Project name is required.', variant: 'destructive' });
      return;
    }
    if (!formData.propertyName.trim()) {
      toast({ title: 'Validation Error', description: 'Property name is required.', variant: 'destructive' });
      return;
    }
    if (!formData.plotNumber.trim()) {
      toast({ title: 'Validation Error', description: 'Plot number is required.', variant: 'destructive' });
      return;
    }
    if (formData.plotArea <= 0) {
      toast({ title: 'Validation Error', description: 'Plot area must be greater than 0.', variant: 'destructive' });
      return;
    }
    if (formData.plotPrice <= 0) {
      toast({ title: 'Validation Error', description: 'Plot price must be greater than 0.', variant: 'destructive' });
      return;
    }

    if (selectedMaster) {
      updateMutation.mutate({ id: selectedMaster.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  // Calculate stats (exclude placeholder entries)
  const realMasters = masters?.filter(m => m.plotNumber !== '__PLACEHOLDER__') || [];
  const totalPlots = realMasters.length;
  const totalProjects = projects.length;
  const totalPropertyValue = realMasters.reduce((sum, m) => sum + (m.plotPrice * m.plotArea), 0);
  const totalArea = realMasters.reduce((sum, m) => sum + m.plotArea, 0);

  const handleExportAll = () => {
    if (!filteredMasters || filteredMasters.length === 0) {
      toast({ title: 'No Data', description: 'No project masters to export.', variant: 'destructive' });
      return;
    }
    exportToCSV(
      filteredMasters,
      `project-masters-export-${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'projectName', label: 'Project Name' },
        { key: 'propertyName', label: 'Property Name' },
        { key: 'plotNumber', label: 'Plot Number' },
        { key: 'plotArea', label: 'Plot Area (Cents)' },
        { key: 'plotPrice', label: 'Price per Cent (₹)' },
      ]
    );
    toast({ title: 'Exported', description: `${filteredMasters.length} project masters exported to CSV.` });
  };

  return (
    <MainLayout title="Projects Master">
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Building2 className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Projects</p>
                  <p className="text-2xl font-bold">{totalProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <MapPin className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Plots</p>
                  <p className="text-2xl font-bold">{totalPlots}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <Building2 className="h-5 w-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Area</p>
                  <p className="text-2xl font-bold">{totalArea.toFixed(2)} Cents</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <Building2 className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total Value</p>
                  <p className="text-2xl font-bold">₹{(totalPropertyValue / 10000000).toFixed(1)}Cr</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-2">
          <Select value={projectFilter} onValueChange={setProjectFilter}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Filter by Project" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Projects</SelectItem>
              {projects.map((project: string) => (
                <SelectItem key={project} value={project}>{project}</SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="flex gap-2 ml-auto">
            <Button variant="outline" size="sm" onClick={openProjectDialog}>
              <Plus className="h-4 w-4 mr-2" />
              Add Project
            </Button>
            <Button variant="outline" size="sm" onClick={handleExportAll}>
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Master
            </Button>
          </div>
        </div>

        {/* Table View */}
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Project Name</TableHead>
                  <TableHead>Property Name</TableHead>
                  <TableHead>Plot Number</TableHead>
                  <TableHead className="text-right">Area (Cents)</TableHead>
                  <TableHead className="text-right">Price per Cent (₹)</TableHead>
                  <TableHead className="text-right">Total Value (₹)</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={i}>
                      {Array.from({ length: 7 }).map((_, j) => (
                        <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                      ))}
                    </TableRow>
                  ))
                ) : filteredMasters && filteredMasters.length > 0 ? (
                  filteredMasters.map((master) => {
                    const totalValue = master.plotArea * master.plotPrice;
                    return (
                      <TableRow key={master.id} className="hover:bg-accent transition-colors">
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50/50">
                            {master.projectName}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{master.propertyName}</TableCell>
                        <TableCell>
                          <Badge variant="secondary">{master.plotNumber}</Badge>
                        </TableCell>
                        <TableCell className="text-right font-mono">{master.plotArea.toFixed(2)}</TableCell>
                        <TableCell className="text-right font-mono">₹{master.plotPrice.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right font-bold">₹{totalValue.toLocaleString('en-IN')}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => openEditDialog(master)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              onClick={() => {
                                setSelectedMaster(master);
                                setIsDeleteDialogOpen(true);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                      No project masters found
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedMaster ? 'Edit Project Master' : 'Create Project Master'}</DialogTitle>
              <DialogDescription>
                {selectedMaster ? 'Update project master details' : 'Add a new project master with plot information'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="projectName">Project Name *</Label>
                <Select
                  value={formData.projectName}
                  onValueChange={(value) => setFormData({ ...formData, projectName: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a project" />
                  </SelectTrigger>
                  <SelectContent>
                    {projects.length === 0 ? (
                      <SelectItem value="none" disabled>
                        No projects available - Add one first
                      </SelectItem>
                    ) : (
                      projects.map((project: string) => (
                        <SelectItem key={project} value={project}>
                          {project}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Don't see your project? Click "Add Project" button above
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="propertyName">Property/Phase Name *</Label>
                <Select
                  value={formData.propertyName}
                  onValueChange={(value) => setFormData({ ...formData, propertyName: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property name" />
                  </SelectTrigger>
                  <SelectContent>
                    {properties.length === 0 ? (
                      <SelectItem value="__none__" disabled>
                        No properties yet - Add one using "Add Project" button
                      </SelectItem>
                    ) : (
                      properties.map((property: string) => (
                        <SelectItem key={property} value={property}>
                          {property}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  Don't see your property? Click "Add Project" button above to register it
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="plotNumber">Plot Number *</Label>
                <Input
                  id="plotNumber"
                  placeholder="e.g:1"
                  value={formData.plotNumber}
                  onChange={(e) => setFormData({ ...formData, plotNumber: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plotArea">Plot Area (in Cents) *</Label>
                <Input
                  id="plotArea"
                  type="number"
                  step="0.01"
                  placeholder="e.g:12"
                  value={formData.plotArea || ''}
                  onChange={(e) => setFormData({ ...formData, plotArea: Number(e.target.value) })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="plotPrice">Price per Cent (₹) *</Label>
                <Input
                  id="plotPrice"
                  type="number"
                  placeholder="e.g:2,00,000"
                  value={formData.plotPrice || ''}
                  onChange={(e) => setFormData({ ...formData, plotPrice: Number(e.target.value) })}
                  required
                />
              </div>

              {/* Calculate total value */}
              {formData.plotArea > 0 && formData.plotPrice > 0 && (
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-muted-foreground mb-1">Total Plot Value</p>
                  <p className="text-xl font-bold text-blue-600">
                    ₹{(formData.plotArea * formData.plotPrice).toLocaleString('en-IN')}
                  </p>
                </div>
              )}

              <DialogFooter className="pt-4">
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isMutating}>
                  {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedMaster ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project Master</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedMaster?.projectName} - Plot {selectedMaster?.plotNumber}"? This will remove it from all references.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedMaster && deleteMutation.mutate(selectedMaster.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {/* Add Main Project Dialog */}
        <Dialog open={isProjectDialogOpen} onOpenChange={setIsProjectDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add Main Project & Property</DialogTitle>
              <DialogDescription>
                Register a new project with its property/phase or manage existing ones
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Existing Projects Table */}
              {masters && masters.filter(m => m.plotNumber === '__PLACEHOLDER__').length > 0 && (
                <div className="space-y-2">
                  <h3 className="text-sm font-semibold">Registered Projects & Properties:</h3>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow className="bg-muted/50">
                          <TableHead className="w-[35%]">Project Name</TableHead>
                          <TableHead className="w-[50%]">Property Name</TableHead>
                          <TableHead className="w-[15%] text-right">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {masters
                          .filter(m => m.plotNumber === '__PLACEHOLDER__')
                          .map((master) => (
                            <TableRow key={master.id} className="hover:bg-accent/50">
                              <TableCell>
                                <Badge variant="outline" className="bg-blue-50/50">
                                  {master.projectName}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                {master.propertyName}
                              </TableCell>
                              <TableCell className="text-right">
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                  onClick={() => {
                                    if (window.confirm(`Delete "${master.projectName} - ${master.propertyName}"?\n\nNote: Only the project-property registration will be deleted. Any existing plots will remain.`)) {
                                      deleteMutation.mutate(master.id);
                                    }
                                  }}
                                  title="Delete this project-property registration"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 Deleting a registration only removes the placeholder entry. Your actual plots remain safe.
                  </p>
                </div>
              )}

              {/* Add New Project Form */}
              <form onSubmit={handleProjectSubmit} className="space-y-4 pt-4 border-t">
                <h3 className="text-sm font-semibold">Register New Project & Property:</h3>

                <div className="space-y-2">
                  <Label htmlFor="mainProjectName">Project Name *</Label>
                  <Input
                    id="mainProjectName"
                    placeholder="e.g., Ananta Giri"
                    value={projectFormData.projectName}
                    onChange={(e) => setProjectFormData({ ...projectFormData, projectName: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Main project name for grouping properties
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="mainPropertyName">Property/Phase Name *</Label>
                  <Input
                    id="mainPropertyName"
                    placeholder="e.g., Ananta Giri Farm Lands"
                    value={projectFormData.propertyName}
                    onChange={(e) => setProjectFormData({ ...projectFormData, propertyName: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Specific property or phase name within the project
                  </p>
                </div>

                {/* Info note */}
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-xs text-green-800">
                    ℹ️ This will register the project and property in the database,
                    making them available in the dropdowns when you add plots.
                  </p>
                </div>

                <DialogFooter className="pt-4">
                  <Button type="button" variant="outline" onClick={closeProjectDialog}>
                    Close
                  </Button>
                  <Button type="submit" disabled={isMutating}>
                    {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Add Project
                  </Button>
                </DialogFooter>
              </form>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </MainLayout>
  );
}

