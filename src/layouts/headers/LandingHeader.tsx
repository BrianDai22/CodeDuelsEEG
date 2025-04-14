import { Button } from '@ui/button';
import React from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { Avatar, AvatarImage, AvatarFallback } from '@ui/data/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@ui/feedback/dropdown-menu';
import { Code, User, Settings, LogOut, Search, ChevronDown, History, Home, Crown, Shield } from 'lucide-react';

const LandingHeader = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="border-b border-border py-4 px-6">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center">
          <Button 
            variant="ghost" 
            className="p-0 hover:bg-transparent" 
            onClick={() => navigate('/')}
          >
            <div className="flex items-center space-x-3">
              <Code className="h-8 w-8 text-primary" />
              <span className="font-bold text-2xl">CodeDuels</span>
            </div>
          </Button>
        </div>
        
        <nav className="flex items-center space-x-6">
          <Button variant="link" className="text-lg" onClick={() => navigate('/')}>
            <div className="flex items-center space-x-2">
              <Home className="h-5 w-5" />
              <span>Home</span>
            </div>
          </Button>
          <Button variant="link" className="text-lg" onClick={() => navigate('/leaderboard')}>
            Leaderboard
          </Button>
          <Button variant="link" className="text-lg" onClick={() => navigate('/find-match')}>
            <div className="flex items-center space-x-2">
              <Search className="h-5 w-5" />
              <span>Find Match</span>
            </div>
          </Button>
          <Button variant="link" className="text-lg" onClick={() => navigate('/premium')}>
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5" />
              <span>Premium</span>
            </div>
          </Button>
        </nav>
        
        <div className="flex items-center">
          {isAuthenticated ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="flex items-center space-x-2 transition-colors duration-200 hover:bg-accent text-lg"
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
                  <Link to="/match-history" className="flex items-center">
                    <History className="mr-2 h-4 w-4" />
                    <span>Match History</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link to="/settings" className="flex items-center">
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
                className="px-8 text-lg"
              >
                Login
              </Button>
              <Button 
                size="lg" 
                onClick={() => navigate('/signup')}
                className="px-8 text-lg"
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

export default LandingHeader;
