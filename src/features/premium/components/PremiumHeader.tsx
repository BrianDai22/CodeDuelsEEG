import React from 'react';
import { Button } from '@ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { useAdmin } from '@shared/context/AdminContext';
import { Avatar, AvatarImage, AvatarFallback } from '@ui/data/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@ui/feedback/dropdown-menu';
import { Badge } from '@ui/data/badge';
import { Code, User, Settings, LogOut, Crown, Shield, Search, ChevronDown, History } from 'lucide-react';

/**
 * The premium header component for users with premium or admin status.
 * This is a standalone component that can be imported directly.
 */
const PremiumHeader: React.FC = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const { isAdmin, isPremium } = useAdmin();

  return (
    <header className="border-b border-border py-4 px-6 bg-gradient-to-r from-gray-900 to-gray-800 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="p-0 hover:bg-transparent text-white" 
            onClick={() => navigate('/premium-dashboard')}
          >
            <div className="flex items-center space-x-3">
              <Code className="h-8 w-8 text-primary" />
              <span className="font-bold text-2xl">CodeDuels</span>
            </div>
          </Button>
        </div>
        
        <nav className="flex items-center space-x-6">
          <Button variant="link" className="text-lg text-white hover:text-gray-300" onClick={() => navigate('/premium-dashboard')}>
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5" />
              <span>Premium Dashboard</span>
            </div>
          </Button>
          <Button variant="link" className="text-lg text-white hover:text-gray-300" onClick={() => navigate('/premium/leaderboard')}>
            Leaderboard
          </Button>
          <Button variant="link" className="text-lg text-white hover:text-gray-300" onClick={() => navigate('/premium/find-match')}>
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Find Match</span>
            </div>
          </Button>
          <Button variant="link" className="text-lg text-white hover:text-gray-300" onClick={() => navigate('/premium/match-history')}>
            <div className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>Match History</span>
            </div>
          </Button>
          {isAdmin && (
            <Button variant="link" className="text-lg text-white hover:text-gray-300" onClick={() => navigate('/admin')}>
              <div className="flex items-center space-x-2">
                <Shield className="h-5 w-5" />
                <span>Admin Panel</span>
              </div>
            </Button>
          )}
        </nav>
        
        <div className="flex items-center space-x-4">
          {isAuthenticated && (
            <Badge variant="default" className="bg-green-500 hover:bg-green-600 text-white px-3 py-1.5 text-sm">
              {isAdmin ? (
                <>
                  <Shield className="h-5 w-5 mr-1.5" />
                  Admin Access
                </>
              ) : (
                <>
                  <Crown className="h-4 w-4 mr-1" />
                  Premium Active
                </>
              )}
            </Badge>
          )}
          
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex items-center space-x-2 transition-colors duration-200 hover:bg-accent text-lg border-gray-700 text-white"
                >
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user?.photoURL} alt={user?.username} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="hidden md:inline font-medium">{user?.username}</span>
                  </div>
                  <ChevronDown className="h-5 w-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem asChild>
                  <Link to="/premium/match-history" className="flex items-center">
                    <History className="mr-2 h-4 w-4" />
                    <span>Match History</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/premium/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => logout()}
                  className="text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => navigate('/login')}
                className="px-8 text-lg border-gray-700 text-white"
              >
                Login
              </Button>
              <Button 
                size="lg" 
                onClick={() => navigate('/signup')}
                className="px-8 text-lg bg-green-600 hover:bg-green-700"
              >
                Sign Up
              </Button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default PremiumHeader; 