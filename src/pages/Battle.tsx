
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/components/ui/use-toast';
import { Progress } from '@/components/ui/progress';
import { Clock, Zap, RotateCw, Check, X, ShieldAlert, Timer } from 'lucide-react';
import CodeEditor from '@/components/CodeEditor';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

// Sample problem for demo
const sampleProblems = {
  easy: {
    title: "Two Sum",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]" }
    ],
    testCases: [
      { input: [2,7,11,15], target: 9, expected: [0,1] },
      { input: [3,2,4], target: 6, expected: [1,2] },
      { input: [3,3], target: 6, expected: [0,1] }
    ],
    starter: "function twoSum(nums, target) {\n  // Your code here\n}"
  },
  medium: {
    title: "Add Two Numbers",
    description: "You are given two non-empty linked lists representing two non-negative integers. The digits are stored in reverse order, and each of their nodes contains a single digit. Add the two numbers and return the sum as a linked list.",
    examples: [
      { 
        input: "l1 = [2,4,3], l2 = [5,6,4]", 
        output: "[7,0,8]", 
        explanation: "342 + 465 = 807." 
      }
    ],
    testCases: [
      { input: { l1: [2,4,3], l2: [5,6,4] }, expected: [7,0,8] },
      { input: { l1: [0], l2: [0] }, expected: [0] },
      { input: { l1: [9,9,9,9], l2: [9,9,9] }, expected: [8,9,9,0,1] }
    ],
    starter: "function addTwoNumbers(l1, l2) {\n  // Your code here\n}"
  },
  hard: {
    title: "Median of Two Sorted Arrays",
    description: "Given two sorted arrays nums1 and nums2 of size m and n respectively, return the median of the two sorted arrays.",
    examples: [
      { 
        input: "nums1 = [1,3], nums2 = [2]", 
        output: "2.0", 
        explanation: "The merged array would be [1,2,3], and the median is 2." 
      }
    ],
    testCases: [
      { input: { nums1: [1,3], nums2: [2] }, expected: 2.0 },
      { input: { nums1: [1,2], nums2: [3,4] }, expected: 2.5 },
      { input: { nums1: [], nums2: [1] }, expected: 1.0 }
    ],
    starter: "function findMedianSortedArrays(nums1, nums2) {\n  // Your code here\n}"
  }
};

