import React, { useState } from 'react';
import { Switch } from '@ui/form/switch';
import { Label } from '@ui/form/label';
import { Button } from '@ui/button';
import { Crown } from 'lucide-react';
import { usePremium } from '@shared/context/PremiumContext';
import { useAuth } from '@features/auth/AuthContext';
import { toast } from 'sonner';

interface SetPremiumStatusProps {
  onStatusChange?: (isPremium: boolean) => void;
}

const SetPremiumStatus: React.FC<SetPremiumStatusProps> = ({ onStatusChange }) => {
  const { isPremium, setPremium } = usePremium();
  const { user } = useAuth();
  const [isUpdating, setIsUpdating] = useState(false);

  const handlePremiumToggle = async (checked: boolean) => {
    if (!user) return;
    
    try {
      setIsUpdating(true);
      
      // The setPremium function now calls the backend securely
      await setPremium(checked);
      
      // Call the callback if provided
      // The toast notification is now handled in the PremiumContext
      if (onStatusChange) {
        onStatusChange(checked);
      }
    } catch (error) {
      // Error handling is now done in the PremiumContext
      console.error('Error in SetPremiumStatus component:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between space-x-2">
        <div className="flex-1">
          <Label htmlFor="premium-toggle" className="flex items-center">
            <Crown className="h-5 w-5 text-yellow-500 mr-2" />
            <span>Premium Status</span>
          </Label>
          <p className="text-sm text-muted-foreground">Enable premium features and access</p>
        </div>
        <Switch
          id="premium-toggle"
          checked={isPremium}
          onCheckedChange={handlePremiumToggle}
          disabled={isUpdating}
        />
      </div>
      
      <div className="grid grid-cols-2 gap-2">
        <Button
          variant="outline"
          size="sm"
          className="border-yellow-200 hover:bg-yellow-100/50"
          onClick={() => handlePremiumToggle(true)}
          disabled={isPremium || isUpdating}
        >
          Enable Premium
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="border-gray-200 hover:bg-gray-100/50"
          onClick={() => handlePremiumToggle(false)}
          disabled={!isPremium || isUpdating}
        >
          Disable Premium
        </Button>
      </div>
    </div>
  );
};

export default SetPremiumStatus; 