import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Frown, BarChart, Crown, Shield } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { useAdmin } from '@/contexts/AdminContext';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import LandingHeader from '@/components/LandingHeader';
import PremiumHeader from '@/components/PremiumHeader';
import LandingFooter from '@/components/LandingFooter';

const Results = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const { isAuthenticated } = useAuth();
  
  const [isPremium, setIsPremium] = useState(() => {
    // Initialize from localStorage
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      return profile.isPremium || isAdmin;
    }
    return false;
  });
  
  const result = searchParams.get('result') || 'win';
  const isWin = result === 'win';
  
  const [xp, setXp] = useState(0);
  const [showStats, setShowStats] = useState(false);
  
  const stats = {
    timeToSolve: '3:45',
    testCasesPassed: isWin ? '3/3' : '1/3',
    characterTyped: 245,
    timeComplexity: isWin ? 'O(n)' : 'O(n²)',
  };
  
  useEffect(() => {
    const timer = setInterval(() => {
      setXp(prev => {
        const target = isWin ? 85 : 25;
        if (prev >= target) {
          clearInterval(timer);
          return target;
        }
        return prev + 1;
      });
    }, 30);
    
    toast({
      title: isWin ? "Victory!" : "Defeat!",
      description: isWin ? "You've won the coding duel!" : "Better luck next time!",
    });
    
    return () => clearInterval(timer);
  }, [isWin, toast]);
  
  return (
    <div className="min-h-screen flex flex-col">
      {isPremium ? <PremiumHeader /> : <LandingHeader />}
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              {isWin ? (
                <div className="h-20 w-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <Trophy className="h-10 w-10 text-primary animate-pulse" />
                </div>
              ) : (
                <div className="h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                  <Frown className="h-10 w-10 text-muted-foreground" />
                </div>
              )}
            </div>
            
            <CardTitle className="text-2xl">
              {isWin ? 'Victory!' : 'Defeat'}
            </CardTitle>
            
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
          </CardHeader>
          
          <CardContent className="space-y-4">
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">XP Progress</span>
                <span>{xp}/100</span>
              </div>
              <Progress value={xp} className="h-2" />
            </div>
            
            <Button 
              variant="outline" 
              className="w-full"
              onClick={() => setShowStats(!showStats)}
            >
              <BarChart className="h-4 w-4 mr-2" />
              {showStats ? 'Hide Match Stats' : 'View Match Stats'}
            </Button>
            
            {showStats && (
              <div className="space-y-3 bg-muted/50 p-3 rounded-md">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Time to solve</span>
                  <span className="font-mono">{stats.timeToSolve}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Test cases passed</span>
                  <span className="font-mono">{stats.testCasesPassed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Characters typed</span>
                  <span className="font-mono">{stats.characterTyped}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Time complexity</span>
                  <span className="font-mono">{stats.timeComplexity}</span>
                </div>
              </div>
            )}
            
            <div className="flex flex-col gap-2 pt-2">
              <Button 
                className="w-full bg-gradient-to-r from-primary to-secondary hover:opacity-90"
                onClick={() => navigate('/')}
              >
                Find New Match
              </Button>
              <Button 
                variant="outline" 
                className="w-full"
                onClick={() => navigate('/leaderboard')}
              >
                View Leaderboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      {isPremium ? <LandingFooter /> : null}
    </div>
  );
};

export default Results;
