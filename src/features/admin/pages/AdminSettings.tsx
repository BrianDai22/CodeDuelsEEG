import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { useAdmin } from '@shared/context/AdminContext';
import { Button } from '@ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from '@ui/data/card';
import { Input } from '@ui/form/input';
import { Separator } from '@ui/layout/separator';
import { Badge } from '@ui/data/badge';
import { Shield, Settings as SettingsIcon } from 'lucide-react';
import AdminHeader from '@features/admin/components/AdminHeader';
import { SetAdminStatus } from '@features/admin';
import { toast } from 'sonner';

export default function AdminSettings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isAdmin } = useAdmin();

  // Redirect non-admin users
  useEffect(() => {
    if (user && !isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      navigate('/', { replace: true });
    }
  }, [user, isAdmin, navigate]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Checking admin privileges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <AdminHeader />
      
      <main className="flex-grow container py-6 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <SettingsIcon className="mr-3 h-8 w-8 text-purple-500" />
                Admin Settings
              </h1>
              <p className="text-muted-foreground">Configure admin platform settings</p>
            </div>
            
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1.5">
              <Shield className="h-4 w-4 mr-1.5" />
              Admin Access
            </Badge>
          </div>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle>System Configuration</CardTitle>
              <CardDescription>
                Configure global system settings for the platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="site-name" className="text-sm font-medium">
                  Site Name
                </label>
                <Input 
                  id="site-name" 
                  placeholder="CodeDuels"
                  defaultValue="CodeDuels"
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="maintenance-mode" className="text-sm font-medium">
                  Maintenance Mode
                </label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="maintenance-mode" 
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    Enable maintenance mode for all users
                  </span>
                </div>
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-end">
                <Button>
                  Save System Settings
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Admin Privileges</CardTitle>
              <CardDescription>
                Manage your admin access and permissions
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SetAdminStatus
                onStatusChange={(status) => {
                  if (!status) {
                    toast.success("Admin status removed. Redirecting to home...");
                    setTimeout(() => navigate('/'), 1500);
                  } else {
                    toast.success("Admin status confirmed");
                  }
                }}
              />
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure admin security settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="two-factor" className="text-sm font-medium">
                  Two-Factor Authentication
                </label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="checkbox" 
                    id="two-factor" 
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-sm text-muted-foreground">
                    Enable two-factor authentication for admin access
                  </span>
                </div>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="session-timeout" className="text-sm font-medium">
                  Admin Session Timeout (minutes)
                </label>
                <Input 
                  id="session-timeout" 
                  type="number"
                  placeholder="60"
                  defaultValue="60"
                />
              </div>
              
              <Separator className="my-4" />
              
              <div className="flex justify-end">
                <Button>
                  Save Security Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
} 