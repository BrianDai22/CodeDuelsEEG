import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { useAdmin } from '@shared/context/AdminContext';
import { Button } from '@ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@ui/data/card';
import { Badge } from '@ui/data/badge';
import AdminHeader from '@features/admin/components/AdminHeader';
import LandingFooter from '@shared/components/LandingFooter';
import { Shield, Users, Settings, Database, Activity, FileText, Server, User } from 'lucide-react';
import { toast } from 'sonner';

// Admin dashboard sections
const adminSections = [
  {
    title: 'User Management',
    description: 'View and manage all user accounts',
    icon: Users,
    link: '/admin/users',
    color: 'text-blue-500',
    bgColor: 'bg-blue-50/30',
    borderColor: 'border-blue-200'
  },
  {
    title: 'Role Management',
    description: 'Assign and configure user roles and permissions',
    icon: Shield,
    link: '/admin/roles',
    color: 'text-purple-500',
    bgColor: 'bg-purple-50/30',
    borderColor: 'border-purple-200'
  },
  {
    title: 'System Settings',
    description: 'Configure global application settings',
    icon: Settings,
    link: '/admin/settings',
    color: 'text-gray-500',
    bgColor: 'bg-gray-50/30',
    borderColor: 'border-gray-200'
  },
  {
    title: 'Database Management',
    description: 'Manage database records and maintenance',
    icon: Database,
    link: '/admin/database',
    color: 'text-amber-500',
    bgColor: 'bg-amber-50/30',
    borderColor: 'border-amber-200'
  },
  {
    title: 'System Stats',
    description: 'View system performance and analytics',
    icon: Activity,
    link: '/admin/stats',
    color: 'text-green-500',
    bgColor: 'bg-green-50/30',
    borderColor: 'border-green-200'
  },
  {
    title: 'Logs & Reports',
    description: 'Access system logs and generate reports',
    icon: FileText,
    link: '/admin/logs',
    color: 'text-red-500',
    bgColor: 'bg-red-50/30',
    borderColor: 'border-red-200'
  }
];

// Admin stats for the dashboard
const adminStats = [
  {
    title: 'Total Users',
    value: '3,457',
    icon: Users,
    color: 'text-blue-500',
    bgColor: 'bg-blue-50/30',
    borderColor: 'border-blue-200'
  },
  {
    title: 'Premium Users',
    value: '845',
    percentage: '24.4%',
    icon: User,
    color: 'text-yellow-500',
    bgColor: 'bg-yellow-50/30',
    borderColor: 'border-yellow-200'
  },
  {
    title: 'Server Status',
    value: 'Online',
    icon: Server,
    color: 'text-green-500',
    bgColor: 'bg-green-50/30',
    borderColor: 'border-green-200'
  },
  {
    title: 'Admin Users',
    value: '12',
    icon: Shield,
    color: 'text-purple-500',
    bgColor: 'bg-purple-50/30',
    borderColor: 'border-purple-200'
  }
];

export default function AdminDashboard() {
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
        <div className="max-w-6xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold">Admin Dashboard</h1>
              <p className="text-muted-foreground">System administration and management</p>
            </div>
            
            <Badge variant="outline" className="bg-purple-100 text-purple-800 border-purple-200 px-3 py-1.5">
              <Shield className="h-4 w-4 mr-1.5" />
              Admin Access
            </Badge>
          </div>

          {/* Admin Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            {adminStats.map((stat) => (
              <Card key={stat.title} className={`p-4 ${stat.bgColor} ${stat.borderColor} border`}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.title}</p>
                    <p className="text-2xl font-bold">{stat.value}</p>
                    {stat.percentage && <p className="text-xs text-muted-foreground">{stat.percentage} of total</p>}
                  </div>
                  <div className={`p-2 rounded-full ${stat.bgColor}`}>
                    <stat.icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </Card>
            ))}
          </div>

          {/* Admin Sections */}
          <h2 className="text-2xl font-bold mb-4">Administration Tools</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            {adminSections.map((section) => (
              <Card 
                key={section.title} 
                className={`p-6 ${section.bgColor} ${section.borderColor} border cursor-pointer hover:shadow-md transition-shadow`}
                onClick={() => navigate(section.link)}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-2 rounded-full ${section.bgColor} mb-4`}>
                    <section.icon className={`h-6 w-6 ${section.color}`} />
                  </div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{section.title}</h3>
                <p className="text-muted-foreground">{section.description}</p>
              </Card>
            ))}
          </div>

          {/* Quick Actions */}
          <h2 className="text-2xl font-bold mb-4">Quick Actions</h2>
          <Card className="p-6 mb-8">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Button variant="outline" className="flex flex-col h-auto py-4 border-purple-200 hover:bg-purple-50">
                <Users className="h-6 w-6 mb-2 text-purple-500" />
                <span>Add User</span>
              </Button>
              <Button variant="outline" className="flex flex-col h-auto py-4 border-purple-200 hover:bg-purple-50">
                <Shield className="h-6 w-6 mb-2 text-purple-500" />
                <span>Assign Role</span>
              </Button>
              <Button variant="outline" className="flex flex-col h-auto py-4 border-purple-200 hover:bg-purple-50">
                <Database className="h-6 w-6 mb-2 text-purple-500" />
                <span>Backup DB</span>
              </Button>
              <Button variant="outline" className="flex flex-col h-auto py-4 border-purple-200 hover:bg-purple-50">
                <FileText className="h-6 w-6 mb-2 text-purple-500" />
                <span>View Logs</span>
              </Button>
            </div>
          </Card>
        </div>
      </main>
      
      <LandingFooter />
    </div>
  );
} 