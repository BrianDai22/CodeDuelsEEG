import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Search, X, Trophy, LogIn, UserPlus } from 'lucide-react';
import LandingHeader from '@/components/LandingHeader';
import LandingFooter from '@/components/LandingFooter';

// Mock data for available opponents
const mockOpponents = [
  { id: '1', username: 'CodeMaster', tier: 'Diamond', rating: 1850, winRate: '68%', online: true },
  { id: '2', username: 'AlgorithmWizard', tier: 'Platinum', rating: 1650, winRate: '62%', online: true },
  { id: '3', username: 'SyntaxNinja', tier: 'Gold', rating: 1450, winRate: '55%', online: true },
  { id: '4', username: 'DebugQueen', tier: 'Silver', rating: 1250, winRate: '48%', online: false },
  { id: '5', username: 'ByteBoss', tier: 'Bronze', rating: 1050, winRate: '42%', online: true },
];

export default function FindMatch() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [searching, setSearching] = useState(false);
  const [searchProgress, setSearchProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [opponents, setOpponents] = useState(mockOpponents);
  const [filteredOpponents, setFilteredOpponents] = useState(mockOpponents);
  const [selectedOpponent, setSelectedOpponent] = useState<string | null>(null);

  // Simulate search progress
  useEffect(() => {
    let interval: number | undefined;
    
    if (searching) {
      setSearchProgress(0);
      interval = window.setInterval(() => {
        setSearchProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setSearching(false);
            return 100;
          }
          return prev + 5;
        });
      }, 500);
    }
    
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [searching]);

  const startSearch = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setSearching(true);
    setError(null);
  };

  const cancelSearch = () => {
    setSearching(false);
    setSearchProgress(0);
  };

  const challengeOpponent = (opponentId: string) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: location } });
      return;
    }
    setSelectedOpponent(opponentId);
    // In a real app, this would send a challenge request to the opponent
    // For now, we'll just navigate to the battle page
    navigate('/battle');
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'Diamond': return 'bg-blue-500';
      case 'Platinum': return 'bg-gray-400';
      case 'Gold': return 'bg-yellow-500';
      case 'Silver': return 'bg-gray-300';
      case 'Bronze': return 'bg-amber-700';
      default: return 'bg-gray-200';
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <LandingHeader />
      <main className="flex-1 container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold mb-6">Find a Match</h1>
          
          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Quick Match</CardTitle>
              <CardDescription>
                {isAuthenticated 
                  ? "Find a random opponent based on your skill level"
                  : "Sign in to find opponents and start dueling"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {searching ? (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Searching for opponents...</span>
                    <span className="text-sm font-medium">{searchProgress}%</span>
                  </div>
                  <Progress value={searchProgress} className="h-2" />
                  <Button variant="destructive" onClick={cancelSearch} className="w-full">
                    <X className="h-4 w-4 mr-2" />
                    Cancel Search
                  </Button>
                </div>
              ) : isAuthenticated ? (
                <Button onClick={startSearch} className="w-full" size="lg">
                  <Search className="h-4 w-4 mr-2" />
                  Find Match
                </Button>
              ) : (
                <div className="space-y-4">
                  <p className="text-center text-muted-foreground mb-4">
                    You need an account to find matches and challenge opponents.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <Button asChild className="w-full" size="lg">
                      <Link to="/login">
                        <LogIn className="h-4 w-4 mr-2" />
                        Log In
                      </Link>
                    </Button>
                    <Button asChild variant="outline" className="w-full" size="lg">
                      <Link to="/signup">
                        <UserPlus className="h-4 w-4 mr-2" />
                        Sign Up
                      </Link>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <h2 className="text-2xl font-bold mb-4">Available Opponents</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredOpponents.map((opponent) => (
              <Card key={opponent.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg">{opponent.username}</CardTitle>
                      <div className="flex items-center mt-1">
                        <Badge className={getTierColor(opponent.tier)}>{opponent.tier}</Badge>
                        <span className="text-sm text-muted-foreground ml-2">Rating: {opponent.rating}</span>
                      </div>
                    </div>
                    <Badge variant={opponent.online ? "default" : "secondary"}>
                      {opponent.online ? "Online" : "Offline"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="pb-2">
                  <div className="flex items-center text-sm text-muted-foreground">
                    <Trophy className="h-4 w-4 mr-1" />
                    <span>Win Rate: {opponent.winRate}</span>
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={() => challengeOpponent(opponent.id)} 
                    className="w-full"
                    disabled={!opponent.online}
                  >
                    {isAuthenticated ? "Challenge" : "Sign In to Challenge"}
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
} 