import { useState } from 'react';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Shield } from 'lucide-react';
import { toast } from 'sonner';
import { updateUserProfile } from '@/lib/api';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

interface AdminSettingsProps {
  isAdmin: boolean;
  isAdminMode: boolean;
  setIsAdminMode: (value: boolean) => void;
}

export default function AdminSettings({ isAdmin, isAdminMode, setIsAdminMode }: AdminSettingsProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleAdminToggle = async () => {
    try {
      setIsLoading(true);
      
      // Update the user's admin status
      await updateUserProfile({ isAdmin: !isAdmin });
      
      // Update local state
      setIsAdminMode(!isAdmin);
      
      toast.success(`Admin status ${!isAdmin ? 'enabled' : 'disabled'}`);
    } catch (error) {
      console.error('Error updating admin status:', error);
      toast.error('Failed to update admin status');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminModeToggle = () => {
    // Toggle admin mode without changing admin status
    setIsAdminMode(!isAdminMode);
    toast.success(`Admin mode ${!isAdminMode ? 'enabled' : 'disabled'}`);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Account Settings</CardTitle>
        <CardDescription>Manage your account settings and permissions</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {isAdmin ? (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-blue-500" />
                <Label htmlFor="admin-mode">Admin Mode</Label>
              </div>
              <Switch
                id="admin-mode"
                checked={isAdminMode}
                onCheckedChange={handleAdminModeToggle}
                disabled={isLoading}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Admin mode gives you access to all features and content.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5 text-gray-400" />
                <Label htmlFor="admin-toggle">Enable Admin</Label>
              </div>
              <Switch
                id="admin-toggle"
                checked={isAdmin}
                onCheckedChange={handleAdminToggle}
                disabled={isLoading}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              Enable admin privileges to unlock all features and content.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 