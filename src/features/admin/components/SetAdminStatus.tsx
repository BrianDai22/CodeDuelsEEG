import React, { useState } from 'react';
import { Switch } from '@ui/form/switch';
import { Label } from '@ui/form/label';
import { Button } from '@ui/button';
import { Shield } from 'lucide-react';
import { useAdmin } from '@shared/context/AdminContext';
import { useAuth } from '@features/auth/AuthContext';
import { toast } from 'sonner';

interface SetAdminStatusProps {
  onStatusChange?: (isAdmin: boolean) => void;
}

const SetAdminStatus: React.FC<SetAdminStatusProps> = ({ onStatusChange }) => {
  const { isAdmin, setIsAdmin } = useAdmin();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const handleAdminToggle = async (checked: boolean) => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      // The setIsAdmin function now calls the backend securely
      await setIsAdmin(checked);
      
      // Call the callback if provided
      // The toast notification is now handled in the AdminContext
      if (onStatusChange) {
        onStatusChange(checked);
      }
    } catch (error) {
      // Error handling is now done in the AdminContext
      console.error('Error in SetAdminStatus component:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-2">
        <div className="flex-1">
          <Label htmlFor="admin-toggle" className="flex items-center">
            <Shield className="h-5 w-5 text-purple-500 mr-2" />
            <span>Admin Status</span>
          </Label>
          <p className="text-sm text-muted-foreground">Grant or revoke administrator privileges</p>
        </div>
        <Switch
          id="admin-toggle"
          checked={isAdmin}
          onCheckedChange={handleAdminToggle}
          disabled={isUpdating}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="border-purple-200 hover:bg-purple-100/50"
          onClick={() => handleAdminToggle(true)}
          disabled={isAdmin || isUpdating}
        >
          Grant Admin
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-200 hover:bg-gray-100/50"
          onClick={() => handleAdminToggle(false)}
          disabled={!isAdmin || isUpdating}
        >
          Revoke Admin
        </Button>
      </div>
    </div>
  );
};

export default SetAdminStatus; 