import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { useAdmin } from '@shared/context/AdminContext';
import { Button } from '@ui/button';
import { Card } from '@ui/data/card';
import { Badge } from '@ui/data/badge';
import LandingHeader from '@shared/components/LandingHeader';
import PremiumHeader from '@shared/components/PremiumHeader';
import UserHeader from '@shared/components/UserHeader';
import GuestHeader from '@shared/components/GuestHeader';
import LandingFooter from '@shared/components/LandingFooter';
import { Search, Trophy, LogIn, UserPlus, Crown, Shield } from 'lucide-react';

const mockOpponents = [
  { id: '1', username: 'CodeMaster', tier: 'Diamond', rating: 1850, winRate: '68%', online: true },
  { id: '2', username: 'AlgorithmWizard', tier: 'Platinum', rating: 1650, winRate: '62%', online: true },
  { id: '3', username: 'SyntaxNinja', tier: 'Gold', rating: 1450, winRate: '55%', online: true },
  { id: '4', username: 'ByteBoss', tier: 'Bronze', rating: 1050, winRate: '42%', online: true },
];

export default function FindMatch() {
  const { isAuthenticated } = useAuth();
  const { isAdmin } = useAdmin();
  const [isPremium, setIsPremium] = useState(() => {
    // Initialize from localStorage
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      return profile.isPremium || isAdmin;
    }
    return false;
  });
  const [difficulty, setDifficulty] = useState<string | null>(null);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (searching) {
      const timer = setTimeout(() => {
        setSearching(false);
        if (difficulty) {
          navigate(`/battle?difficulty=${difficulty.toLowerCase()}`);
        }
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [searching, navigate, difficulty]);

  const startSearch = () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    if (difficulty) {
      setSearching(true);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Diamond': return 'bg-blue-500';
      case 'Platinum': return 'bg-gray-400';
      case 'Gold': return 'bg-yellow-500';
      case 'Bronze': return 'bg-amber-700';
      default: return 'bg-gray-200';
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      {location.pathname.startsWith('/premium/') ? (
        <PremiumHeader />
      ) : (
        isPremium ? <PremiumHeader /> : <LandingHeader />
      )}
      
      <main className="flex-grow container mx-auto py-6 px-4">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">Find a Match</h1>
            <p className="text-muted-foreground">Challenge other coders in real-time</p>
          </div>
          
          <div className="flex items-center gap-3">
            {isPremium && (
              <Badge variant="default" className="bg-green-500/80 hover:bg-green-600/80 text-white px-3 py-1.5 text-sm">
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
          </div>
        </div>
        
        <div className="max-w-2xl mx-auto">
          <Card className="p-6">
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-semibold mb-4">Select Difficulty</h2>
                <div className="grid grid-cols-3 gap-4">
                  <Button
                    variant={difficulty === 'Easy' ? 'default' : 'outline'}
                    onClick={() => setDifficulty('Easy')}
                    className="w-full"
                  >
                    Easy
                  </Button>
                  <Button
                    variant={difficulty === 'Medium' ? 'default' : 'outline'}
                    onClick={() => setDifficulty('Medium')}
                    className="w-full"
                  >
                    Medium
                  </Button>
                  <Button
                    variant={difficulty === 'Hard' ? 'default' : 'outline'}
                    onClick={() => setDifficulty('Hard')}
                    className="w-full"
                  >
                    Hard
                  </Button>
                </div>
              </div>

              <Button
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                size="lg"
                disabled={!difficulty || searching}
                onClick={startSearch}
              >
                {searching ? (
                  <>
                    <Search className="mr-2 h-4 w-4 animate-spin" />
                    Finding Match...
                  </>
                ) : (
                  'Start Matchmaking'
                )}
              </Button>
            </div>
          </Card>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
} 