const Battle = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  
  const difficulty = searchParams.get('difficulty') || 'easy';
  const problem = sampleProblems[difficulty];
  
  const [matchFound, setMatchFound] = useState(false);
  const [matchStarted, setMatchStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300); // 5 minutes
  const [playerHealth, setPlayerHealth] = useState(100);
  const [opponentHealth, setOpponentHealth] = useState(100);
  const [playerCode, setPlayerCode] = useState(problem.starter);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [playerPassedTests, setPlayerPassedTests] = useState(0);
  const [powerups, setPowerups] = useState([
    { id: 'freeze', name: 'Time Freeze', icon: <Timer />, active: false, available: true },
    { id: 'spin', name: 'Spin Screen', icon: <RotateCw />, active: false, available: true },
    { id: 'shield', name: 'Block Attack', icon: <ShieldAlert />, active: false, available: true },
  ]);

  // Simulate matchmaking
  useEffect(() => {
    const timer = setTimeout(() => {
      setMatchFound(true);
      toast({
        title: "Opponent found!",
        description: "The battle will begin shortly.",
      });
      
      setTimeout(() => {
        setMatchStarted(true);
      }, 3000);
    }, 2000);
    
    return () => clearTimeout(timer);
  }, [toast]);

  // Countdown timer
  useEffect(() => {
    if (!matchStarted) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 0) {
          clearInterval(timer);
          // Handle time up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [matchStarted]);

  // Simulate opponent progress
  useEffect(() => {
    if (!matchStarted) return;
    
    const progressInterval = setInterval(() => {
      setOpponentProgress(prev => {
        const newProgress = Math.min(prev + Math.random() * 5, 100);
        
        // Simulate passing test cases and damage to player
        if (newProgress >= 30 && prev < 30) {
          setPlayerHealth(h => Math.max(h - 20, 0));
          simulateOpponentMessage("I passed the first test case!");
        }
        
        if (newProgress >= 60 && prev < 60) {
          setPlayerHealth(h => Math.max(h - 20, 0));
          simulateOpponentMessage("Second test case done!");
        }
        
        if (newProgress >= 100 && prev < 100) {
          setPlayerHealth(h => Math.max(h - 20, 0));
          toast({
            title: "Opponent completed the challenge!",
            description: "You lost this round.",
            variant: "destructive"
          });
          
          setTimeout(() => {
            navigate('/results?result=loss');
          }, 3000);
        }
        
        return newProgress;
      });
    }, 3000);
    
    return () => clearInterval(progressInterval);
  }, [matchStarted, navigate, toast]);

  const simulateOpponentMessage = (message) => {
    toast({
      title: "Opponent",
      description: message,
    });
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const runTests = () => {
    // Simulate testing code
    toast({
      title: "Running tests...",
      description: "Evaluating your solution",
    });
    
    setTimeout(() => {
      const passedTests = Math.min(playerPassedTests + 1, 3);
      setPlayerPassedTests(passedTests);
      
      // Update opponent health based on passed tests
      if (passedTests > playerPassedTests) {
        setOpponentHealth(h => Math.max(h - 30, 0));
      }
      
      toast({
        title: passedTests === 3 ? "All tests passed!" : `Passed ${passedTests} of 3 tests`,
        description: passedTests === 3 ? "You've completed the challenge!" : "Keep going!",
        variant: passedTests === 3 ? "default" : "default"
      });
      
      if (passedTests === 3) {
        setTimeout(() => {
          navigate('/results?result=win');
        }, 3000);
      }
    }, 1500);
  };

  const activatePowerup = (powerupId) => {
    setPowerups(prev => prev.map(p => {
      if (p.id === powerupId) {
        if (!p.available) return p;
        
        // Apply powerup effect
        if (powerupId === 'freeze') {
          toast({
            title: "Time Freeze activated!",
            description: "Your opponent's code editor is frozen for 5 seconds.",
          });
        } else if (powerupId === 'spin') {
          toast({
            title: "Spin Screen activated!",
            description: "Your opponent's screen is spinning for 5 seconds.",
          });
        } else if (powerupId === 'shield') {
          toast({
            title: "Shield activated!",
            description: "You're protected from the next attack.",
          });
        }
        
        return { ...p, active: true, available: false };
      }
      return p;
    }));
    
    // Simulate deactivation after 5 seconds
    setTimeout(() => {
      setPowerups(prev => prev.map(p => 
        p.id === powerupId ? { ...p, active: false } : p
      ));
    }, 5000);
  };

  if (!matchFound) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Finding an opponent...</h1>
          <div className="flex justify-center mb-6">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
          <p className="text-muted-foreground">Searching for a {difficulty} level opponent</p>
        </div>
      </div>
    );
  }

  if (!matchStarted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Opponent Found!</h1>
          <p className="text-lg mb-6">Preparing the battle arena...</p>
          <div className="flex justify-center">
            <Progress value={66} className="w-64 h-2" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border py-3 px-4">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="font-bold">{problem.title} <Badge variant="outline">{difficulty}</Badge></h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center">
              <Clock className="h-4 w-4 mr-1 text-muted-foreground" />
              <span className={`font-mono ${timeLeft < 60 ? 'text-destructive' : ''}`}>{formatTime(timeLeft)}</span>
            </div>
            <Button size="sm" variant="outline" onClick={() => navigate('/')}>
              Forfeit
            </Button>
          </div>
        </div>
      </header>
      
      <main className="flex-grow grid grid-cols-1 lg:grid-cols-2 gap-4 p-4">
        <div className="flex flex-col">
          <div className="flex justify-between items-center mb-2">
            <div className="flex items-center gap-2">
              <span className="font-semibold">You</span>
              <div className="health-bar w-48">
                <div 
                  className="health-bar-fill bg-primary" 
                  style={{ width: `${playerHealth}%` }}
                ></div>
              </div>
              <span>{playerHealth}%</span>
            </div>
            <div className="flex gap-2">
              {powerups.map((powerup) => (
                <Button
                  key={powerup.id}
                  variant="ghost"
                  size="icon"
                  className={`powerup-button ${powerup.active ? 'active' : ''} ${!powerup.available ? 'disabled' : ''}`}
                  onClick={() => activatePowerup(powerup.id)}
                  disabled={!powerup.available}
                  title={powerup.name}
                >
                  {powerup.icon}
                </Button>
              ))}
            </div>
          </div>
          
          <CodeEditor
            code={playerCode}
            onChange={setPlayerCode}
            className="flex-grow"
          />
          
          <div className="mt-4 flex gap-2">
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
              <div className="health-bar w-48">
                <div 
                  className="health-bar-fill bg-destructive" 
                  style={{ width: `${opponentHealth}%` }}
                ></div>
              </div>
              <span>{opponentHealth}%</span>
            </div>
            <div>
              <Badge variant="outline" className="bg-muted">
                Progress: {Math.round(opponentProgress)}%
              </Badge>
            </div>
          </div>
          
          <div className="code-editor flex-grow blur-sm relative">
            <div className="absolute inset-0 flex items-center justify-center">
              <p className="text-muted-foreground">Opponent's code is hidden</p>
            </div>
          </div>
          
          <Card className="mt-4">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-2">Problem</h3>
              <p className="text-sm mb-3">{problem.description}</p>
              
              <h4 className="font-semibold text-sm mb-1">Example:</h4>
              <div className="bg-muted rounded p-2 mb-3 text-xs font-mono">
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
