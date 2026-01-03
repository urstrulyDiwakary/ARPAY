import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { notificationApi } from '@/services/api';
import { Notification } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
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
import { 
  Bell, Check, Trash2, Loader2, AlertCircle, Info, CheckCircle, AlertTriangle, 
  Search, Eye, Clock, Plus, Calendar, Phone, FileWarning, CreditCard, FileText,
  RefreshCw, Building2, User, CalendarClock
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const priorityColors: Record<Notification['priority'], string> = {
  High: 'bg-destructive/10 text-destructive border-destructive/20',
  Medium: 'bg-amber-500/10 text-amber-600 border-amber-500/20',
  Low: 'bg-green-500/10 text-green-600 border-green-500/20',
};

const typeIcons: Record<Notification['type'], React.ComponentType<{ className?: string }>> = {
  info: Info,
  warning: AlertTriangle,
  success: CheckCircle,
  error: AlertCircle,
};

const typeColors: Record<Notification['type'], string> = {
  info: 'text-blue-500 bg-blue-500/10',
  warning: 'text-amber-500 bg-amber-500/10',
  success: 'text-green-500 bg-green-500/10',
  error: 'text-destructive bg-destructive/10',
};

// Task card definitions
const taskCards = [
  { id: 'overdue', title: 'Overdue Tasks', icon: AlertCircle, color: 'text-red-500', bgColor: 'bg-red-500/10', count: 5 },
  { id: 'deadlines', title: 'Upcoming Deadlines', icon: Calendar, color: 'text-orange-500', bgColor: 'bg-orange-500/10', count: 8 },
  { id: 'calls', title: 'Scheduled Calls', icon: Phone, color: 'text-blue-500', bgColor: 'bg-blue-500/10', count: 3 },
  { id: 'approvals', title: 'Pending Approvals', icon: FileWarning, color: 'text-amber-500', bgColor: 'bg-amber-500/10', count: 12 },
  { id: 'legal', title: 'Legal Expiry Dates', icon: FileText, color: 'text-purple-500', bgColor: 'bg-purple-500/10', count: 2 },
  { id: 'payments', title: 'Payment Reminders', icon: CreditCard, color: 'text-green-500', bgColor: 'bg-green-500/10', count: 7 },
  { id: 'contracts', title: 'Contract Renewals', icon: RefreshCw, color: 'text-cyan-500', bgColor: 'bg-cyan-500/10', count: 4 },
];

const notificationTypes = [
  'Task Reminder',
  'Payment Due',
  'Approval Request',
  'Contract Expiry',
  'Meeting Scheduled',
  'Document Upload',
  'System Alert',
];

const triggerEvents = [
  'On Date',
  'Before Due Date',
  'After Creation',
  'On Status Change',
  'Daily',
  'Weekly',
  'Monthly',
];

const priorityLevels = ['High', 'Medium', 'Low'];

interface NotificationFormData {
  title: string;
  type: string;
  triggerEvent: string;
  property: string;
  assignedPerson: string;
  reminderDate: string;
  reminderTime: string;
  priority: string;
  isRecurring: boolean;
  recurringInterval: string;
  message: string;
}

export default function NotificationsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<string>('all');
  const [readFilter, setReadFilter] = useState<string>('all');
  const [activeTaskCard, setActiveTaskCard] = useState<string | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    type: '',
    triggerEvent: '',
    property: '',
    assignedPerson: '',
    reminderDate: '',
    reminderTime: '',
    priority: 'Medium',
    isRecurring: false,
    recurringInterval: '',
    message: '',
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: notifications, isLoading } = useQuery({
    queryKey: ['notifications'],
    queryFn: notificationApi.getAll,
  });

  // Filter notifications
  const filteredNotifications = notifications?.filter((notification) => {
    const matchesSearch = notification.message.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesPriority = priorityFilter === 'all' || notification.priority === priorityFilter;
    const matchesRead = readFilter === 'all' || 
                        (readFilter === 'unread' && !notification.read) ||
                        (readFilter === 'read' && notification.read);
    return matchesSearch && matchesPriority && matchesRead;
  });

  const markAsReadMutation = useMutation({
    mutationFn: notificationApi.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markAllAsReadMutation = useMutation({
    mutationFn: notificationApi.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: 'Done', description: 'All notifications marked as read.' });
    },
  });

  const clearAllMutation = useMutation({
    mutationFn: notificationApi.clear,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      toast({ title: 'Cleared', description: 'All notifications have been cleared.' });
    },
  });

  const unreadCount = notifications?.filter(n => !n.read).length || 0;
  const highPriorityCount = notifications?.filter(n => n.priority === 'High' && !n.read).length || 0;

  const handleCreateNotification = (e: React.FormEvent) => {
    e.preventDefault();
    toast({ 
      title: 'Notification Created', 
      description: `"${formData.title}" has been scheduled successfully.` 
    });
    setIsCreateDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      title: '',
      type: '',
      triggerEvent: '',
      property: '',
      assignedPerson: '',
      reminderDate: '',
      reminderTime: '',
      priority: 'Medium',
      isRecurring: false,
      recurringInterval: '',
      message: '',
    });
  };

  return (
    <MainLayout title="Notifications">
      <div className="space-y-4">
        {/* Task Cards */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-7 sm:gap-3">
          {taskCards.map((card) => {
            const Icon = card.icon;
            const isActive = activeTaskCard === card.id;
            return (
              <Card 
                key={card.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  isActive ? 'ring-2 ring-primary border-primary' : ''
                }`}
                onClick={() => setActiveTaskCard(isActive ? null : card.id)}
              >
                <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
                  <div className={`p-2 rounded-full mb-1 ${card.bgColor}`}>
                    <Icon className={`h-4 w-4 sm:h-5 sm:w-5 ${card.color}`} />
                  </div>
                  <p className="text-[10px] sm:text-xs font-medium leading-tight">{card.title}</p>
                  <p className={`text-lg sm:text-xl font-bold ${card.color}`}>{card.count}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 md:gap-4">
          <Card>
            <CardHeader className="pb-2 px-3 pt-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Bell className="h-3 w-3 sm:h-4 sm:w-4 text-primary" />
                Total
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">{notifications?.length || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 px-3 pt-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-amber-600" />
                Unread
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-amber-600">{unreadCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 px-3 pt-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4 text-destructive" />
                Critical
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold text-destructive">{highPriorityCount}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2 px-3 pt-3 sm:p-6 sm:pb-2">
              <CardTitle className="text-xs sm:text-sm font-medium flex items-center gap-1 sm:gap-2">
                <Clock className="h-3 w-3 sm:h-4 sm:w-4 text-muted-foreground" />
                Today
              </CardTitle>
            </CardHeader>
            <CardContent className="px-3 pb-3 sm:p-6 sm:pt-0">
              <div className="text-xl sm:text-2xl font-bold">
                {notifications?.filter(n => n.date === new Date().toISOString().split('T')[0]).length || 0}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-2 items-center justify-between">
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0 ? `${unreadCount} unread notification(s)` : 'No new notifications'}
          </p>
          <div className="flex gap-2">
            <Button size="sm" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Create Notification</span>
              <span className="sm:hidden">New</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={unreadCount === 0 || markAllAsReadMutation.isPending}
            >
              {markAllAsReadMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Check className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Mark All Read</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => clearAllMutation.mutate()}
              disabled={!notifications?.length || clearAllMutation.isPending}
            >
              {clearAllMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              <Trash2 className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Clear All</span>
            </Button>
          </div>
        </div>

        {/* Search and Filters */}
        <Card>
          <CardContent className="p-3 md:p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="High">High</SelectItem>
                  <SelectItem value="Medium">Medium</SelectItem>
                  <SelectItem value="Low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={readFilter} onValueChange={setReadFilter}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  <SelectItem value="unread">Unread</SelectItem>
                  <SelectItem value="read">Read</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Notifications List */}
        <Card>
          <CardHeader className="p-3 md:p-6 pb-0 md:pb-0">
            <CardTitle className="flex items-center gap-2 text-sm md:text-base">
              <Bell className="h-4 w-4 md:h-5 md:w-5" />
              Notifications
              {unreadCount > 0 && (
                <Badge variant="destructive" className="ml-auto">
                  {unreadCount} new
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-3 md:p-6">
            {isLoading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-24 w-full" />
                ))}
              </div>
            ) : filteredNotifications?.length === 0 ? (
              <div className="py-12 text-center">
                <Bell className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-medium">No notifications</h3>
                <p className="text-muted-foreground">You're all caught up!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {filteredNotifications?.map((notification) => {
                  const Icon = typeIcons[notification.type];
                  return (
                    <div
                      key={notification.id}
                      className={cn(
                        'flex items-start gap-3 sm:gap-4 rounded-lg border p-3 sm:p-4 transition-all',
                        !notification.read && 'bg-primary/5 border-primary/20 border-l-4 border-l-primary'
                      )}
                    >
                      <div className={cn('mt-0.5 rounded-lg p-2', typeColors[notification.type])}>
                        <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-start justify-between gap-2">
                          <p className={cn('text-sm', !notification.read && 'font-medium')}>
                            {notification.message}
                          </p>
                          <Badge variant="outline" className={cn('shrink-0', priorityColors[notification.priority])}>
                            {notification.priority}
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground">{notification.date}</p>
                        <div className="flex gap-2 mt-2">
                          {!notification.read && (
                            <Button
                              variant="outline"
                              size="sm"
                              className="h-7 text-xs"
                              onClick={() => markAsReadMutation.mutate(notification.id)}
                              disabled={markAsReadMutation.isPending}
                            >
                              <Check className="mr-1 h-3 w-3" />
                              Mark Read
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" className="h-7 text-xs">
                            View Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Notification Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Create New Notification
            </DialogTitle>
            <DialogDescription>
              Set up a new notification with custom triggers and reminders.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreateNotification} className="space-y-6">
            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2 sm:col-span-2">
                <Label htmlFor="title">Notification Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter notification title"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notificationType">Notification Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => setFormData({ ...formData, type: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {notificationTypes.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="triggerEvent">Trigger Event *</Label>
                <Select
                  value={formData.triggerEvent}
                  onValueChange={(value) => setFormData({ ...formData, triggerEvent: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trigger" />
                  </SelectTrigger>
                  <SelectContent>
                    {triggerEvents.map((event) => (
                      <SelectItem key={event} value={event}>{event}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Property and Assignment */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="property" className="flex items-center gap-2">
                  <Building2 className="h-4 w-4" />
                  Property
                </Label>
                <Select
                  value={formData.property}
                  onValueChange={(value) => setFormData({ ...formData, property: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select property" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="property1">Green Valley Apartments</SelectItem>
                    <SelectItem value="property2">Sunrise Tower</SelectItem>
                    <SelectItem value="property3">City Center Mall</SelectItem>
                    <SelectItem value="property4">Tech Park Office</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedPerson" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Assigned Person
                </Label>
                <Select
                  value={formData.assignedPerson}
                  onValueChange={(value) => setFormData({ ...formData, assignedPerson: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select person" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user1">John Doe</SelectItem>
                    <SelectItem value="user2">Jane Smith</SelectItem>
                    <SelectItem value="user3">Bob Johnson</SelectItem>
                    <SelectItem value="user4">Alice Brown</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Date and Time */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="reminderDate" className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  Reminder Date *
                </Label>
                <Input
                  id="reminderDate"
                  type="date"
                  value={formData.reminderDate}
                  onChange={(e) => setFormData({ ...formData, reminderDate: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="reminderTime" className="flex items-center gap-2">
                  <CalendarClock className="h-4 w-4" />
                  Reminder Time *
                </Label>
                <Input
                  id="reminderTime"
                  type="time"
                  value={formData.reminderTime}
                  onChange={(e) => setFormData({ ...formData, reminderTime: e.target.value })}
                  required
                />
              </div>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label>Priority Level *</Label>
              <div className="flex gap-2">
                {priorityLevels.map((level) => (
                  <Button
                    key={level}
                    type="button"
                    variant={formData.priority === level ? 'default' : 'outline'}
                    size="sm"
                    className={cn(
                      formData.priority === level && level === 'High' && 'bg-destructive hover:bg-destructive/90',
                      formData.priority === level && level === 'Medium' && 'bg-amber-500 hover:bg-amber-500/90',
                      formData.priority === level && level === 'Low' && 'bg-green-500 hover:bg-green-500/90'
                    )}
                    onClick={() => setFormData({ ...formData, priority: level })}
                  >
                    {level}
                  </Button>
                ))}
              </div>
            </div>

            {/* Recurring Notification */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <Label className="flex items-center gap-2">
                      <RefreshCw className="h-4 w-4" />
                      Recurring Notification
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Enable to repeat this notification at regular intervals
                    </p>
                  </div>
                  <Switch
                    checked={formData.isRecurring}
                    onCheckedChange={(checked) => setFormData({ ...formData, isRecurring: checked })}
                  />
                </div>
                {formData.isRecurring && (
                  <div className="mt-4">
                    <Label htmlFor="recurringInterval">Repeat Every</Label>
                    <Select
                      value={formData.recurringInterval}
                      onValueChange={(value) => setFormData({ ...formData, recurringInterval: value })}
                    >
                      <SelectTrigger className="mt-2">
                        <SelectValue placeholder="Select interval" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                        <SelectItem value="quarterly">Quarterly</SelectItem>
                        <SelectItem value="yearly">Yearly</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Enter additional message or notes..."
                rows={3}
              />
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                <Plus className="mr-2 h-4 w-4" />
                Create Notification
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </MainLayout>
  );
}
