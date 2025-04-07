import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Code, LogOut, User, Search } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const LandingHeader = () => {
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  
  return (
    <header className="border-b border-border py-3 px-4">
      <div className="container mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <Code className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">CodeDuels</span>
        </div>
        
        <nav className="hidden md:flex items-center space-x-4">
          <Button variant="link" onClick={() => navigate('/')}>Home</Button>
          <Button variant="link" onClick={() => navigate('/leaderboard')}>Leaderboard</Button>
          <Button variant="link" onClick={() => navigate('/find-match')}>
            <Search className="h-4 w-4 mr-1" />
            Find Match
          </Button>
          {isAuthenticated && (
            <Button variant="link" onClick={() => navigate('/profile')}>Profile</Button>
          )}
        </nav>
        
        <div className="flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <User className="h-4 w-4" />
                <span>{user?.username}</span>
              </div>
              <Button variant="outline" size="sm" onClick={logout}>
                <LogOut className="h-4 w-4 mr-1" />
                Logout
              </Button>
            </>
          ) : (
            <>
              <Button variant="outline" size="sm" onClick={() => navigate('/login')}>
                Login
              </Button>
              <Button size="sm" onClick={() => navigate('/signup')}>
                Sign Up
              </Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
};

export default LandingHeader;
