
import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Trophy, Flame, ArrowUpRight, Frown, BarChart } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';

const Results = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const result = searchParams.get('result') || 'win'; // Default to win for demo
  const isWin = result === 'win';
  
  const [xp, setXp] = useState(0);
  const [rank, setRank] = useState('Bronze II');
  const [showStats, setShowStats] = useState(false);
  
  // Simulated match stats
  const stats = {
    timeToSolve: '3:45',
    testCasesPassed: isWin ? '3/3' : '1/3',
    characterTyped: 245,
    timeFrozen: isWin ? '5s' : '0s',
    timeComplexity: isWin ? 'O(n)' : 'O(n²)',
  };
  
  useEffect(() => {
    // Animate XP gain
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setXp(prev => {
          const target = isWin ? 85 : 25;
          if (prev >= target) {
            clearInterval(interval);
            return target;
          }
          return prev + 1;
        });
      }, 30);
      
      return () => clearInterval(interval);
    }, 1000);
    
    // Show toast message
    toast({
      title: isWin ? "Victory!" : "Defeat!",
      description: isWin 
        ? "You've won the coding duel!" 
        : "Better luck next time!",
    });
    
    return () => clearTimeout(timer);
  }, [isWin, toast]);
  
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-gradient-to-b from-background to-background/90">
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
        </CardHeader>
        
        <CardContent className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Current Rank</span>
            <div className="flex items-center gap-2">
              <span className="font-semibold">{rank}</span>
              {isWin && <ArrowUpRight className="h-4 w-4 text-green-500" />}
            </div>
          </div>
          
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">XP Progress</span>
              <span>{xp}/100</span>
            </div>
            <Progress value={xp} className="h-2" />
          </div>
          
          <Button 
            variant="outline" 
            className="w-full flex items-center gap-2 justify-center"
            onClick={() => setShowStats(!showStats)}
          >
            <BarChart className="h-4 w-4" />
            {showStats ? 'Hide Match Stats' : 'View Match Stats'}
          </Button>
          
          {showStats && (
            <div className="mt-4 space-y-3 bg-muted/50 p-3 rounded-md">
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
                <span className="text-sm text-muted-foreground">Time frozen</span>
                <span className="font-mono">{stats.timeFrozen}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Time complexity</span>
                <span className="font-mono">{stats.timeComplexity}</span>
              </div>
            </div>
          )}
        </CardContent>
        
        <CardFooter className="flex flex-col space-y-2">
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
        </CardFooter>
      </Card>
    </div>
  );
};

export default Results;
