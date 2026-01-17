import { useState, useRef } from 'react';
import { useAuth, NotificationPreferences } from '@/context/AuthContext';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Mail, Shield, Building2, Clock, Pencil, Eye, EyeOff, Loader2, Camera, X, Bell, User } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ImageCropper } from '@/components/ImageCropper';

interface ProfileDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const roleColors: Record<string, string> = {
  ADMIN: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  MANAGER: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  EMPLOYEE: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  Admin: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  Manager: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  Employee: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
};

const statusColors: Record<string, string> = {
  ACTIVE: 'bg-green-500/10 text-green-600 border-green-500/20',
  INACTIVE: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  DISABLED: 'bg-destructive/10 text-destructive border-destructive/20',
  Active: 'bg-green-500/10 text-green-600 border-green-500/20',
  Inactive: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
  Disabled: 'bg-destructive/10 text-destructive border-destructive/20',
};

// Helper to format role/status for display (UPPERCASE -> Capitalized)
const formatForDisplay = (value: string): string => {
  if (!value) return '';
  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
};

const notificationLabels: Record<keyof NotificationPreferences, { label: string; description: string }> = {
  emailNotifications: { label: 'Email Notifications', description: 'Receive notifications via email' },
  pushNotifications: { label: 'Push Notifications', description: 'Receive browser push notifications' },
  smsNotifications: { label: 'SMS Notifications', description: 'Receive notifications via text message' },
  weeklyDigest: { label: 'Weekly Digest', description: 'Get a weekly summary of activities' },
  projectUpdates: { label: 'Project Updates', description: 'Notifications for project changes' },
  invoiceAlerts: { label: 'Invoice Alerts', description: 'Notifications for new invoices' },
  approvalRequests: { label: 'Approval Requests', description: 'Notifications for pending approvals' },
};

