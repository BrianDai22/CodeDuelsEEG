import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { Clock, Check, ShieldAlert, Timer, Shield, Crown } from 'lucide-react';
import CodeEditor from '@/components/CodeEditor';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAdmin } from '@/contexts/AdminContext';
import { useAuth } from '@/contexts/AuthContext';
import LandingHeader from '@/components/LandingHeader';
import PremiumHeader from '@/components/PremiumHeader';
import LandingFooter from '@/components/LandingFooter';

// Sample problem for demo
const sampleProblems = {
  easy: {
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." }
    ],
    testCases: [
      { input: [2,7,11,15], target: 9, expected: [0,1] },
      { input: [3,2,4], target: 6, expected: [1,2] }
    ],
    starter: "function twoSum(nums, target) {\n  // Your code here\n}"
  }
};

const Battle = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const { isAdmin } = useAdmin();
  const { isAuthenticated } = useAuth();
  
  const difficulty = searchParams.get('difficulty') || 'easy';
  const problem = sampleProblems[difficulty];
  
  const [matchStarted, setMatchStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [opponentHealth, setOpponentHealth] = useState(100);
  const [playerCode, setPlayerCode] = useState(problem.starter);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [playerPassedTests, setPlayerPassedTests] = useState(0);
  const [isPremium, setIsPremium] = useState(() => {
    // Initialize from localStorage
    const userProfile = localStorage.getItem('userProfile');
    if (userProfile) {
      const profile = JSON.parse(userProfile);
      return profile.isPremium || isAdmin;
    }
    return false;
  });

  useEffect(() => {
    const timer = setTimeout(() => {
      setMatchStarted(true);
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!matchStarted) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [matchStarted]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const runTests = () => {
    toast({
      title: "Running tests...",
      description: "Evaluating your solution",
    });
    
    setTimeout(() => {
      const passedTests = Math.min(playerPassedTests + 1, 3);
      setPlayerPassedTests(passedTests);
      setOpponentHealth(h => Math.max(h - 30, 0));
      
      if (passedTests === 3) {
        setTimeout(() => navigate('/results?result=win'), 1000);
      }
    }, 1000);
  };

  if (!matchStarted) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Progress value={66} className="w-64 h-2" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      {isPremium ? <PremiumHeader /> : <LandingHeader />}
      
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">You</span>
              <div className="w-48 h-2 bg-muted rounded-full">
                <div className="h-full bg-primary rounded-full" style={{ width: `${playerHealth}%` }}></div>
              </div>
              <span>{playerHealth}%</span>
            </div>
          </div>
          
          <CodeEditor
            code={playerCode}
            onChange={setPlayerCode}
            className="flex-grow"
          />
          
          <div className="mt-4">
            <Button onClick={runTests} className="gap-2">
              <Check className="h-4 w-4" />
              Run Tests ({playerPassedTests}/3)
            </Button>
          </div>
        </div>
        
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">Opponent</span>
              <div className="w-48 h-2 bg-muted rounded-full">
                <div className="h-full bg-destructive rounded-full" style={{ width: `${opponentHealth}%` }}></div>
              </div>
              <span>{opponentHealth}%</span>
            </div>
            <Badge variant="outline">Progress: {Math.round(opponentProgress)}%</Badge>
          </div>
          
          <div className="flex-grow blur-sm relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">Opponent's code is hidden</p>
            </div>
          </div>
          
          <Card className="mt-4">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Problem</h3>
              <p className="text-sm mb-3">{problem.description}</p>
              
              <h4 className="font-semibold text-sm mb-1">Example:</h4>
              <div className="bg-muted rounded p-2 text-xs font-mono">
                <div><span className="text-muted-foreground">Input:</span> {problem.examples[0].input}</div>
                <div><span className="text-muted-foreground">Output:</span> {problem.examples[0].output}</div>
                {problem.examples[0].explanation && (
                  <div><span className="text-muted-foreground">Explanation:</span> {problem.examples[0].explanation}</div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default Battle;
