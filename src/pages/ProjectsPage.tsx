import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { projectApi } from '@/services/api';
import { Project, ProjectStatus, ProjectPriority, ProjectMilestone } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Filter,
  Download,
  FolderKanban,
  Calendar,
  Users,
  Target,
  Clock,
  CheckCircle,
  AlertTriangle,
  Pause,
  XCircle,
  Flag,
  Check,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToCSV } from '@/utils/export';
import {
  Collapsible,
  CollapsibleContent,
} from '@/components/ui/collapsible';

const statusColors: Record<ProjectStatus, string> = {
  'Not Started': 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  'In Progress': 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  'On Hold': 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  'Completed': 'bg-green-500/10 text-green-600 border-green-500/20',
  'Cancelled': 'bg-destructive/10 text-destructive border-destructive/20',
};

const statusIcons: Record<ProjectStatus, React.ElementType> = {
  'Not Started': Clock,
  'In Progress': Target,
  'On Hold': Pause,
  'Completed': CheckCircle,
  'Cancelled': XCircle,
};

const priorityColors: Record<ProjectPriority, string> = {
  Low: 'bg-slate-500/10 text-slate-600 border-slate-500/20',
  Medium: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  High: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  Critical: 'bg-destructive/10 text-destructive border-destructive/20',
};

const statuses: ProjectStatus[] = ['Not Started', 'In Progress', 'On Hold', 'Completed', 'Cancelled'];
const priorities: ProjectPriority[] = ['Low', 'Medium', 'High', 'Critical'];

