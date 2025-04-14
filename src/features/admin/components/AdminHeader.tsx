import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { Button } from '@ui/button';
import { Home, BarChart2, Trophy, Settings, LogOut, Shield, Users, Database } from 'lucide-react';
import { cn } from '@shared/lib/utils';

export default function AdminHeader() {
  const { user, logout } = useAuth();
  const location = useLocation();
  
  const handleLogout = async () => {
    await logout();
  };
  
  const isActive = (path: string) => {
    return location.pathname === path;
  };
  
  return (
    <header className="bg-background border-b border-border">
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <div className="flex items-center">
          <Link to="/admin/dashboard" className="font-bold text-xl mr-8">
            Admin Panel
          </Link>
          <nav className="hidden md:flex space-x-6">
            <Link
              to="/admin/dashboard"
              className={cn(
                "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                isActive("/admin/dashboard") ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Shield size={18} />
              <span>Dashboard</span>
            </Link>
            <Link
              to="/admin/users"
              className={cn(
                "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                isActive("/admin/users") ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Users size={18} />
              <span>Users</span>
            </Link>
            <Link
              to="/admin/leaderboard"
              className={cn(
                "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                isActive("/admin/leaderboard") ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Trophy size={18} />
              <span>Leaderboard</span>
            </Link>
            <Link
              to="/admin/statistics"
              className={cn(
                "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                isActive("/admin/statistics") ? "text-primary" : "text-muted-foreground"
              )}
            >
              <BarChart2 size={18} />
              <span>Statistics</span>
            </Link>
            <Link
              to="/admin/database"
              className={cn(
                "flex items-center space-x-2 text-sm font-medium transition-colors hover:text-primary",
                isActive("/admin/database") ? "text-primary" : "text-muted-foreground"
              )}
            >
              <Database size={18} />
              <span>Database</span>
            </Link>
          </nav>
        </div>
        <div className="flex items-center space-x-4">
          <div className="hidden md:block text-sm font-medium">
            {user?.displayName || 'Admin'}
          </div>
          <Link to="/admin/settings">
            <Button variant="ghost" size="icon">
              <Settings size={20} />
            </Button>
          </Link>
          <Button variant="ghost" size="icon" onClick={handleLogout}>
            <LogOut size={20} />
          </Button>
        </div>
      </div>
    </header>
  );
} 