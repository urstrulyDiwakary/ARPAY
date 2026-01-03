import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MainLayout } from '@/components/layout/MainLayout';
import { userApi } from '@/services/api';
import { User } from '@/types';
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
import { Switch } from '@/components/ui/switch';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Plus, Pencil, UserX, Loader2, Users, Shield, UserCheck, Search, Download, KeyRound, 
  Clock, Briefcase, UserCog, Activity, Crown, Upload, Eye, EyeOff, ShieldCheck,
  FileText, Receipt, CreditCard, ClipboardCheck, BarChart3, Timer, Bell
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';

const roleColors: Record<User['role'], string> = {
  Admin: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  Manager: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Employee: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const statusColors: Record<User['status'], string> = {
  Active: 'bg-green-500/10 text-green-600 border-green-500/20',
  Inactive: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  Disabled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const roles: User['role'][] = ['Admin', 'Manager', 'Employee'];

// Mock activity data
const recentActivity = [
  { id: 1, user: 'John Doe', action: 'Logged in from new device', time: '5 minutes ago', type: 'info' },
  { id: 2, user: 'Jane Smith', action: 'Updated profile information', time: '1 hour ago', type: 'success' },
  { id: 3, user: 'Bob Johnson', action: 'Password changed', time: '2 hours ago', type: 'warning' },
  { id: 4, user: 'Alice Brown', action: 'Role updated to Manager', time: '3 hours ago', type: 'info' },
];

// Role Permission Matrix
const permissionModules = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
  { id: 'invoices', name: 'Invoices', icon: FileText },
  { id: 'expenses', name: 'Expenses', icon: Receipt },
  { id: 'payments', name: 'Payments', icon: CreditCard },
  { id: 'approvals', name: 'Approvals', icon: ClipboardCheck },
  { id: 'reports', name: 'Reports', icon: BarChart3 },
  { id: 'time_tracking', name: 'Time Tracking', icon: Timer },
  { id: 'users', name: 'Users', icon: Users },
  { id: 'notifications', name: 'Notifications', icon: Bell },
];

const defaultPermissions: Record<string, string[]> = {
  Admin: ['dashboard', 'invoices', 'expenses', 'payments', 'approvals', 'reports', 'time_tracking', 'users', 'notifications'],
  Manager: ['dashboard', 'invoices', 'expenses', 'payments', 'approvals', 'reports', 'time_tracking', 'notifications'],
  Employee: ['dashboard', 'invoices', 'expenses', 'time_tracking', 'notifications'],
};

interface ExtendedFormData {
  employeeId: string;
  name: string;
  mobile: string;
  email: string;
  role: User['role'];
  assignedManager: string;
  username: string;
  password: string;
  status: User['status'];
  profilePhoto: string | null;
  permissions: string[];
}

export default function UsersPage() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDisableDialogOpen, setIsDisableDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<string>('all');
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState<ExtendedFormData>({
    employeeId: '',
    name: '',
    mobile: '',
    email: '',
    role: 'Employee',
    assignedManager: '',
    username: '',
    password: '',
    status: 'Active',
    profilePhoto: null,
    permissions: defaultPermissions['Employee'],
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: userApi.getAll,
  });

  // Filter users based on tab and filters
  const filteredUsers = users?.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
    
    let matchesTab = true;
    if (activeTab === 'managers') {
      matchesTab = user.role === 'Manager';
    } else if (activeTab === 'employees') {
      matchesTab = user.role === 'Employee';
    } else if (activeTab === 'disabled') {
      matchesTab = user.status === 'Disabled';
    } else if (activeTab === 'active-today') {
      matchesTab = user.status === 'Active' && user.lastActive !== undefined;
    }
    
    return matchesSearch && matchesRole && matchesStatus && matchesTab;
  });

  const createMutation = useMutation({
    mutationFn: userApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Success', description: 'User created successfully.' });
      closeDialog();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<User> }) =>
      userApi.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Success', description: 'User updated successfully.' });
      closeDialog();
    },
  });

  const disableMutation = useMutation({
    mutationFn: userApi.disable,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'User Disabled', description: 'User has been deactivated.' });
      setIsDisableDialogOpen(false);
      setSelectedUser(null);
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setSelectedUser(null);
    setShowPassword(false);
    setFormData({
      employeeId: '',
      name: '',
      mobile: '',
      email: '',
      role: 'Employee',
      assignedManager: '',
      username: '',
      password: '',
      status: 'Active',
      profilePhoto: null,
      permissions: defaultPermissions['Employee'],
    });
  };

  const openCreateDialog = () => {
    setSelectedUser(null);
    const newEmpId = `EMP${String((users?.length || 0) + 1).padStart(4, '0')}`;
    setFormData({
      employeeId: newEmpId,
      name: '',
      mobile: '',
      email: '',
      role: 'Employee',
      assignedManager: '',
      username: '',
      password: '',
      status: 'Active',
      profilePhoto: null,
      permissions: defaultPermissions['Employee'],
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    setFormData({
      employeeId: user.id,
      name: user.name,
      mobile: '',
      email: user.email,
      role: user.role,
      assignedManager: '',
      username: user.email.split('@')[0],
      password: '',
      status: user.status,
      profilePhoto: null,
      permissions: defaultPermissions[user.role],
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      updateMutation.mutate({ id: selectedUser.id, data: { name: formData.name, email: formData.email, role: formData.role, status: formData.status } });
    } else {
      createMutation.mutate({ name: formData.name, email: formData.email, role: formData.role, status: formData.status });
    }
  };

  const handleResetPassword = (user: User) => {
    toast({ title: 'Password Reset', description: `Password reset email sent to ${user.email}` });
  };

  const handleRoleChange = (role: User['role']) => {
    setFormData({ 
      ...formData, 
      role, 
      permissions: defaultPermissions[role] 
    });
  };

  const handlePermissionToggle = (moduleId: string) => {
    const newPermissions = formData.permissions.includes(moduleId)
      ? formData.permissions.filter(p => p !== moduleId)
      : [...formData.permissions, moduleId];
    setFormData({ ...formData, permissions: newPermissions });
  };

  const handlePhotoUpload = () => {
    toast({ title: 'Upload Photo', description: 'Photo upload feature coming soon!' });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const isMutating = createMutation.isPending || updateMutation.isPending;
  const adminCount = users?.filter(u => u.role === 'Admin').length || 0;
  const managerCount = users?.filter(u => u.role === 'Manager').length || 0;
  const employeeCount = users?.filter(u => u.role === 'Employee').length || 0;
  const disabledCount = users?.filter(u => u.status === 'Disabled').length || 0;
  const activeTodayCount = users?.filter(u => u.status === 'Active' && u.lastActive).length || 0;

  // Mobile Card Component
  const UserCard = ({ user }: { user: User }) => (
    <div className="rounded-lg border bg-card p-4 space-y-3">
      <div className="flex items-start gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary text-sm">
            {getInitials(user.name)}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{user.name}</p>
          <p className="text-xs text-muted-foreground truncate">{user.email}</p>
        </div>
      </div>
      <div className="flex gap-2 flex-wrap">
        <Badge variant="outline" className={roleColors[user.role]}>{user.role}</Badge>
        <Badge variant="outline" className={statusColors[user.status]}>{user.status}</Badge>
      </div>
      <div className="flex gap-2 pt-2 border-t">
        <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(user)}>
          <Pencil className="mr-1 h-3 w-3" />
          Edit
        </Button>
        <Button variant="outline" size="sm" onClick={() => handleResetPassword(user)}>
          <KeyRound className="h-3 w-3" />
        </Button>
        {user.status === 'Active' && (
          <Button 
            variant="outline" 
            size="sm"
            className="text-destructive"
            onClick={() => {
              setSelectedUser(user);
              setIsDisableDialogOpen(true);
            }}
          >
            <UserX className="h-3 w-3" />
          </Button>
        )}
      </div>
    </div>
  );

  return (
    <MainLayout title="Users">
      <div className="space-y-4">
        {/* Page Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="hidden sm:block">
            <p className="text-muted-foreground text-sm">Manage user accounts and permissions</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => toast({ title: 'Exporting', description: 'Preparing export...' })}>
              <Download className="mr-2 h-4 w-4" />
              <span className="hidden sm:inline">Export</span>
            </Button>
            <Button onClick={openCreateDialog} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add User
            </Button>
          </div>
        </div>

        {/* Administrator Cards */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 sm:gap-3">
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'all' ? 'ring-2 ring-primary border-primary' : ''}`}
            onClick={() => setActiveTab('all')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
              <div className={`p-2 rounded-full mb-1 ${activeTab === 'all' ? 'bg-primary/20' : 'bg-blue-500/10'}`}>
                <Users className={`h-5 w-5 sm:h-6 sm:w-6 ${activeTab === 'all' ? 'text-primary' : 'text-blue-500'}`} />
              </div>
              <p className="text-xs sm:text-sm font-medium">All Users</p>
              <p className={`text-lg sm:text-xl font-bold ${activeTab === 'all' ? 'text-primary' : ''}`}>{users?.length || 0}</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'admins' ? 'ring-2 ring-purple-500 border-purple-500' : ''}`}
            onClick={() => setActiveTab('admins')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
              <div className={`p-2 rounded-full mb-1 ${activeTab === 'admins' ? 'bg-purple-500/20' : 'bg-purple-500/10'}`}>
                <Crown className={`h-5 w-5 sm:h-6 sm:w-6 text-purple-500`} />
              </div>
              <p className="text-xs sm:text-sm font-medium">Administrators</p>
              <p className={`text-lg sm:text-xl font-bold text-purple-600`}>{adminCount}</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'managers' ? 'ring-2 ring-blue-500 border-blue-500' : ''}`}
            onClick={() => setActiveTab('managers')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
              <div className={`p-2 rounded-full mb-1 ${activeTab === 'managers' ? 'bg-blue-500/20' : 'bg-blue-500/10'}`}>
                <Briefcase className={`h-5 w-5 sm:h-6 sm:w-6 text-blue-500`} />
              </div>
              <p className="text-xs sm:text-sm font-medium">Managers</p>
              <p className={`text-lg sm:text-xl font-bold text-blue-600`}>{managerCount}</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'employees' ? 'ring-2 ring-orange-500 border-orange-500' : ''}`}
            onClick={() => setActiveTab('employees')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
              <div className={`p-2 rounded-full mb-1 ${activeTab === 'employees' ? 'bg-orange-500/20' : 'bg-orange-500/10'}`}>
                <UserCog className={`h-5 w-5 sm:h-6 sm:w-6 text-orange-500`} />
              </div>
              <p className="text-xs sm:text-sm font-medium">Employees</p>
              <p className={`text-lg sm:text-xl font-bold text-orange-600`}>{employeeCount}</p>
            </CardContent>
          </Card>
          <Card 
            className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'active-today' ? 'ring-2 ring-green-500 border-green-500' : ''}`}
            onClick={() => setActiveTab('active-today')}
          >
            <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
              <div className={`p-2 rounded-full mb-1 ${activeTab === 'active-today' ? 'bg-green-500/20' : 'bg-green-500/10'}`}>
                <Activity className={`h-5 w-5 sm:h-6 sm:w-6 text-green-500`} />
              </div>
              <p className="text-xs sm:text-sm font-medium">Active Today</p>
              <p className={`text-lg sm:text-xl font-bold text-green-600`}>{activeTodayCount}</p>
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
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={roleFilter} onValueChange={setRoleFilter}>
                <SelectTrigger className="w-full sm:w-[130px]">
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  {roles.map((role) => (
                    <SelectItem key={role} value={role}>{role}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[120px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        <div className="grid gap-4 lg:grid-cols-3">
          {/* Users List */}
          <div className="lg:col-span-2 space-y-4">
            {/* Mobile View - Cards */}
            <div className="md:hidden space-y-3">
              {isLoading ? (
                [...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
              ) : filteredUsers?.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">No users found</div>
              ) : (
                filteredUsers?.map((user) => <UserCard key={user.id} user={user} />)
              )}
            </div>

            {/* Desktop View - Table */}
            <Card className="hidden md:block">
              <CardHeader>
                <CardTitle>All Users</CardTitle>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="space-y-4">
                    {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                  </div>
                ) : filteredUsers?.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">No users found</div>
                ) : (
                  <table className="w-full">
                    <thead>
                      <tr className="border-b text-left">
                        <th className="pb-3 font-medium">User</th>
                        <th className="pb-3 font-medium">Email</th>
                        <th className="pb-3 font-medium">Role</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers?.map((user) => (
                        <tr key={user.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                          <td className="py-3">
                            <div className="flex items-center gap-3">
                              <Avatar className="h-9 w-9">
                                <AvatarFallback className="bg-primary/10 text-primary">
                                  {getInitials(user.name)}
                                </AvatarFallback>
                              </Avatar>
                              <span className="font-medium">{user.name}</span>
                            </div>
                          </td>
                          <td className="py-3">{user.email}</td>
                          <td className="py-3">
                            <Badge variant="outline" className={roleColors[user.role]}>
                              {user.role}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <Badge variant="outline" className={statusColors[user.status]}>
                              {user.status}
                            </Badge>
                          </td>
                          <td className="py-3 text-right">
                            <div className="flex justify-end gap-1">
                              <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                              <Button variant="ghost" size="icon" onClick={() => handleResetPassword(user)}>
                                <KeyRound className="h-4 w-4" />
                              </Button>
                              {user.status === 'Active' && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setIsDisableDialogOpen(true);
                                  }}
                                >
                                  <UserX className="h-4 w-4 text-destructive" />
                                </Button>
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

          {/* Activity Timeline */}
          <Card className="hidden lg:block">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="relative pl-6 space-y-4">
                <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary to-muted" />
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="relative">
                    <div className="absolute -left-4 top-1 h-3 w-3 rounded-full bg-primary border-2 border-background" />
                    <div className="space-y-1">
                      <p className="text-sm font-medium">{activity.user}</p>
                      <p className="text-xs text-muted-foreground">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Create/Edit Dialog - Enhanced Form */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
            <DialogDescription>
              {selectedUser ? 'Update user information and permissions.' : 'Create a new user account with role permissions.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Profile Photo */}
            <div className="flex justify-center">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  {formData.profilePhoto ? (
                    <AvatarImage src={formData.profilePhoto} />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl">
                      {formData.name ? getInitials(formData.name) : <Upload className="h-8 w-8" />}
                    </AvatarFallback>
                  )}
                </Avatar>
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                  onClick={handlePhotoUpload}
                >
                  <Upload className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Basic Information */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="employeeId">Employee ID *</Label>
                <Input
                  id="employeeId"
                  value={formData.employeeId}
                  onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                  placeholder="EMP0001"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="John Doe"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="mobile">Mobile Number *</Label>
                <Input
                  id="mobile"
                  type="tel"
                  value={formData.mobile}
                  onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                  placeholder="+91 98765 43210"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="john@example.com"
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="role">User Role *</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value: User['role']) => handleRoleChange(value)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {roles.map((role) => (
                      <SelectItem key={role} value={role}>{role}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignedManager">Assigned Manager</Label>
                <Select
                  value={formData.assignedManager}
                  onValueChange={(value) => setFormData({ ...formData, assignedManager: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select manager" />
                  </SelectTrigger>
                  <SelectContent>
                    {users?.filter(u => u.role === 'Manager' || u.role === 'Admin').map((manager) => (
                      <SelectItem key={manager.id} value={manager.id}>{manager.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Login Credentials */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <KeyRound className="h-4 w-4" />
                Login Credentials
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Login Username *</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    placeholder="johndoe"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">Password *</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      placeholder="••••••••"
                      required={!selectedUser}
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => setShowPassword(!showPassword)}
                    >
                      {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Account Status */}
            <div className="space-y-2">
              <Label htmlFor="status">Account Status *</Label>
              <Select
                value={formData.status}
                onValueChange={(value: User['status']) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Inactive">Inactive</SelectItem>
                  <SelectItem value="Disabled">Disabled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Role Permission Matrix */}
            <div className="space-y-4">
              <h4 className="font-medium flex items-center gap-2">
                <ShieldCheck className="h-4 w-4" />
                Role Permission Matrix
              </h4>
              <Card>
                <CardContent className="p-4">
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {permissionModules.map((module) => {
                      const Icon = module.icon;
                      const isChecked = formData.permissions.includes(module.id);
                      return (
                        <div
                          key={module.id}
                          className={`flex items-center gap-2 p-3 rounded-lg border cursor-pointer transition-all ${
                            isChecked ? 'bg-primary/10 border-primary' : 'hover:bg-muted/50'
                          }`}
                          onClick={() => handlePermissionToggle(module.id)}
                        >
                          <Checkbox
                            checked={isChecked}
                            onCheckedChange={() => handlePermissionToggle(module.id)}
                          />
                          <Icon className={`h-4 w-4 ${isChecked ? 'text-primary' : 'text-muted-foreground'}`} />
                          <span className="text-sm">{module.name}</span>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button type="button" variant="outline" onClick={closeDialog} className="w-full sm:w-auto">
                Cancel
              </Button>
              <Button type="submit" disabled={isMutating} className="w-full sm:w-auto">
                {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {selectedUser ? 'Update User' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Disable User Confirmation */}
      <AlertDialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
        <AlertDialogContent className="max-w-[90vw] sm:max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle>Disable User</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to disable {selectedUser?.name}'s account? They will no longer be able to access the system.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex-col sm:flex-row gap-2">
            <AlertDialogCancel className="w-full sm:w-auto">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedUser && disableMutation.mutate(selectedUser.id)}
              className="w-full sm:w-auto bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {disableMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Disable
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </MainLayout>
  );
}
