import { useState, useEffect, useCallback } from 'react';
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
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  Plus, Pencil, UserX, Loader2, Users, Search, Download, KeyRound,
  Briefcase, UserCog, Activity, Crown, Upload, Eye, EyeOff, ShieldCheck,
  FileText, Receipt, CreditCard, ClipboardCheck, BarChart3, Timer, Bell
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { exportToCSV } from '@/utils/export';

// Helper function to normalize roles to uppercase format
const normalizeRole = (role: string): User['role'] => {
  if (!role) return 'EMPLOYEE';
  return role.toUpperCase() as User['role'];
};

// Helper function to normalize status to uppercase format
const normalizeStatus = (status: string): User['status'] => {
  if (!status) return 'ACTIVE';
  return status.toUpperCase() as User['status'];
};

// Helper to format role/status for display (UPPERCASE -> Capitalized)
const formatForDisplay = (value: string): string => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  MANAGER: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  EMPLOYEE: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  Admin: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  Manager: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Employee: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  admin: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  manager: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  employee: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-600 border-green-500/20',
  INACTIVE: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  DISABLED: 'bg-destructive/10 text-destructive border-destructive/20',
  Active: 'bg-green-500/10 text-green-600 border-green-500/20',
  Inactive: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  Disabled: 'bg-destructive/10 text-destructive border-destructive/20',
  active: 'bg-green-500/10 text-green-600 border-green-500/20',
  inactive: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  disabled: 'bg-destructive/10 text-destructive border-destructive/20',
};

const roles: User['role'][] = ['ADMIN', 'MANAGER', 'EMPLOYEE'];

// Role Permission Matrix
const permissionModules = [
  { id: 'dashboard', name: 'Dashboard', icon: BarChart3 },
  { id: 'invoices', name: 'Invoices', icon: FileText },
  { id: 'expenses', name: 'Expenses', icon: Receipt },
  { id: 'payments', name: 'Payments', icon: CreditCard },
  { id: 'approvals', name: 'Approvals', icon: ClipboardCheck },
  { id: 'reports', name: 'Reports', icon: BarChart3 },
  { id: 'users', name: 'Users', icon: Users },
  { id: 'notifications', name: 'Notifications', icon: Bell },
];

// Helper function to safely get default permissions
const getDefaultPermissions = (role: string): string[] => {
  const normalizedRole = normalizeRole(role);
  if (normalizedRole === 'ADMIN') {
    return permissionModules.map(p => p.id);
  } else if (normalizedRole === 'MANAGER') {
    return permissionModules.map(p => p.id);
  } else {
    return ['dashboard', 'invoices', 'expenses', 'payments', 'approvals', 'notifications'];
  }
};

interface ExtendedFormData {
  employeeId: string;
  name: string;
  mobile: string;
  email: string;
  role: User['role'];
  assignedManager: string;
  password: string;
  status: User['status'];
  profilePhoto: string | null;
  permissions: string[];
  department?: string;
  dateOfJoining: string;
  salary?: number | '' | null;
}

