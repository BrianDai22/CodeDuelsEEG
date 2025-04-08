import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Code, Crown } from 'lucide-react';

const GuestHeader = () => {
  const navigate = useNavigate();

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
        
        <nav className="hidden md:flex items-center space-x-6">
          <Button variant="link" className="text-lg" onClick={() => navigate('/')}>
            Home
          </Button>
          <Button variant="link" className="text-lg" onClick={() => navigate('/leaderboard')}>
            Leaderboard
          </Button>
          <Button variant="link" className="text-lg" onClick={() => navigate('/premium')}>
            <div className="flex items-center space-x-2">
              <Crown className="h-5 w-5" />
              <span>Premium</span>
            </div>
          </Button>
        </nav>
        
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
      </div>
    </header>
  );
};

export default GuestHeader; 