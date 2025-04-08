import { Button } from '@/components/ui/button';
import { useNavigate, Link } from 'react-router-dom';
import { Code, LogOut, User, Search, Crown, Settings, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useRef, useEffect } from 'react';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';

const LandingHeader = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
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
        
        <nav className="hidden md:flex items-center space-x-8">
          <Button variant="link" className="text-lg" onClick={() => navigate('/')}>Home</Button>
          <Button variant="link" className="text-lg" onClick={() => navigate('/leaderboard')}>Leaderboard</Button>
          <Button variant="link" className="text-lg" onClick={() => navigate('/find-match')}>
            <Search className="h-5 w-5 mr-2" />
            Find Match
          </Button>
          <Button variant="link" className="text-lg" onClick={() => navigate('/premium')}>
            <Crown className="h-5 w-5 mr-2" />
            Premium
          </Button>
          {isAuthenticated && (
            <Button variant="link" className="text-lg" onClick={() => navigate('/profile')}>Profile</Button>
          )}
        </nav>
        
        <div className="flex items-center">
          {isAuthenticated ? (
            <div className="relative" ref={dropdownRef}>
              <Button 
                variant="outline" 
                size="lg" 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="flex items-center space-x-2 transition-colors duration-200 hover:bg-accent text-lg"
              >
                <div className="flex items-center space-x-2">
                  {user?.photoURL ? (
                    <Avatar className="h-7 w-7">
                      <AvatarImage src={user.photoURL} alt={user.username} />
                      <AvatarFallback>
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  ) : (
                    <User className="h-6 w-6" />
                  )}
                  <span className="hidden md:inline font-medium">{user?.username}</span>
                </div>
                <ChevronDown className={`h-5 w-5 transition-transform duration-200 ${dropdownOpen ? 'transform rotate-180' : ''}`} />
              </Button>
              
              {dropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-background rounded-md shadow-lg py-1 z-10 border border-border animate-in fade-in slide-in-from-top-2 duration-200">
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start px-4 py-2 text-sm hover:bg-accent transition-colors duration-200" 
                    onClick={() => {
                      navigate('/settings');
                      setDropdownOpen(false);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Settings
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start px-4 py-2 text-sm text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors duration-200" 
                    onClick={() => {
                      logout();
                      setDropdownOpen(false);
                    }}
                  >
                    <LogOut className="h-4 w-4 mr-2" />
                    Logout
                  </Button>
                </div>
              )}
            </div>
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