interface UserCreateData extends Omit<User, 'id'> {
  password: string;
  phone?: string;
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
    role: 'EMPLOYEE',
    assignedManager: '',
    password: '',
    status: 'ACTIVE',
    profilePhoto: null,
    permissions: ['dashboard', 'invoices', 'expenses', 'payments', 'approvals', 'notifications'],
    department: '',
    dateOfJoining: '',
    salary: '',
  });

  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: users, isLoading, error } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => userApi.getAll(),
    retry: 1,
    retryDelay: 1000,
  });

  const inactiveDisabledCount = (users?.filter(u => {
    const status = normalizeStatus(u.status);
    return status === 'INACTIVE' || status === 'DISABLED';
  }) ?? []).length;

  const filteredUsers = users?.filter((user) => {
    const matchesSearch = user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || normalizeRole(user.role) === roleFilter;
    const matchesStatus = statusFilter === 'all' || normalizeStatus(user.status) === statusFilter;

    let matchesTab = true;
    if (activeTab === 'admins') {
      matchesTab = normalizeRole(user.role) === 'ADMIN';
    } else if (activeTab === 'managers') {
      matchesTab = normalizeRole(user.role) === 'MANAGER';
    } else if (activeTab === 'employees') {
      matchesTab = normalizeRole(user.role) === 'EMPLOYEE';
    } else if (activeTab === 'disabled') {
      matchesTab = normalizeStatus(user.status) === 'DISABLED';
    } else if (activeTab === 'inactive-disabled') {
      const status = normalizeStatus(user.status);
      matchesTab = status === 'INACTIVE' || status === 'DISABLED';
    } else if (activeTab === 'active-today') {
      matchesTab = normalizeStatus(user.status) === 'ACTIVE' && user.lastActive !== undefined;
    } else if (activeTab === 'all') {
      const status = normalizeStatus(user.status);
      matchesTab = status === 'ACTIVE';
    }

    return matchesSearch && matchesRole && matchesStatus && matchesTab;
  });

  const createMutation = useMutation({
    mutationFn: (data: UserCreateData) => userApi.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast({ title: 'Success', description: 'User created successfully.' });
      closeDialog();
    },
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to create user',
        variant: 'destructive'
      });
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
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to update user',
        variant: 'destructive'
      });
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
    onError: (error: Error) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to disable user',
        variant: 'destructive'
      });
    },
  });

  const closeDialog = () => {
    setIsDialogOpen(false);
    setTimeout(() => {
      setSelectedUser(null);
      setShowPassword(false);
      setFormData({
        employeeId: '',
        name: '',
        mobile: '',
        email: '',
        role: 'EMPLOYEE',
        assignedManager: '',
        password: '',
        status: 'ACTIVE',
        profilePhoto: null,
        permissions: ['dashboard', 'invoices', 'expenses', 'payments', 'approvals', 'notifications'],
        department: '',
        dateOfJoining: '',
        salary: '',
      });
    }, 100);
  };

  const openCreateDialog = () => {
    setSelectedUser(null);
    const newEmpId = `EMP${String((users?.length || 0) + 1).padStart(4, '0')}`;
    setFormData({
      employeeId: newEmpId,
      name: '',
      mobile: '',
      email: '',
      role: 'EMPLOYEE',
      assignedManager: '',
      password: '',
      status: 'ACTIVE',
      profilePhoto: null,
      permissions: getDefaultPermissions('EMPLOYEE'),
      department: '',
      dateOfJoining: '',
      salary: '',
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setSelectedUser(user);
    const normalizedRole = normalizeRole(user.role);
    const normalizedStatus = normalizeStatus(user.status);
    setFormData({
      employeeId: user.employeeId ?? user.id,
      name: user.name,
      mobile: user.phone || '',
      email: user.email,
      role: normalizedRole,
      assignedManager: '',
      password: '',
      status: normalizedStatus,
      profilePhoto: user.avatar || null,
      permissions: getDefaultPermissions(user.role),
      department: user.department || '',
      dateOfJoining: user.dateOfJoining || '',
      salary: user.salary ?? '',
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUser) {
      const updateData: any = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        department: formData.department,
        avatar: formData.profilePhoto,
        phone: formData.mobile,
        dateOfJoining: formData.dateOfJoining,
        salary: formData.salary === '' || formData.salary === null ? null : Number(formData.salary),
      };

      if (formData.password && formData.password.trim()) {
        updateData.password = formData.password;
      }

      updateMutation.mutate({
        id: selectedUser.id,
        data: updateData as Partial<User>
      });
    } else {
      createMutation.mutate({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        status: formData.status,
        password: formData.password,
        phone: formData.mobile,
        department: formData.department,
        avatar: formData.profilePhoto,
        employeeId: formData.employeeId,
        dateOfJoining: formData.dateOfJoining,
        salary: formData.salary ? Number(formData.salary) : null,
      } as UserCreateData);
    }
  };

  const handlePermissionToggle = useCallback((moduleId: string) => {
    setFormData(prev => {
      const currentPermissions = Array.isArray(prev.permissions) ? prev.permissions : [];
      const newPermissions = currentPermissions.includes(moduleId)
          ? currentPermissions.filter(p => p !== moduleId)
          : [...currentPermissions, moduleId];
      return { ...prev, permissions: newPermissions };
    });
  }, []);

  const handlePhotoUpload = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e: Event) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        if (file.size > 5 * 1024 * 1024) {
          toast({
            title: 'File Too Large',
            description: 'Photo must be less than 5MB',
            variant: 'destructive'
          });
          return;
        }

        if (!file.type.startsWith('image/')) {
          toast({
            title: 'Invalid File Type',
            description: 'Please select an image file (JPG, PNG, etc.)',
            variant: 'destructive'
          });
          return;
        }

        const reader = new FileReader();
        reader.onload = (event) => {
          const base64String = event.target?.result as string;
          setFormData(prev => ({
            ...prev,
            profilePhoto: base64String
          }));
          toast({
            title: 'Photo Updated',
            description: 'Profile photo has been updated successfully.'
          });
        };
        reader.onerror = () => {
          toast({
            title: 'Error Reading File',
            description: 'Failed to read the image file.',
            variant: 'destructive'
          });
        };
        reader.readAsDataURL(file);
      }
    };
    input.click();
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const handleRoleChange = useCallback((newRole: string) => {
    const validRoles = ['ADMIN', 'MANAGER', 'EMPLOYEE'];
    if (!validRoles.includes(newRole)) {
      return;
    }
    const newPermissions = getDefaultPermissions(newRole);
    if (!Array.isArray(newPermissions)) {
      return;
    }
    setFormData(prev => ({
      ...prev,
      role: newRole as User['role'],
      permissions: [...newPermissions],
    }));
  }, []);

  const isMutating = createMutation.isPending || updateMutation.isPending;
  const adminCount = (users?.filter(u => normalizeRole(u.role) === 'ADMIN') ?? []).length;
  const managerCount = (users?.filter(u => normalizeRole(u.role) === 'MANAGER') ?? []).length;
  const employeeCount = (users?.filter(u => normalizeRole(u.role) === 'EMPLOYEE') ?? []).length;
  const activeTodayCount = (users?.filter(u => normalizeStatus(u.status) === 'ACTIVE' && u.lastActive) ?? []).length;

  const safePermissions = Array.isArray(formData.permissions) ? formData.permissions : [];

  const UserCard = ({ user }: { user: User }) => (
      <div className="rounded-lg border bg-card p-4 space-y-3">
        <div className="flex items-start gap-3">
          <Avatar className="h-10 w-10">
            {user.avatar ? (
              <AvatarImage src={user.avatar} alt={user.name} />
            ) : (
              <AvatarFallback className="bg-primary/10 text-primary text-sm">
                {getInitials(user.name)}
              </AvatarFallback>
            )}
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-semibold truncate">{user.name}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <Badge variant="outline" className={roleColors[user.role]}>{formatForDisplay(user.role)}</Badge>
          <Badge variant="outline" className={statusColors[user.status]}>{formatForDisplay(user.status)}</Badge>
        </div>
        <div className="flex gap-2 pt-2 border-t">
          <Button variant="outline" size="sm" className="flex-1" onClick={() => openEditDialog(user)}>
            <Pencil className="mr-1 h-3 w-3" />
            Edit
          </Button>
          {normalizeStatus(user.status) === 'ACTIVE' && (
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

  const handleExportUsers = () => {
    if (!filteredUsers || filteredUsers.length === 0) {
      toast({ title: 'No Data', description: 'No users to export.' });
      return;
    }
    exportToCSV(
      filteredUsers,
      'users',
      [
        { key: 'employeeId', label: 'Employee ID' },
        { key: 'name', label: 'Name' },
        { key: 'email', label: 'Email' },
        { key: 'phone', label: 'Phone' },
        { key: 'role', label: 'Role' },
        { key: 'status', label: 'Status' },
        { key: 'department', label: 'Department' },
        { key: 'dateOfJoining', label: 'Date of Joining' },
      ]
    );
    toast({ title: 'Exported', description: 'User data exported successfully.' });
  };

  return (
      <MainLayout title="Users">
        <div className="space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="hidden sm:block">
              <p className="text-muted-foreground text-sm">Manage user accounts and permissions</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handleExportUsers}>
                <Download className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">Export</span>
              </Button>
              <Button onClick={openCreateDialog} size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Add User
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5 sm:gap-3">
            <Card
                className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'all' ? 'ring-2 ring-primary border-primary' : ''}`}
                onClick={() => setActiveTab('all')}
            >
              <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
                <div className={`p-2 rounded-full mb-1 ${activeTab === 'all' ? 'bg-primary/20' : 'bg-blue-500/10'}`}>
                  <Users className={`h-5 w-5 sm:h-6 sm:w-6 ${activeTab === 'all' ? 'text-primary' : 'text-blue-500'}`} />
                </div>
                <p className="text-xs sm:text-sm font-medium">All Accounts</p>
                <p className={`text-lg sm:text-xl font-bold ${activeTab === 'all' ? 'text-primary' : ''}`}>{users?.filter(u => normalizeStatus(u.status) === 'ACTIVE').length || 0}</p>
              </CardContent>
            </Card>
            <Card
                className={`cursor-pointer transition-all hover:shadow-md ${activeTab === 'inactive-disabled' ? 'ring-2 ring-gray-500 border-gray-500' : ''}`}
                onClick={() => setActiveTab('inactive-disabled')}
            >
              <CardContent className="p-3 sm:p-4 flex flex-col items-center text-center">
                <div className={`p-2 rounded-full mb-1 ${activeTab === 'inactive-disabled' ? 'bg-gray-500/20' : 'bg-gray-500/10'}`}>
                  <UserX className={`h-5 w-5 sm:h-6 sm:w-6 text-gray-500`} />
                </div>
                <p className="text-xs sm:text-sm font-medium">Inactive & Disabled</p>
                <p className={`text-lg sm:text-xl font-bold text-gray-600`}>{inactiveDisabledCount}</p>
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
                <p className="text-xs sm:text-sm font-medium">Admins</p>
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
                        <SelectItem key={role} value={role}>{formatForDisplay(role)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger className="w-full sm:w-[120px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="ACTIVE">Active</SelectItem>
                    <SelectItem value="INACTIVE">Inactive</SelectItem>
                    <SelectItem value="DISABLED">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <div className="space-y-4">
            <div className="space-y-4">
              <div className="md:hidden space-y-3">
                {error ? (
                    <div className="text-center py-8 text-destructive">
                      <p>Error loading users</p>
                      <p className="text-sm text-muted-foreground mt-2">{error instanceof Error ? error.message : 'Unknown error'}</p>
                    </div>
                ) : isLoading ? (
                    [...Array(4)].map((_, i) => <Skeleton key={i} className="h-40 w-full" />)
                ) : filteredUsers?.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">No users found</div>
                ) : (
                    filteredUsers?.map((user) => <UserCard key={user.id} user={user} />)
                )}
              </div>

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
                                    {user.avatar ? (
                                      <AvatarImage src={user.avatar} alt={user.name} />
                                    ) : (
                                      <AvatarFallback className="bg-primary/10 text-primary">
                                        {getInitials(user.name)}
                                      </AvatarFallback>
                                    )}
                                  </Avatar>
                                  <span className="font-medium">{user.name}</span>
                                </div>
                              </td>
                              <td className="py-3">{user.email}</td>
                              <td className="py-3">
                                <Badge variant="outline" className={roleColors[user.role]}>
                                  {formatForDisplay(user.role)}
                                </Badge>
                              </td>
                              <td className="py-3">
                                <Badge variant="outline" className={statusColors[user.status]}>
                                  {formatForDisplay(user.status)}
                                </Badge>
                              </td>
                              <td className="py-3 text-right">
                                <div className="flex justify-end gap-1">
                                  <Button variant="ghost" size="icon" onClick={() => openEditDialog(user)}>
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  {normalizeStatus(user.status) === 'ACTIVE' && (
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
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{selectedUser ? 'Edit User' : 'Add New User'}</DialogTitle>
              <DialogDescription>
                {selectedUser ? 'Update user information and permissions.' : 'Create a new user account with role permissions.'}
              </DialogDescription>
            </DialogHeader>
            {isDialogOpen && (
            <form key={`form-${formData.role}`} onSubmit={handleSubmit} className="space-y-6">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="employeeId">Employee ID *</Label>
                  <Input
                      id="employeeId"
                      value={formData.employeeId}
                      onChange={(e) => setFormData(prev => ({ ...prev, employeeId: e.target.value }))}
                      placeholder="EMP0001"
                      required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name *</Label>
                  <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                      placeholder=" "
                      required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mobile">Mobile Number *</Label>
                  <Input
                      id="mobile"
                      type="tel"
                      value={formData.mobile}
                      onChange={(e) => setFormData(prev => ({ ...prev, mobile: e.target.value }))}
                      placeholder=" "
                      required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email Address *</Label>
                  <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                      placeholder=" "
                      required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="assignedManager">Assigned Manager</Label>
                  <Select
                      value={formData.assignedManager}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, assignedManager: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select manager" />
                    </SelectTrigger>
                    <SelectContent>
                      {(users ?? []).filter(u => {
                        const normalized = normalizeRole(u.role);
                        return normalized === 'MANAGER' || normalized === 'ADMIN';
                      }).map((manager) => (
                          <SelectItem key={manager.id} value={manager.id}>{manager.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="department">Department</Label>
                  <Select
                      value={formData.department || ''}
                      onValueChange={(value) => setFormData(prev => ({ ...prev, department: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="FINANCE">Finance</SelectItem>
                      <SelectItem value="HR">HR</SelectItem>
                      <SelectItem value="TECH">Tech</SelectItem>
                      <SelectItem value="Telecalling">Telecalling</SelectItem>
                      <SelectItem value="SALES">Sales</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dateOfJoining">Date of Joining</Label>
                  <Input
                      id="dateOfJoining"
                      type="date"
                      value={formData.dateOfJoining || ''}
                      onChange={(e) => setFormData(prev => ({ ...prev, dateOfJoining: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="salary">Salary (INR)</Label>
                  <Input
                      id="salary"
                      type="number"
                      min="0"
                      step="1"
                      value={formData.salary}
                      onChange={(e) => {
                        const value = e.target.value;
                        if (value === '') {
                          setFormData(prev => ({ ...prev, salary: '' }));
                          return;
                        }
                        const numeric = Number(value);
                        if (!Number.isNaN(numeric) && numeric >= 0) {
                          setFormData(prev => ({ ...prev, salary: numeric }));
                        }
                      }}
                      placeholder="Enter salary in INR"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="role">User Role *</Label>
                  <Select
                      value={formData.role || 'EMPLOYEE'}
                      onValueChange={handleRoleChange}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="EMPLOYEE">Employee</SelectItem>
                      <SelectItem value="MANAGER">Manager</SelectItem>
                      <SelectItem value="ADMIN">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <KeyRound className="h-4 w-4" />
                  Login Credentials
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="password">Password *</Label>
                    <div className="relative">
                      <Input
                          id="password"
                          type={showPassword ? 'text' : 'password'}
                          value={formData.password}
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            password: e.target.value
                          }))}
                          placeholder=" "
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

              <div className="space-y-4">
                <h4 className="font-medium flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4" />
                  Permissions
                </h4>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                  {permissionModules.map((module) => (
                    <div key={module.id} className="flex items-center space-x-2">
                      <Checkbox
                        id={`perm-${module.id}`}
                        checked={safePermissions.includes(module.id)}
                        onCheckedChange={() => handlePermissionToggle(module.id)}
                      />
                      <Label htmlFor={`perm-${module.id}`} className="font-normal flex items-center gap-2">
                        <module.icon className="h-4 w-4" />
                        {module.name}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>

              <DialogFooter>
                <Button type="button" variant="outline" onClick={closeDialog}>Cancel</Button>
                <Button type="submit" disabled={isMutating}>
                  {isMutating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {selectedUser ? 'Save Changes' : 'Create User'}
                </Button>
              </DialogFooter>
            </form>
            )}
          </DialogContent>
        </Dialog>

        <AlertDialog open={isDisableDialogOpen} onOpenChange={setIsDisableDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This will disable the user account. They will not be able to log in.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => selectedUser && disableMutation.mutate(selectedUser.id)}
                className="bg-destructive hover:bg-destructive/90"
              >
                Disable
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </MainLayout>
  );
}