export default function ProjectsPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    customer: '',
    status: 'Not Started' as ProjectStatus,
    priority: 'Medium' as ProjectPriority,
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    budget: 0,
    spent: 0,
    progress: 0,
    teamMembers: [] as string[],
    milestones: [] as ProjectMilestone[],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: projectApi.getAll,
  });

  const filteredProjects = projects?.filter((project) => {
    if (statusFilter !== 'all' && project.status !== statusFilter) return false;
    if (priorityFilter !== 'all' && project.priority !== priorityFilter) return false;
    return true;
  });

  const createMutation = useMutation({
    mutationFn: projectApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Success', description: 'Project created successfully.' });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Project> }) =>
      projectApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Success', description: 'Project updated successfully.' });
      closeDialog();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: projectApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast({ title: 'Success', description: 'Project deleted successfully.' });
      setIsDeleteDialogOpen(false);
      setSelectedProject(null);
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedProject(null);
    setFormData({
      name: '',
      description: '',
      customer: '',
      status: 'Not Started',
      priority: 'Medium',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      budget: 0,
      spent: 0,
      progress: 0,
      teamMembers: [],
      milestones: [],
    });
  };

  const openCreateDialog = () => {
    setSelectedProject(null);
    setFormData({
      name: '',
      description: '',
      customer: '',
      status: 'Not Started',
      priority: 'Medium',
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      budget: 0,
      spent: 0,
      progress: 0,
      teamMembers: [],
      milestones: [],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (project: Project) => {
    setSelectedProject(project);
    setFormData({
      name: project.name,
      description: project.description,
      customer: project.customer,
      status: project.status,
      priority: project.priority,
      startDate: project.startDate,
      endDate: project.endDate,
      budget: project.budget,
      spent: project.spent,
      progress: project.progress,
      teamMembers: project.teamMembers,
      milestones: project.milestones,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedProject) {
      updateMutation.mutate({ id: selectedProject.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;

  // Calculate stats
  const totalProjects = projects?.length || 0;
  const inProgressProjects = projects?.filter(p => p.status === 'In Progress').length || 0;
  const completedProjects = projects?.filter(p => p.status === 'Completed').length || 0;
  const totalBudget = projects?.reduce((sum, p) => sum + p.budget, 0) || 0;
  const totalSpent = projects?.reduce((sum, p) => sum + p.spent, 0) || 0;
  const overdueProjects = projects?.filter(p => {
    const endDate = new Date(p.endDate);
    return endDate < new Date() && p.status !== 'Completed' && p.status !== 'Cancelled';
  }).length || 0;

  const handleExportAll = () => {
    if (!filteredProjects || filteredProjects.length === 0) {
      toast({ title: 'No Data', description: 'No projects to export.', variant: 'destructive' });
      return;
    }
    exportToCSV(
      filteredProjects,
      `projects-export-${new Date().toISOString().split('T')[0]}`,
      [
        { key: 'id', label: 'Project ID' },
        { key: 'name', label: 'Name' },
        { key: 'customer', label: 'Customer' },
        { key: 'status', label: 'Status' },
        { key: 'priority', label: 'Priority' },
        { key: 'startDate', label: 'Start Date' },
        { key: 'endDate', label: 'End Date' },
        { key: 'budget', label: 'Budget' },
        { key: 'spent', label: 'Spent' },
        { key: 'progress', label: 'Progress %' },
      ]
    );
    toast({ title: 'Exported', description: `${filteredProjects.length} projects exported to CSV.` });
  };

  const getDaysRemaining = (endDate: string) => {
    const end = new Date(endDate);
    const today = new Date();
    const diff = Math.ceil((end.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    return diff;
  };

  // Helper to calculate milestone stats
  const getMilestoneStats = (milestones: ProjectMilestone[]) => {
    const total = milestones.length;
    const completed = milestones.filter(m => m.completed).length;
    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;
    return { total, completed, percentage };
  };

  // Project Card Component for mobile
  const ProjectCard = ({ project }: { project: Project }) => {
    const StatusIcon = statusIcons[project.status];
    const daysRemaining = getDaysRemaining(project.endDate);
    const milestoneStats = getMilestoneStats(project.milestones);
    
    return (
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-start justify-between">
          <div className="space-y-1">
            <h3 className="font-semibold text-sm">{project.name}</h3>
            <p className="text-xs text-muted-foreground">{project.customer}</p>
          </div>
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEditDialog(project)}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8"
              onClick={() => {
                setSelectedProject(project);
                setIsDeleteDialogOpen(true);
              }}
            >
              <Trash2 className="h-4 w-4 text-destructive" />
            </Button>
          </div>
        </div>
        
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className={statusColors[project.status]}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {project.status}
          </Badge>
          <Badge variant="outline" className={priorityColors[project.priority]}>
            {project.priority}
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-medium">{project.progress}%</span>
          </div>
          <Progress value={project.progress} className="h-2" />
        </div>

        {/* Milestones Progress */}
        {milestoneStats.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground flex items-center gap-1">
                <Flag className="h-3 w-3" />
                Milestones
              </span>
              <span className="font-medium">{milestoneStats.completed}/{milestoneStats.total}</span>
            </div>
            <Progress value={milestoneStats.percentage} className="h-2" />
          </div>
        )}
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-1 text-muted-foreground">
            <Calendar className="h-3 w-3" />
            <span>{project.endDate}</span>
          </div>
          <span className={daysRemaining < 0 ? 'text-destructive font-medium' : daysRemaining <= 7 ? 'text-amber-600 font-medium' : 'text-muted-foreground'}>
            {daysRemaining < 0 ? `${Math.abs(daysRemaining)} days overdue` : `${daysRemaining} days left`}
          </span>
        </div>
        
        <div className="flex items-center justify-between pt-2 border-t">
          <div className="text-xs">
            <span className="text-muted-foreground">Budget: </span>
            <span className="font-medium">₹{project.budget.toLocaleString('en-IN')}</span>
          </div>
          <div className="text-xs">
            <span className="text-muted-foreground">Spent: </span>
            <span className="font-medium">₹{project.spent.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <MainLayout title="Projects">
      <div className="space-y-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FolderKanban className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold">{totalProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-blue-500/10">
                  <Target className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">In Progress</p>
                  <p className="text-lg font-bold">{inProgressProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-green-500/10">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Completed</p>
                  <p className="text-lg font-bold">{completedProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-destructive/10">
                  <AlertTriangle className="h-4 w-4 text-destructive" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Overdue</p>
                  <p className="text-lg font-bold">{overdueProjects}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-purple-500/10">
                  <FolderKanban className="h-4 w-4 text-purple-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Budget</p>
                  <p className="text-lg font-bold">₹{(totalBudget / 1000).toFixed(0)}K</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-amber-500/10">
                  <FolderKanban className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Spent</p>
                  <p className="text-lg font-bold">₹{(totalSpent / 1000).toFixed(0)}K</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions Bar */}
        <div className="flex items-center justify-between gap-2">
          <Button variant="outline" size="sm" onClick={() => setIsFilterOpen(!isFilterOpen)} className="md:hidden">
            <Filter className="h-4 w-4 mr-1" />
            Filter
          </Button>
          <div className="hidden md:flex gap-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {priorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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

        {/* Mobile Filters */}
        <Collapsible open={isFilterOpen} className="md:hidden">
          <CollapsibleContent className="space-y-2 pb-2">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {statuses.map((status) => (
                  <SelectItem key={status} value={status}>{status}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={priorityFilter} onValueChange={setPriorityFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Priority</SelectItem>
                {priorities.map((priority) => (
                  <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CollapsibleContent>
        </Collapsible>

        {/* Desktop Table View */}
        <div className="hidden md:block">
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Project</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Priority</TableHead>
                    <TableHead>Progress</TableHead>
                    <TableHead>Milestones</TableHead>
                    <TableHead>Deadline</TableHead>
                    <TableHead>Budget</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                      <TableRow key={i}>
                        {Array.from({ length: 9 }).map((_, j) => (
                          <TableCell key={j}><Skeleton className="h-4 w-full" /></TableCell>
                        ))}
                      </TableRow>
                    ))
                  ) : filteredProjects && filteredProjects.length > 0 ? (
                    filteredProjects.map((project) => {
                      const StatusIcon = statusIcons[project.status];
                      const daysRemaining = getDaysRemaining(project.endDate);
                      const milestoneStats = getMilestoneStats(project.milestones);
                      return (
                        <TableRow key={project.id}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{project.name}</p>
                              <p className="text-xs text-muted-foreground truncate max-w-[200px]">{project.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>{project.customer}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={statusColors[project.status]}>
                              <StatusIcon className="h-3 w-3 mr-1" />
                              {project.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className={priorityColors[project.priority]}>
                              {project.priority}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Progress value={project.progress} className="h-2 w-16" />
                              <span className="text-xs">{project.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            {milestoneStats.total > 0 ? (
                              <div className="flex items-center gap-2">
                                <div className="flex items-center gap-1">
                                  <Flag className="h-3 w-3 text-muted-foreground" />
                                  <span className="text-xs font-medium">{milestoneStats.completed}/{milestoneStats.total}</span>
                                </div>
                                <Progress value={milestoneStats.percentage} className="h-2 w-12" />
                              </div>
                            ) : (
                              <span className="text-xs text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>{project.endDate}</p>
                              <p className={`text-xs ${daysRemaining < 0 ? 'text-destructive' : daysRemaining <= 7 ? 'text-amber-600' : 'text-muted-foreground'}`}>
                                {daysRemaining < 0 ? `${Math.abs(daysRemaining)}d overdue` : `${daysRemaining}d left`}
                              </p>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <p>₹{project.budget.toLocaleString('en-IN')}</p>
                              <p className="text-xs text-muted-foreground">Spent: ₹{project.spent.toLocaleString('en-IN')}</p>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(project)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => {
                                  setSelectedProject(project);
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
                      <TableCell colSpan={9} className="text-center py-8 text-muted-foreground">
                        No projects found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-48 w-full" />
            ))
          ) : filteredProjects && filteredProjects.length > 0 ? (
            filteredProjects.map((project) => (
              <ProjectCard key={project.id} project={project} />
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No projects found
            </div>
          )}
        </div>

        {/* Create/Edit Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedProject ? 'Edit Project' : 'Create Project'}</DialogTitle>
              <DialogDescription>
                {selectedProject ? 'Update project details' : 'Add a new project to track'}
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Project Name</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={2}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="customer">Customer</Label>
                <Input
                  id="customer"
                  value={formData.customer}
                  onChange={(e) => setFormData({ ...formData, customer: e.target.value })}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Status</Label>
                  <Select
                    value={formData.status}
                    onValueChange={(value: ProjectStatus) => setFormData({ ...formData, status: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuses.map((status) => (
                        <SelectItem key={status} value={status}>{status}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value: ProjectPriority) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((priority) => (
                        <SelectItem key={priority} value={priority}>{priority}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="budget">Budget (₹)</Label>
                  <Input
                    id="budget"
                    type="number"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: Number(e.target.value) })}
                    min={0}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="spent">Spent (₹)</Label>
                  <Input
                    id="spent"
                    type="number"
                    value={formData.spent}
                    onChange={(e) => setFormData({ ...formData, spent: Number(e.target.value) })}
                    min={0}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="progress">Progress (%)</Label>
                <Input
                  id="progress"
                  type="number"
                  value={formData.progress}
                  onChange={(e) => setFormData({ ...formData, progress: Math.min(100, Math.max(0, Number(e.target.value))) })}
                  min={0}
                  max={100}
                />
              </div>

              {/* Milestones Section */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Flag className="h-4 w-4" />
                    Milestones
                  </Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newMilestone: ProjectMilestone = {
                        id: `m-${Date.now()}`,
                        name: '',
                        dueDate: formData.endDate || new Date().toISOString().split('T')[0],
                        completed: false,
                      };
                      setFormData({
                        ...formData,
                        milestones: [...formData.milestones, newMilestone],
                      });
                    }}
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>
                </div>

                {formData.milestones.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border border-dashed rounded-lg">
                    No milestones yet. Add milestones to track project progress.
                  </p>
                ) : (
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {formData.milestones.map((milestone, index) => (
                      <div
                        key={milestone.id}
                        className={`flex items-start gap-2 p-3 rounded-lg border ${
                          milestone.completed ? 'bg-green-500/5 border-green-500/20' : 'bg-card'
                        }`}
                      >
                        <Checkbox
                          checked={milestone.completed}
                          onCheckedChange={(checked) => {
                            const updatedMilestones = [...formData.milestones];
                            updatedMilestones[index] = {
                              ...milestone,
                              completed: checked as boolean,
                            };
                            setFormData({ ...formData, milestones: updatedMilestones });
                          }}
                          className="mt-1"
                        />
                        <div className="flex-1 space-y-2">
                          <Input
                            placeholder="Milestone name"
                            value={milestone.name}
                            onChange={(e) => {
                              const updatedMilestones = [...formData.milestones];
                              updatedMilestones[index] = {
                                ...milestone,
                                name: e.target.value,
                              };
                              setFormData({ ...formData, milestones: updatedMilestones });
                            }}
                            className={`h-8 ${milestone.completed ? 'line-through text-muted-foreground' : ''}`}
                          />
                          <Input
                            type="date"
                            value={milestone.dueDate}
                            onChange={(e) => {
                              const updatedMilestones = [...formData.milestones];
                              updatedMilestones[index] = {
                                ...milestone,
                                dueDate: e.target.value,
                              };
                              setFormData({ ...formData, milestones: updatedMilestones });
                            }}
                            className="h-8"
                          />
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => {
                            setFormData({
                              ...formData,
                              milestones: formData.milestones.filter((_, i) => i !== index),
                            });
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}

                {formData.milestones.length > 0 && (
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Check className="h-3 w-3" />
                    <span>
                      {formData.milestones.filter((m) => m.completed).length} of{' '}
                      {formData.milestones.length} completed
                    </span>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>
                  Cancel
                </Button>
                <Button type="submit" disabled={isMutating}>
                  {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedProject ? 'Update' : 'Create'}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Project</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete "{selectedProject?.name}"? This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedProject && deleteMutation.mutate(selectedProject.id)}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </MainLayout>
  );
}
