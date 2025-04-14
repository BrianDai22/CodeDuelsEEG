import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { Button } from '@ui/button';
import { useToast } from '@shared/hooks/ui/use-toast';
import { Progress } from '@ui/data/progress';
import { Clock, Check, X, Play, Terminal, Heart, Code, Zap, User, Swords } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@ui/data/card';
import { Badge } from '@ui/data/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/layout/tabs';
import { supabase } from '@shared/config/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { getDatabase, ref, get } from 'firebase/database';
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { Editor } from '@monaco-editor/react';
import * as Monaco from 'monaco-editor';
import { ScrollArea } from '@ui/layout/scroll-area';
import { toast as sonnerToast } from "sonner";

// LeetCode-style problems
const codingProblems = [
  {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'easy',
    description: `Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.
    
You may assume that each input would have exactly one solution, and you may not use the same element twice.

You can return the answer in any order.`,
    examples: [
      {
        input: 'nums = [2,7,11,15], target = 9',
        output: '[0,1]',
        explanation: 'Because nums[0] + nums[1] == 9, we return [0, 1].'
      },
      {
        input: 'nums = [3,2,4], target = 6',
        output: '[1,2]',
        explanation: 'Because nums[1] + nums[2] == 6, we return [1, 2].'
      }
    ],
    testCases: [
      { input: [[2,7,11,15], 9], expected: [0,1] },
      { input: [[3,2,4], 6], expected: [1,2] },
      { input: [[3,3], 6], expected: [0,1] },
      { input: [[1,5,8,3,9,2], 10], expected: [0,4] },
      { input: [[1,2,3,4,5], 9], expected: [3,4] }
    ],
    methodName: 'two_sum',
    starter: `class Solution:
    def two_sum(self, nums, target):
        """
        :type nums: List[int]
        :type target: int
        :rtype: List[int]
        """
        # Write your solution here
        pass`
  },
  {
    id: 'reverse-string',
    title: 'Reverse String',
    difficulty: 'easy',
    description: `Write a function that reverses a string. The input string is given as an array of characters s.

You must do this by modifying the input array in-place with O(1) extra memory.`,
    examples: [
      {
        input: 's = ["h","e","l","l","o"]',
        output: '["o","l","l","e","h"]'
      },
      {
        input: 's = ["H","a","n","n","a","h"]',
        output: '["h","a","n","n","a","H"]'
      }
    ],
    testCases: [
      { input: [["h","e","l","l","o"]], expected: ["o","l","l","e","h"] },
      { input: [["H","a","n","n","a","h"]], expected: ["h","a","n","n","a","H"] },
      { input: [["a"]], expected: ["a"] },
      { input: [["a","b"]], expected: ["b","a"] },
      { input: [["A"," ","m","a","n",","," ","a"," ","p","l","a","n",","," ","a"," ","c","a","n","a","l",":"," ","P","a","n","a","m","a"]], expected: ["a","m","a","n","a","P"," ",":","l","a","n","a","c"," ","a"," ",",","n","a","l","p"," ","a"," ",",","n","a","m"," ","A"] }
    ],
    methodName: 'reverse_string',
    starter: `class Solution:
    def reverse_string(self, s):
        """
        :type s: List[str]
        :rtype: None Do not return anything, modify s in-place instead.
        """
        # Write your solution here
        pass`
  },
  {
    id: 'valid-palindrome',
    title: 'Valid Palindrome',
    difficulty: 'easy',
    description: `A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Alphanumeric characters include letters and numbers.

Given a string s, return true if it is a palindrome, or false otherwise.`,
    examples: [
      {
        input: 's = "A man, a plan, a canal: Panama"',
        output: 'true',
        explanation: '"amanaplanacanalpanama" is a palindrome.'
      },
      {
        input: 's = "race a car"',
        output: 'false',
        explanation: '"raceacar" is not a palindrome.'
      }
    ],
    testCases: [
      { input: ["A man, a plan, a canal: Panama"], expected: true },
      { input: ["race a car"], expected: false },
      { input: [" "], expected: true },
      { input: ["Madam, I'm Adam."], expected: true },
      { input: ["1a2"], expected: false }
    ],
    methodName: 'is_palindrome',
    starter: `class Solution:
    def is_palindrome(self, s):
        """
        :type s: str
        :rtype: bool
        """
        # Write your solution here
        pass`
  }
];

