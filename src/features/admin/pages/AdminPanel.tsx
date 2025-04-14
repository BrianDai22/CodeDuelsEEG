import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { useAdmin } from '@shared/context/AdminContext';
import { Button } from '@ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/data/card';
import { Badge } from '@ui/data/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/layout/tabs';
import { Shield, User, Settings, ArrowLeft, Users, Crown } from 'lucide-react';
import AdminHeader from '@features/admin/components/AdminHeader';
import { SetAdminStatus } from '@features/admin';
import { SetPremiumStatus } from '@features/premium';
import { toast } from 'sonner';
import { getFunctions, httpsCallable } from 'firebase/functions';

export default function AdminPanel() {
  const navigate = useNavigate();
  const { user, refreshUser } = useAuth();
  const { isAdmin, loading: adminLoading, verifyAdminStatus } = useAdmin();
  const [verifyingRole, setVerifyingRole] = useState(true);
  const functions = getFunctions();

  // Server-side verification of admin status
  useEffect(() => {
    const verifyAdminRole = async () => {
      if (!user) {
        toast.error("User not authenticated");
        navigate('/', { replace: true });
        return;
      }

      try {
        setVerifyingRole(true);
        
        // Use the Admin context's verification method which calls the backend
        const isVerified = await verifyAdminStatus();
        
        if (!isVerified) {
          toast.error("Access denied. Admin privileges required.");
          navigate('/', { replace: true });
        }
      } catch (error) {
        console.error("Error verifying admin role:", error);
        toast.error("Error verifying admin access");
        navigate('/', { replace: true });
      } finally {
        setVerifyingRole(false);
      }
    };

    if (!adminLoading) {
      verifyAdminRole();
    }
  }, [user, navigate, adminLoading, verifyAdminStatus]);

  // Frontend client-side check as a backup and for responsive UI
  useEffect(() => {
    if (!adminLoading && user && !isAdmin) {
      toast.error("Access denied. Admin privileges required.");
      navigate('/', { replace: true });
    }
  }, [user, isAdmin, navigate, adminLoading]);

  if (adminLoading || verifyingRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">Verifying admin privileges...</p>
        </div>
      </div>
    );
  }

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
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold flex items-center">
                <Shield className="mr-3 h-8 w-8 text-purple-500" />
                Admin Panel
              </h1>
              <p className="text-muted-foreground">Manage system settings and user permissions</p>
            </div>
            
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1.5">
                <Shield className="h-4 w-4 mr-1.5" />
                Administrator Mode
              </Badge>
              
              <Button 
                variant="outline" 
                onClick={() => navigate(-1)}
                className="flex items-center"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
            </div>
          </div>
          
          <Tabs defaultValue="users" className="space-y-6">
            <TabsList className="w-full border-b rounded-none justify-start">
              <TabsTrigger value="users" className="flex items-center">
                <Users className="mr-2 h-4 w-4" />
                Users
              </TabsTrigger>
              <TabsTrigger value="roles" className="flex items-center">
                <Shield className="mr-2 h-4 w-4" />
                Roles
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="users" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>User Management</CardTitle>
                  <CardDescription>View and manage application users</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    User management interface will be implemented here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="roles" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Role Management</CardTitle>
                  <CardDescription>Control user roles and permissions</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Shield className="h-5 w-5 text-purple-500 mr-2" />
                        Admin Privileges
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SetAdminStatus 
                        onStatusChange={(status) => {
                          console.log("Admin status changed:", status);
                        }}
                      />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-lg flex items-center">
                        <Crown className="h-5 w-5 text-yellow-500 mr-2" />
                        Premium Status
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <SetPremiumStatus 
                        onStatusChange={(status) => {
                          console.log("Premium status changed:", status);
                        }}
                      />
                    </CardContent>
                  </Card>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="settings" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>System Settings</CardTitle>
                  <CardDescription>Configure application settings</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">
                    System settings interface will be implemented here.
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
} 