export function ProfileDialog({ open, onOpenChange }: ProfileDialogProps) {
  const { user, updateProfile, notificationPreferences, updateNotificationPreferences } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [cropperImage, setCropperImage] = useState<string | null>(null);
  const [isCropperOpen, setIsCropperOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('profile');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase();
  };

  const handleEditClick = () => {
    if (user) {
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        confirmPassword: '',
      });
      setAvatarPreview(user.avatar || null);
      setIsEditing(true);
    }
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData({ name: '', email: '', password: '', confirmPassword: '' });
    setAvatarPreview(null);
    setShowPassword(false);
    setShowConfirmPassword(false);
  };

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({ title: 'Error', description: 'Image size must be less than 5MB.', variant: 'destructive' });
        return;
      }
      if (!file.type.startsWith('image/')) {
        toast({ title: 'Error', description: 'Please select an image file.', variant: 'destructive' });
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setCropperImage(reader.result as string);
        setIsCropperOpen(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCropComplete = (croppedImage: string) => {
    setAvatarPreview(croppedImage);
    setCropperImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveAvatar = () => {
    setAvatarPreview(null);
    setCropperImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSave = async () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Name is required.', variant: 'destructive' });
      return;
    }

    if (!formData.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      toast({ title: 'Error', description: 'Valid email is required.', variant: 'destructive' });
      return;
    }

    if (formData.password && formData.password !== formData.confirmPassword) {
      toast({ title: 'Error', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }

    if (formData.password && formData.password.length < 6) {
      toast({ title: 'Error', description: 'Password must be at least 6 characters.', variant: 'destructive' });
      return;
    }

    setIsLoading(true);
    try {
      const success = await updateProfile({
        name: formData.name,
        email: formData.email,
        ...(formData.password && { password: formData.password }),
        avatar: avatarPreview || undefined,
      });

      if (success) {
        toast({ title: 'Success', description: 'Profile updated successfully.' });
        setIsEditing(false);
        setFormData({ name: '', email: '', password: '', confirmPassword: '' });
        setAvatarPreview(null);
        setShowPassword(false);
        setShowConfirmPassword(false);
      } else {
        toast({ title: 'Error', description: 'Failed to update profile.', variant: 'destructive' });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleNotificationChange = async (key: keyof NotificationPreferences, value: boolean) => {
    const success = await updateNotificationPreferences({ [key]: value });
    if (success) {
      toast({ title: 'Saved', description: 'Notification preference updated.' });
    }
  };

  const handleClose = (openState: boolean) => {
    if (!openState) {
      handleCancel();
      setAvatarPreview(null);
      setActiveTab('profile');
    }
    onOpenChange(openState);
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{isEditing ? 'Edit Profile' : 'Settings'}</DialogTitle>
        </DialogHeader>

        {isEditing ? (
          <div className="space-y-4 py-4">
            <div className="flex flex-col items-center mb-4">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={avatarPreview || undefined} alt="Profile" />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {formData.name ? getInitials(formData.name) : getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <Button
                  type="button"
                  variant="secondary"
                  size="icon"
                  className="absolute bottom-0 right-0 h-8 w-8 rounded-full shadow-md"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Camera className="h-4 w-4" />
                </Button>
              </div>
              {avatarPreview && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="mt-2 text-destructive hover:text-destructive"
                  onClick={handleRemoveAvatar}
                >
                  <X className="h-4 w-4 mr-1" />
                  Remove Photo
                </Button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-name">Full Name</Label>
              <Input
                id="edit-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-email">Email</Label>
              <Input
                id="edit-email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="Enter your email"
              />
            </div>

            <Separator />

            <p className="text-sm text-muted-foreground">Leave password fields empty to keep current password</p>

            <div className="space-y-2">
              <Label htmlFor="edit-password">New Password</Label>
              <div className="relative">
                <Input
                  id="edit-password"
                  type={showPassword ? 'text' : 'password'}
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Enter new password"
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

            <div className="space-y-2">
              <Label htmlFor="edit-confirm-password">Confirm Password</Label>
              <div className="relative">
                <Input
                  id="edit-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={formData.confirmPassword}
                  onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                  placeholder="Confirm new password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <DialogFooter className="gap-2 pt-4">
              <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="profile" className="flex items-center gap-2">
                <User className="h-4 w-4" />
                Profile
              </TabsTrigger>
              <TabsTrigger value="notifications" className="flex items-center gap-2">
                <Bell className="h-4 w-4" />
                Notifications
              </TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-4">
              <div className="flex flex-col items-center py-4">
                <Avatar className="h-20 w-20 mb-4">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                    {getInitials(user.name)}
                  </AvatarFallback>
                </Avatar>
                
                <h2 className="text-xl font-semibold">{user.name}</h2>
                
                <div className="flex gap-2 mt-2">
                  <Badge variant="outline" className={roleColors[user.role] || roleColors.EMPLOYEE}>
                    {formatForDisplay(user.role)}
                  </Badge>
                  <Badge variant="outline" className={statusColors[user.status] || statusColors.ACTIVE}>
                    {formatForDisplay(user.status)}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div className="space-y-4 py-2">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Mail className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <p className="text-sm font-medium">{user.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-muted">
                    <Shield className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Role</p>
                    <p className="text-sm font-medium">{formatForDisplay(user.role)}</p>
                  </div>
                </div>

                {user.department && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Department</p>
                      <p className="text-sm font-medium">{user.department}</p>
                    </div>
                  </div>
                )}

                {user.lastActive && (
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-muted">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Last Active</p>
                      <p className="text-sm font-medium">{user.lastActive}</p>
                    </div>
                  </div>
                )}
              </div>

              <DialogFooter>
                <Button onClick={handleEditClick} className="w-full">
                  <Pencil className="mr-2 h-4 w-4" />
                  Edit Profile
                </Button>
              </DialogFooter>
            </TabsContent>

            <TabsContent value="notifications" className="space-y-4 py-4">
              <div className="space-y-4">
                {(Object.keys(notificationLabels) as Array<keyof NotificationPreferences>).map((key) => (
                  <div key={key} className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor={key} className="text-sm font-medium">
                        {notificationLabels[key].label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {notificationLabels[key].description}
                      </p>
                    </div>
                    <Switch
                      id={key}
                      checked={notificationPreferences[key]}
                      onCheckedChange={(checked) => handleNotificationChange(key, checked)}
                    />
                  </div>
                ))}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </DialogContent>

      {cropperImage && (
        <ImageCropper
          open={isCropperOpen}
          onOpenChange={(open) => {
            setIsCropperOpen(open);
            if (!open) {
              setCropperImage(null);
              if (fileInputRef.current) {
                fileInputRef.current.value = '';
              }
            }
          }}
          imageSrc={cropperImage}
          onCropComplete={handleCropComplete}
        />
      )}
    </Dialog>
  );
}