// Health constants
const MAX_HEALTH = 100;
const DAMAGE_PER_PROBLEM = 34; // Adjusted slightly for 3 problems

interface TestResult {
  passed: boolean;
  input: any;
  expectedOutput: any;
  actualOutput: any;
  error?: string | null;
}

// Define initial Python code template structure
const getInitialCode = (problemId: string): string => {
  switch (problemId) {
    case 'two-sum':
      return `class Solution:
    def twoSum(self, nums, target):
        """
        :type nums: List[int]
        :type target: int
        :rtype: List[int]
        """
        # Write your solution here
        pass`;
    case 'reverse-string':
      return `class Solution:
    def reverseString(self, s):
        """
        :type s: List[str]
        :rtype: None Do not return anything, modify s in-place instead.
        """
        # Write your solution here
        pass`;
    case 'valid-palindrome':
      return `class Solution:
    def isPalindrome(self, s):
        """
        :type s: str
        :rtype: bool
        """
        # Write your solution here
        pass`;
    default:
      return '# Select a problem to start coding';
  }
};

const Battle: React.FC = () => {
  const navigate = useNavigate();
  const { lobbyCode } = useParams<{ lobbyCode: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  
  // Supabase realtime channel
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  
  // Player info
  const [isHost, setIsHost] = useState(false);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [opponentUsername, setOpponentUsername] = useState<string>('Opponent');
  
  // Battle state
  const [matchStarted, setMatchStarted] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600); // 10 minutes
  const [playerHealth, setPlayerHealth] = useState(MAX_HEALTH);
  const [opponentHealth, setOpponentHealth] = useState(MAX_HEALTH);
  
  // Problem and code state
  const [problems] = useState(codingProblems);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [playerCodes, setPlayerCodes] = useState<Record<string, string>>({});
  const [playerTestResults, setPlayerTestResults] = useState<Record<string, TestResult[]>>({});
  const [isRunningCode, setIsRunningCode] = useState(false);
  const [completedProblems, setCompletedProblems] = useState<string[]>([]);
  const [opponentCompletedProblems, setOpponentCompletedProblems] = useState<string[]>([]);
  
  // Terminal output
  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const terminalRef = useRef<HTMLPreElement>(null);
  const testResultsRef = useRef<HTMLDivElement>(null);

  // Current problem
  const currentProblem = problems[currentProblemIndex];

  // Add refs for Monaco editor
  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const cursorPosition = useRef<Monaco.Position | null>(null);

  // Load initial code when problem changes or loads
  useEffect(() => {
    if (currentProblem && !playerCodes[currentProblem.id]) {
      setPlayerCodes(prev => ({
        ...prev,
        [currentProblem.id]: getInitialCode(currentProblem.id)
      }));
    }
  }, [currentProblem, playerCodes]);

  // Fetch lobby details and set up realtime connection
  useEffect(() => {
    if (!lobbyCode || !user?.uid) {
      toast({ title: "Error", description: "Missing lobby code or user information.", variant: "destructive" });
      navigate('/find-match');
      return;
    }

    let isMounted = true;
    const db = getDatabase();

    const fetchUsername = async (userId: string): Promise<string> => {
      if (!userId) return 'Opponent';
      try {
        const userRef = ref(db, `users/${userId}/profile/username`);
        const snapshot = await get(userRef);
        if (snapshot.exists()) {
          return snapshot.val() || `Opponent (${userId.substring(0, 6)})`; // Ensure fallback if val is empty
        } else {
          console.warn(`Username not found for ${userId}`);
          return `Opponent (${userId.substring(0, 6)})`;
        }
      } catch (error: any) {
        console.error(`Error fetching username for ${userId}: ${error.message}`);
        return `Opponent (${userId.substring(0, 6)})`; 
      }
    };

    const initializeBattle = async () => {
      try {
        console.log("Initializing battle for lobby:", lobbyCode);
        const { data: lobbyData, error } = await supabase.from('lobbies').select('*').eq('code', lobbyCode).maybeSingle();
        
        if (!isMounted) return;
        if (error) throw error;
        if (!lobbyData) throw new Error("Lobby not found");
        
        console.log("Lobby data fetched:", lobbyData);

        // Allow both 'starting' and 'active' states
        if (lobbyData.status !== 'starting' && lobbyData.status !== 'active') {
          console.error("Invalid lobby status:", lobbyData.status);
          throw new Error("Lobby is not ready or has ended");
        }

        const playerIsHost = lobbyData.host_id === user.uid;
        const hostId = lobbyData.host_id;
        const oppId = playerIsHost ? lobbyData.opponent_id : hostId;
        
        if (!hostId || !oppId) {
          console.error("Missing player IDs:", { hostId, oppId });
          throw new Error("Lobby data is missing host or opponent ID");
        }

        console.log("Setting up battle state:", { playerIsHost, hostId, oppId });
        
        setIsHost(playerIsHost);
        setOpponentId(oppId);
        
        try {
          const opponentActualUsername = await fetchUsername(oppId);
          setOpponentUsername(opponentActualUsername);
        } catch (error) {
          console.warn("Failed to fetch opponent username:", error);
          setOpponentUsername('Opponent');
        }

        // Initialize test results
        const initialTestResults: Record<string, TestResult[]> = {};
        problems.forEach(p => { initialTestResults[p.id] = []; });
        setPlayerTestResults(initialTestResults);

        // Set up battle channel
        const battleChannel = supabase.channel(`battle:${lobbyCode}`)
          .on('broadcast', { event: 'problem_solved' }, ({ payload }) => {
            if (!isMounted || payload.senderId === user.uid) return;
            console.log('Received problem_solved event:', payload);
            setOpponentCompletedProblems(prev => {
              const updated = [...new Set([...prev, payload.problemId])];
              const newHealth = Math.max(playerHealth - DAMAGE_PER_PROBLEM, 0);
              setPlayerHealth(newHealth);
              return updated;
            });
            sonnerToast.error(`${opponentUsername} Solved a Problem!`, {
              description: `Your health decreased by ${DAMAGE_PER_PROBLEM}%`,
            });
          })
          .on('broadcast', { event: 'game_over' }, ({ payload }) => {
            if (!isMounted) return;
            console.log('Received game_over event:', payload);
            handleGameEnd(payload.winnerId);
          })
          .subscribe((status) => {
            console.log(`Battle channel status: ${status}`);
            if (status === 'SUBSCRIBED') {
              console.log('Successfully subscribed to battle channel');
      setMatchStarted(true);
            }
          });

        if (!isMounted) return;
        setChannel(battleChannel);

        // Update lobby status to active if we're the host and it's still in starting state
        if (playerIsHost && lobbyData.status === 'starting') {
          console.log("Host updating lobby status to active");
          const { error: updateError } = await supabase
            .from('lobbies')
            .update({ status: 'active' })
            .eq('code', lobbyCode);

          if (updateError) {
            console.error("Error updating lobby status:", updateError);
          } else {
            console.log("Lobby status updated to active");
          }
        }

      } catch (error: any) {
        if (!isMounted) return;
        console.error("Error initializing battle:", error);
        toast({ 
          title: "Error Loading Battle", 
          description: error.message || "Failed to load battle details.", 
          variant: "destructive" 
        });
        navigate('/find-match');
      }
    };

    console.log("Starting battle initialization");
    initializeBattle();

    return () => {
      console.log("Cleaning up battle component");
      isMounted = false;
      if (channel) {
        console.log("Removing battle channel");
        supabase.removeChannel(channel)
          .then(() => console.log("Battle channel removed"))
          .catch(err => console.error("Error removing channel:", err));
        setChannel(null);
      }
    };
  }, [lobbyCode, user?.uid, navigate, toast, playerHealth]);

  // Timer countdown
  useEffect(() => {
    if (!matchStarted || matchEnded) return;
    
    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          handleGameEnd(undefined); // Time's up
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    return () => clearInterval(timer);
  }, [matchStarted, matchEnded]);

  // Move handleGameEnd definition before the useEffect that uses it
  const handleGameEnd = useCallback((winnerId: string | null | undefined) => {
    if (matchEnded) return;
    console.log(`Game end triggered. Winner ID: ${winnerId}, User ID: ${user?.uid}`);
    setMatchEnded(true);
    const isWinner = winnerId === user?.uid;
    setWinner(winnerId); // Set winner state for the end screen
    
    sonnerToast(isWinner ? "Victory!" : "Defeat!", {
      description: isWinner ? "You solved 3 problems!" : (winnerId ? `${opponentUsername || 'Opponent'} won.` : "Match ended."),
      action: { label: "Back to Arena", onClick: () => navigate('/arena') },
      duration: Infinity, // Keep until closed
    });

    if (channel) {
      console.log("Leaving Supabase battle channel");
      supabase.removeChannel(channel).catch(err => console.error("Error removing channel:", err));
      setChannel(null);
    }
  }, [matchEnded, user?.uid, opponentUsername, channel, navigate]);

  // Update win condition check to require all test cases passed for each completed problem
  useEffect(() => {
    if (matchEnded || !matchStarted || !user || !opponentId) return;

    // Check if player has completed all test cases for 3 problems
    const hasCompletedAllTestCases = completedProblems.length >= 3 && 
      completedProblems.every(problemId => {
        const results = playerTestResults[problemId] || [];
        return results.length > 0 && results.every(r => r.passed);
      });

    // Player wins by completing all test cases for 3 problems
    if (hasCompletedAllTestCases) {
      console.log("Player completed all test cases for 3 problems. Ending game.");
      handleGameEnd(user.uid);
      return;
    }

    // Opponent wins by completing 3 problems
    if (opponentCompletedProblems.length >= 3) {
      console.log("Opponent completed 3 problems. Ending game.");
      handleGameEnd(opponentId);
      return;
    }

    // Keep health-based win conditions as backup
    if (playerHealth <= 0) {
      console.log("Player health reached 0. Ending game.");
      handleGameEnd(opponentId);
      return;
    }
    if (opponentHealth <= 0) {
      console.log("Opponent health reached 0. Ending game.");
      handleGameEnd(user.uid);
      return;
    }
  }, [
    playerHealth,
    opponentHealth,
    completedProblems,
    opponentCompletedProblems,
    playerTestResults,
    matchStarted,
    matchEnded,
    user?.uid,
    opponentId,
    handleGameEnd
  ]);

  // Format time as mm:ss
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // Update code for current problem
  const updateCurrentCode = (code: string) => {
    if (currentProblem) {
      setPlayerCodes(prev => ({
        ...prev,
        [currentProblem.id]: code,
      }));
    }
  };

  // Wrap runCode in useCallback and modify signature
  const runCode = async () => {
    setIsRunningCode(true);
    setTerminalOutput('Running code...\n');
    
    try {
      const sourceCode = playerCodes[currentProblem.id] || getInitialCode(currentProblem.id);
      
      // Run each test case
      const results = await Promise.all(currentProblem.testCases.map(async (testCase, index) => {
        // Format the test code
        const testCodeSetup = `
class Solution:
${sourceCode.split('class Solution:')[1].replace(/^/gm, '    ')}

# Create test instance and run
solution = Solution()
result = solution.${currentProblem.methodName}(${testCase.input.map(arg => JSON.stringify(arg)).join(', ')})
print(repr(result))
`;

        console.log('Executing test case:', index + 1);
        console.log('Test code:', testCodeSetup);

        const { data, error } = await supabase.functions.invoke('execute-code', {
          body: JSON.stringify({
            code: testCodeSetup,
            language: "python"
          })
        });

        if (error) {
          console.error('Error from edge function:', error);
          throw error;
        }

        if (!data) {
          throw new Error('No response received from code execution');
        }

        console.log('Raw response from execution:', data);

        // Parse the output and error
        const stdout = data.stdout?.trim() || '';
        const stderr = data.stderr?.trim() || '';
        const error_output = stderr || data.error || '';

        let parsedOutput;
        try {
          // Try to evaluate the output as a Python literal
          parsedOutput = stdout ? eval('(' + stdout + ')') : null;
        } catch (e) {
          parsedOutput = stdout;
        }

        // Compare with expected output
        const expectedOutput = testCase.expected;
        const passed = JSON.stringify(parsedOutput) === JSON.stringify(expectedOutput);

        return {
          passed,
          input: testCase.input,
          expectedOutput: expectedOutput,
          actualOutput: parsedOutput,
          error: error_output || null
        };
      }));

      // Update test results
      setPlayerTestResults(prev => ({
        ...prev,
        [currentProblem.id]: results
      }));

      // Calculate summary
      const passedCount = results.filter(r => r.passed).length;
      const totalCount = results.length;
      const allPassed = passedCount === totalCount;

      // Update terminal output with summary
      setTerminalOutput(prev => `${prev}\n${'-'.repeat(40)}\nTest Results:\n${passedCount}/${totalCount} test cases passed\n\n${
        results.map((result, i) => 
          `Test Case ${i + 1}: ${result.passed ? '✅ Passed' : '❌ Failed'}\n` +
          `Input: ${JSON.stringify(result.input)}\n` +
          `Expected: ${JSON.stringify(result.expectedOutput)}\n` +
          `Actual: ${JSON.stringify(result.actualOutput)}\n` +
          (result.error ? `Error: ${result.error}\n` : '') +
          '-'.repeat(20)
        ).join('\n')
      }`);

      // Handle completion if all tests pass
      if (allPassed && !completedProblems.includes(currentProblem.id)) {
        setCompletedProblems(prev => {
          const updated = [...new Set([...prev, currentProblem.id])];
          const newOpponentHealth = Math.max(opponentHealth - DAMAGE_PER_PROBLEM, 0);
          setOpponentHealth(newOpponentHealth);
          
          // Broadcast the solve event
          if (channel) {
            channel.send({
              type: 'broadcast',
              event: 'problem_solved',
              payload: { problemId: currentProblem.id, senderId: user?.uid }
            });
          }

          sonnerToast.success("Problem Solved!", {
            description: `You dealt ${DAMAGE_PER_PROBLEM}% damage to your opponent!`,
          });

          return updated;
        });
      }

    } catch (err: any) {
      console.error('Error running code:', err);
      setTerminalOutput(prev => `${prev}\nError executing code: ${err.message}\n\nPlease check your code for syntax errors.`);
    } finally {
      setIsRunningCode(false);
    }
  };

  // Editor lifecycle
  useEffect(() => {
    if (!monacoRef.current) return;
    
    const model = monacoRef.current.editor.createModel(
      playerCodes[currentProblem.id] || getInitialCode(currentProblem.id),
      'python'
    );

    if (editorRef.current) {
      editorRef.current.setModel(model);
      // Restore cursor position if we have it saved
      if (cursorPosition.current) {
        editorRef.current.setPosition(cursorPosition.current);
        editorRef.current.revealPositionInCenter(cursorPosition.current);
      }
    }

    return () => {
      model.dispose();
    };
  }, [currentProblem.id, monacoRef.current]);

  const handleEditorDidMount = (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;
    
    // Set initial options
    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      theme: 'vs-dark',
    });

    // Add keyboard shortcut for Cmd/Ctrl + Enter
    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      void runCode();
    });

    // Save cursor position on change
    editor.onDidChangeCursorPosition(e => {
      cursorPosition.current = e.position;
    });

    // Handle content changes
    editor.onDidChangeModelContent(() => {
      if (currentProblem?.id) {
        const newCode = editor.getValue();
        setPlayerCodes(prev => ({
          ...prev,
          [currentProblem.id]: newCode
        }));
      }
    });
  };

  // Loading screen
  if (!matchStarted && !matchEnded) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/40">
        <div className="flex items-center space-x-4 mb-6">
           <Swords className="h-10 w-10 animate-pulse text-primary" />
           <h1 className="text-3xl font-bold">Preparing Battle</h1>
        </div>
        <Progress value={undefined} className="w-64 h-3" />
        <p className="mt-4 text-muted-foreground">Connecting and loading problems...</p>
      </div>
    );
  }

  // Game end screen
  if (matchEnded) {
    let endTitle = "";
    let endMessage = "";
    let endColor = "text-yellow-500"; // Default to draw/ended
    if (winner === user?.uid) { endTitle = "Victory!"; endMessage = "You solved 3 problems first!"; endColor = "text-green-500"; }
    else if (winner === opponentId) { endTitle = "Defeat!"; endMessage = `${opponentUsername} won the match.`; endColor = "text-red-500"; }
    else { endTitle = "Match Over"; endMessage = "The match has concluded."; } // Handle draw or unknown end state

    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background to-muted/40 p-4">
        <h1 className={`text-6xl font-bold mb-4 ${endColor}`}>{endTitle}</h1>
        <p className="text-xl text-center mb-8 text-muted-foreground">{endMessage}</p>
        <Button onClick={() => navigate('/arena')} size="lg">
           Back to Arena
        </Button>
      </div>
    );
  }

  // Main Battle UI
  return (
    <div className="flex flex-col h-screen bg-background text-foreground p-2 gap-2">
      {/* Top Bar */}
      <div className="flex items-center justify-between border rounded-lg p-2 bg-card">
        <div className="flex items-center gap-4">
           <Badge variant="outline" className="flex items-center gap-2 px-3 py-1.5">
              <Clock className="h-4 w-4" /> 
              <span className="font-mono text-lg font-semibold">{formatTime(timeLeft)}</span>
           </Badge>
           <div className="text-sm text-muted-foreground">
             Solve 3 problems to win!
           </div>
        </div>
        <div className="flex items-center gap-6">
           {/* Opponent */}
           <div className="flex flex-col items-end">
              <div className="flex items-center gap-2">
                 <span className="text-sm font-medium text-muted-foreground">{opponentUsername} ({opponentCompletedProblems.length}/3)</span>
                 <User className="h-4 w-4 text-red-500"/>
              </div>
              <Progress value={opponentHealth} className="w-40 h-2 mt-1 bg-red-500/20 [&>*]:bg-red-500" />
           </div>
           <Swords className="h-6 w-6 text-muted-foreground"/>
           {/* Player */}
           <div className="flex flex-col items-start">
            <div className="flex items-center gap-2">
                 <User className="h-4 w-4 text-blue-500"/>
                 <span className="text-sm font-medium text-muted-foreground">You ({completedProblems.length}/3)</span>
              </div>
              <Progress value={playerHealth} className="w-40 h-2 mt-1 bg-blue-500/20 [&>*]:bg-blue-500" />
           </div>
            </div>
          </div>
          
      {/* Main Content Area (3 Columns) */}
      <div className="flex-1 flex gap-2 overflow-hidden">
        {/* Left Column: Problems */} 
        <Card className="w-1/3 flex flex-col overflow-hidden">
          <CardHeader className="p-3 border-b">
             <CardTitle className="text-lg">Problems</CardTitle>
          </CardHeader>
          <Tabs 
             value={String(currentProblemIndex)} 
             onValueChange={(value) => setCurrentProblemIndex(parseInt(value))}
             className="flex-1 flex flex-col overflow-hidden"
          >
            <TabsList className="m-1">
              {problems.map((problem, index) => {
                const isCompleted = completedProblems.includes(problem.id);
                const isOpponentCompleted = opponentCompletedProblems.includes(problem.id);
                return (
                  <TabsTrigger 
                    key={problem.id} 
                    value={String(index)}
                    className={`relative flex-1 data-[state=active]:bg-primary/10 data-[state=active]:text-primary ${isCompleted ? 'text-green-500' : isOpponentCompleted ? 'text-red-500' : ''}`}
                  >
                    {problem.title}
                    {isCompleted && <Check className="ml-1 h-4 w-4 absolute right-1 top-1 text-green-600" />}
                    {!isCompleted && isOpponentCompleted && <X className="ml-1 h-4 w-4 absolute right-1 top-1 text-red-600" />}
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <ScrollArea className="flex-1 p-3">
               {currentProblem && (
                  <div className="space-y-4">
                     <div className="flex justify-between items-center">
                        <h2 className="text-xl font-semibold">{currentProblem.title}</h2>
                        <Badge variant={currentProblem.difficulty === 'easy' ? 'success' : currentProblem.difficulty === 'medium' ? 'warning' : 'destructive'}>
                          {currentProblem.difficulty}
                        </Badge>
                     </div>
                     <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                       {currentProblem.description}
                     </p>
                     <div>
                       <h3 className="text-md font-semibold mb-2">Examples:</h3>
                       {currentProblem.examples.map((ex, index) => (
                         <pre key={index} className="bg-muted/50 p-3 rounded text-xs mb-2 whitespace-pre-wrap font-mono border">
                           {`Example ${index + 1}:\nInput: ${ex.input}\nOutput: ${ex.output}`}
                           {ex.explanation ? `\nExplanation: ${ex.explanation}` : ''}
                         </pre>
                       ))}
          </div>
        </div>
               )}
            </ScrollArea>
          </Tabs>
        </Card>

        {/* Center Column: Editor */}
        <Card className="flex-1 flex flex-col overflow-hidden">
          <CardHeader className="p-3 border-b flex flex-row items-center justify-between">
             <CardTitle className="text-lg flex items-center gap-2">
               <Code className="h-5 w-5"/> Solution Code
             </CardTitle>
            <div className="flex items-center gap-2">
               <span className="text-xs text-muted-foreground">Language: Python</span>
               <Button 
                 size="sm" 
                 onClick={runCode}
                 disabled={isRunningCode}
                 className="flex items-center gap-1"
               >
                 {isRunningCode ? (
                   <>
                     <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                     Running...
                   </>
                 ) : (
                   <>
                     <Play className="h-4 w-4" />
                     Run Code
                   </>
                 )}
               </Button>
             </div>
          </CardHeader>
           <div className="flex-1 overflow-hidden p-1">
             {currentProblem ? (
                <div className="h-full w-full">
                  <Editor
                    height="100%"
                    defaultLanguage="python"
                    defaultValue={playerCodes[currentProblem.id] || getInitialCode(currentProblem.id)}
                    onMount={handleEditorDidMount}
                    options={{
                      automaticLayout: true,
                      scrollBeyondLastLine: false,
                      minimap: { enabled: false },
                      fontSize: 14,
                      lineNumbers: 'on',
                      roundedSelection: false,
                      readOnly: false,
                      theme: 'vs-dark',
                    }}
                  />
              </div>
              ) : (
                <div className="flex items-center justify-center h-full text-muted-foreground">
                  Select a problem.
            </div>
              )}
          </div>
        </Card>

        {/* Right Column: Output */} 
        <Card className="w-1/3 flex flex-col overflow-hidden">
          <CardHeader className="p-3 border-b">
             <CardTitle className="text-lg">Output</CardTitle>
          </CardHeader>
          <Allotment vertical defaultSizes={[40, 60]}>
             <Allotment.Pane minSize={100}> 
               <div className="h-full flex flex-col">
                  <div className="px-3 py-1 bg-muted/50 border-b text-sm font-medium flex items-center justify-between">
                    <span><Terminal className="h-4 w-4 inline-block mr-1"/> Terminal</span>
                    <Button 
                       variant="ghost" 
                       size="sm"
                       onClick={() => setTerminalOutput('')} 
                       disabled={!terminalOutput}
                       className="h-6 px-2"
                    >Clear</Button>
                  </div>
                   <ScrollArea className="flex-1 p-2">
                      <pre 
                        ref={terminalRef}
                        className="font-mono text-xs whitespace-pre-wrap break-words"
                      >
                        {terminalOutput || 'Run code (Cmd/Ctrl+Enter) to see summary...'}
                      </pre>
                   </ScrollArea>
               </div>
             </Allotment.Pane>
             <Allotment.Pane minSize={150}>
               <div className="h-full flex flex-col">
                 <div className="px-3 py-1 bg-muted/50 border-b text-sm font-medium">
                    <Zap className="h-4 w-4 inline-block mr-1"/> Test Results
            </div>
                  <ScrollArea className="flex-1 p-2 space-y-2">
                     {isRunningCode && (
                        <div className="flex items-center justify-center h-full">
                           <p className="text-sm text-muted-foreground animate-pulse">Running tests...</p>
          </div>
                     )} 
                     {!isRunningCode && currentProblem && playerTestResults[currentProblem.id]?.length > 0 ? (
                         <>
                           <div className="mb-3 p-2 bg-muted/30 rounded-lg">
                             <p className="text-sm font-medium">
                               Test Results Summary: {playerTestResults[currentProblem.id].filter(r => r.passed).length}/{playerTestResults[currentProblem.id].length} Passed
                             </p>
                             {completedProblems.includes(currentProblem.id) && (
                               <p className="text-xs text-green-500 mt-1">✓ Problem Completed!</p>
                )}
              </div>
                           {playerTestResults[currentProblem.id].map((result, index) => (
                             <Card key={index} className={`border-l-4 ${result.passed ? 'border-green-500' : 'border-red-500'} overflow-hidden`}>
                               <CardHeader className="p-2">
                                 <CardTitle className={`text-sm font-medium flex items-center gap-1 ${result.passed ? 'text-green-600' : 'text-red-600'}`}>
                                   {result.passed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                   Test Case {index + 1}: {result.passed ? 'Passed' : 'Failed'}
                                 </CardTitle>
                               </CardHeader>
                               {!result.passed && (
                                 <CardContent className="p-2 pt-0 text-xs bg-muted/30">
                                   <p><span className="font-semibold">Input:</span> {JSON.stringify(result.input)}</p>
                                   <p><span className="font-semibold">Expected:</span> {JSON.stringify(result.expectedOutput)}</p>
                                   <p><span className="font-semibold">Actual:</span> {JSON.stringify(result.actualOutput)}</p>
                                   {result.error && <p><span className="font-semibold">Error:</span> {result.error}</p>}
            </CardContent>
                               )}
                             </Card>
                           ))}
                         </>
                      ) : (
                        !isRunningCode && <p className="text-sm text-muted-foreground p-4 text-center">Run code to see test results here.</p>
                      )}
                  </ScrollArea>
               </div>
            </Allotment.Pane>
          </Allotment>
          </Card>
        </div>
    </div>
  );
};

export default Battle;
