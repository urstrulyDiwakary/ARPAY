import { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { timeEntryApi, userApi } from '@/services/api';
import { TimeEntry } from '@/types';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Loader2, Clock, Calendar, User, Search, Download, Play, Pause, BarChart3 } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { Progress } from '@/components/ui/progress';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';

const projects = ['Website Redesign', 'Mobile App', 'Customer Portal', 'Marketing Campaign', 'Internal Tools'];

export default function TimeTrackingPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [formData, setFormData] = useState({
    project: '',
    userId: '',
    userName: '',
    startTime: '09:00',
    endTime: '17:00',
    date: new Date().toISOString().split('T')[0],
    description: '',
    billable: true,
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: timeEntries, isLoading } = useQuery({
    queryKey: ['time-entries'],
    queryFn: timeEntryApi.getAll,
  });

  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.getAll,
  });

  // Filter entries
  const filteredEntries = timeEntries?.filter((entry) => {
    const matchesSearch = entry.project.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.userName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          entry.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProject = projectFilter === 'all' || entry.project === projectFilter;
    return matchesSearch && matchesProject;
  });

  const createMutation = useMutation({
    mutationFn: timeEntryApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['time-entries'] });
      toast({ title: 'Success', description: 'Time entry logged successfully.' });
      closeDialog();
    },
  });

  const calculateHours = (start: string, end: string): number => {
    const [startH, startM] = start.split(':').map(Number);
    const [endH, endM] = end.split(':').map(Number);
    return Math.max(0, (endH + endM / 60) - (startH + startM / 60));
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setFormData({
      project: '',
      userId: '',
      userName: '',
      startTime: '09:00',
      endTime: '17:00',
      date: new Date().toISOString().split('T')[0],
      description: '',
      billable: true,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hours = calculateHours(formData.startTime, formData.endTime);
    createMutation.mutate({
      ...formData,
      hours,
    });
  };

  const handleUserChange = (userId: string) => {
    const user = users?.find(u => u.id === userId);
    setFormData({
      ...formData,
      userId,
      userName: user?.name || '',
    });
  };

  const toggleTimer = () => {
    setIsTimerRunning(!isTimerRunning);
    toast({ 
      title: isTimerRunning ? 'Timer Stopped' : 'Timer Started',
      description: isTimerRunning ? 'Your time has been recorded.' : 'Time tracking in progress...'
    });
  };

  // Calculate daily totals
  const dailyTotals = useMemo(() => {
    if (!timeEntries) return {};
    return timeEntries.reduce((acc, entry) => {
      acc[entry.date] = (acc[entry.date] || 0) + entry.hours;
      return acc;
    }, {} as Record<string, number>);
  }, [timeEntries]);

  // Project hours for chart
  const projectHours = useMemo(() => {
    if (!timeEntries) return [];
    const totals: Record<string, number> = {};
    timeEntries.forEach(entry => {
      totals[entry.project] = (totals[entry.project] || 0) + entry.hours;
    });
    return Object.entries(totals).map(([name, hours]) => ({ name, hours }));
  }, [timeEntries]);

  // Weekly total
  const weeklyTotal = useMemo(() => {
    return Object.values(dailyTotals).reduce((sum, hours) => sum + hours, 0);
  }, [dailyTotals]);

  const todayTotal = dailyTotals[new Date().toISOString().split('T')[0]] || 0;
  const billableHours = timeEntries?.filter(e => true).reduce((sum, e) => sum + e.hours, 0) || 0; // Mock billable

  // Mobile Card Component
  const TimeEntryCard = ({ entry }: { entry: TimeEntry }) => (
    <div className="rounded-lg border bg-card p-4 space-y-3 overflow-hidden">
      <div className="flex items-start justify-between gap-2">
        <div className="space-y-1 min-w-0 flex-1">
          <p className="font-semibold text-sm truncate">{entry.project}</p>
          <p className="text-xs text-muted-foreground truncate">{entry.userName}</p>
        </div>
        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 shrink-0">
          {entry.hours}h
        </Badge>
      </div>
      <div className="flex items-center justify-between pt-2 border-t gap-2">
        <div className="min-w-0">
          <p className="text-sm truncate">{entry.startTime} - {entry.endTime}</p>
          <p className="text-xs text-muted-foreground truncate">{entry.date}</p>
        </div>
        <p className="text-xs text-muted-foreground max-w-[40%] truncate shrink-0">{entry.description}</p>
      </div>
    </div>
  );

  return (
    <MainLayout title="Time Tracking">
      <div className="space-y-4">
        {/* Page Header with Timer */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="hidden sm:block">
            <p className="text-muted-foreground text-sm">Track and manage working hours</p>
          </div>
          <div className="flex gap-2">
            <Button 
              variant={isTimerRunning ? "destructive" : "outline"} 
              size="sm"
              onClick={toggleTimer}
            >
              {isTimerRunning ? <Pause className="mr-2 h-4 w-4" /> : <Play className="mr-2 h-4 w-4" />}
              {isTimerRunning ? 'Stop' : 'Start'} Timer
            </Button>
            <Button onClick={() => setIsDialogOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Log Time
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 px-3 pt-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 truncate">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
                <span className="truncate">Today</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold truncate">{todayTotal.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground truncate">Hours logged</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 px-3 pt-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 truncate">
                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
                <span className="truncate">This Week</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold truncate">{weeklyTotal.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground truncate">Total hours</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 px-3 pt-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 truncate">
                <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 text-green-600 shrink-0" />
                <span className="truncate">Billable</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-green-600 truncate">{billableHours.toFixed(1)}h</div>
              <p className="text-xs text-muted-foreground truncate">Billable hours</p>
            </CardContent>
          </Card>
          <Card className="overflow-hidden">
            <CardHeader className="pb-2 px-3 pt-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2 truncate">
                <User className="h-3 w-3 sm:h-4 sm:w-4 text-primary shrink-0" />
                <span className="truncate">Entries</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold truncate">{timeEntries?.length || 0}</div>
              <p className="text-xs text-muted-foreground truncate">Total entries</p>
            </CardContent>
          </Card>
        </div>

        {/* Chart Section - Now visible on mobile too */}
        <Card>
          <CardHeader className="p-3 sm:p-6 pb-2 sm:pb-2">
            <CardTitle className="flex items-center gap-2 text-sm sm:text-base">
              <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              Hours by Project
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 pt-0 sm:p-6 sm:pt-0">
            <div className="h-[180px] sm:h-[220px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={projectHours} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-muted/50" />
                  <XAxis 
                    dataKey="name" 
                    tick={{ fontSize: 9, fill: 'hsl(var(--muted-foreground))' }} 
                    tickLine={false} 
                    axisLine={false}
                    interval={0}
                    angle={-15}
                    textAnchor="end"
                    height={50}
                  />
                  <YAxis 
                    tick={{ fontSize: 10, fill: 'hsl(var(--muted-foreground))' }} 
                    tickLine={false} 
                    axisLine={false}
                    tickFormatter={(v) => `${v}h`}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(var(--card))',
                      borderColor: 'hsl(var(--border))',
                      borderRadius: 'var(--radius)',
                      fontSize: '12px',
                    }}
                    formatter={(value: number) => [`${value}h`, 'Hours']}
                  />
                  <Bar dataKey="hours" radius={[6, 6, 0, 0]}>
                    {projectHours.map((_, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={[
                          'hsl(234, 89%, 73%)',
                          'hsl(160, 84%, 39%)',
                          'hsl(38, 92%, 50%)',
                          'hsl(280, 87%, 65%)',
                          'hsl(199, 89%, 48%)',
                        ][index % 5]} 
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search entries..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={projectFilter} onValueChange={setProjectFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>{project}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Mobile View - Cards */}
        <div className="md:hidden space-y-3">
          {isLoading ? (
            [...Array(4)].map((_, i) => <Skeleton key={i} className="h-28 w-full" />)
          ) : filteredEntries?.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No entries found</div>
          ) : (
            filteredEntries?.map((entry) => <TimeEntryCard key={entry.id} entry={entry} />)
          )}
        </div>

        {/* Desktop View - Table */}
        <Card className="hidden md:block">
          <CardHeader>
            <CardTitle>Time Log</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
              </div>
            ) : filteredEntries?.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">No entries found</div>
            ) : (
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Date</th>
                    <th className="pb-3 font-medium">Project</th>
                    <th className="pb-3 font-medium">User</th>
                    <th className="pb-3 font-medium">Time</th>
                    <th className="pb-3 font-medium">Hours</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEntries?.map((entry) => (
                    <tr key={entry.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                      <td className="py-3 font-medium">{entry.date}</td>
                      <td className="py-3">{entry.project}</td>
                      <td className="py-3">{entry.userName}</td>
                      <td className="py-3">{entry.startTime} - {entry.endTime}</td>
                      <td className="py-3 font-semibold">{entry.hours}h</td>
                      <td className="py-3">
                        <Badge variant="outline" className="bg-green-500/10 text-green-600 border-green-500/20">
                          Billable
                        </Badge>
                      </td>
                      <td className="py-3 max-w-[200px] truncate">{entry.description}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </CardContent>
        </Card>

        {/* Project Progress Cards */}
        <Card>
          <CardHeader>
            <CardTitle className="text-sm md:text-base">Project Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {projects.slice(0, 3).map((project, i) => {
              const projectTotal = timeEntries?.filter(e => e.project === project).reduce((sum, e) => sum + e.hours, 0) || 0;
              const targetHours = [160, 200, 120][i];
              const progress = Math.min(100, (projectTotal / targetHours) * 100);
              return (
                <div key={project} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{project}</span>
                    <span className="text-muted-foreground">{projectTotal.toFixed(1)}h / {targetHours}h</span>
                  </div>
                  <Progress value={progress} className="h-2" />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>

      {/* Log Time Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Log Time Entry</DialogTitle>
            <DialogDescription>Record your working hours for a project.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={formData.project}
                onValueChange={(value) => setFormData({ ...formData, project: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project} value={project}>{project}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="user">User</Label>
              <Select value={formData.userId} onValueChange={handleUserChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select user" />
                </SelectTrigger>
                <SelectContent>
                  {users?.map((user) => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="time"
                  value={formData.startTime}
                  onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="time"
                  value={formData.endTime}
                  onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                  required
                />
              </div>
            </div>
            <div className="rounded-lg bg-muted p-3 text-center">
              <span className="text-sm text-muted-foreground">Total Hours: </span>
              <span className="font-semibold">{calculateHours(formData.startTime, formData.endTime).toFixed(1)}h</span>
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
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={3}
                placeholder="What did you work on?"
              />
            </div>
            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={closeDialog} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={createMutation.isPending} className="w-full sm:w-auto">
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Log Time
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
