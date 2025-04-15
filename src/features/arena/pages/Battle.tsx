import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { Button } from '@ui/button';
import { useToast } from '@shared/hooks/ui/use-toast';
import { Clock, Play, Terminal, Code, User, Swords, Check, X, ChevronDown, ChevronUp, TimerIcon } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@ui/data/card';
import { supabase } from '@shared/config/supabase';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Allotment } from "allotment";
import "allotment/dist/style.css";
import { Editor } from '@monaco-editor/react';
import * as Monaco from 'monaco-editor';
import { ScrollArea } from '@ui/layout/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@ui/layout/tabs';
import { Badge } from '@ui/data/badge';
import { Progress } from '@ui/data/progress';
import { Avatar, AvatarFallback, AvatarImage } from '@ui/data/avatar';
import { toast as sonnerToast } from "sonner";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Add missing type definitions and constants
interface Problem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  starterCode: string;
  methodName?: string;
  examples: { input: string; output: string; explanation?: string }[];
  testCases: TestCase[];
  languages?: Record<string, string>;
}

interface TestCase {
  input: any;
  expected: any;
}

interface TestResult {
  passed: boolean;
  input: any;
  expected: any;
  actual: any;
  message: string;
  time?: number;
  memory?: number;
  error?: string | null;
}

const MAX_HEALTH = 100;

// Define coding problems
const codingProblems: Problem[] = [];

// --- Helper Function --- Ensure this exists
const getInitialCode = (problemId: string): string => {
  return codingProblems.find(p => p.id === problemId)?.starterCode || '';
};

// --- Custom Comparison Logic (Improved) ---
const areOutputsEqual = (expected: any, actual: any): boolean => {
  console.log(`Comparing: Expected=${JSON.stringify(expected)} (${typeof expected}), Actual=${JSON.stringify(actual)} (${typeof actual})`);

  // Strict equality for null/undefined first
  if (expected === null && actual === null) return true;
  if (expected === undefined && actual === undefined) return true;
  if (expected === null || expected === undefined || actual === null || actual === undefined) {
    return false;
  }

  // Handle booleans explicitly (Python output is 'True'/'False')
  if (typeof expected === 'boolean') {
    if (typeof actual === 'boolean') return expected === actual;
    if (typeof actual === 'string') {
      if (expected && actual.toLowerCase() === 'true') return true;
      if (!expected && actual.toLowerCase() === 'false') return true;
    }
    return false;
  }

  // Handle numbers (Python output might be string representation)
  if (typeof expected === 'number') {
    if (typeof actual === 'number') return expected === actual;
    // Allow comparison if the string representation matches the number
    if (typeof actual === 'string' && String(expected) === actual) return true;
    // Try parsing the string actual as a number
    if (typeof actual === 'string') {
        try {
            const parsedActual = parseFloat(actual);
            if (!isNaN(parsedActual) && expected === parsedActual) return true;
        } catch {}
    }
    return false;
  }

  // Handle string comparisons (trim whitespace)
  if (typeof expected === 'string') {
     if (typeof actual !== 'string') return false;
     return expected.trim() === actual.trim();
  }

  // Handle arrays (compare elements after sorting simple types)
  if (Array.isArray(expected)) {
    if (!Array.isArray(actual)) return false;
    if (expected.length !== actual.length) return false;

    // Create copies to avoid modifying original data
    const arr1 = [...expected];
    const arr2 = [...actual];

    // Attempt to sort if elements are primitives (string, number)
    try {
        const sortedArr1 = arr1.sort();
        const sortedArr2 = arr2.sort();
        // Recursively compare each element
        for (let i = 0; i < sortedArr1.length; i++) {
            if (!areOutputsEqual(sortedArr1[i], sortedArr2[i])) {
                console.log(`Array element mismatch at index ${i}: Expected=${sortedArr1[i]}, Actual=${sortedArr2[i]}`);
                return false;
            }
        }
        return true;
    } catch (e) {
        console.warn("Failed to sort arrays for comparison, falling back to stringify", e);
        // Fallback for complex/unsortable arrays: stringify comparison
        return JSON.stringify(arr1) === JSON.stringify(arr2);
    }
  }

  // Fallback for other types (objects, etc.) using stringify
  try {
    return JSON.stringify(expected) === JSON.stringify(actual);
  } catch (e) {
    console.error("Comparison failed with stringify:", e);
    return false;
  }
};

// Get proper monaco editor language ID
const getMonacoLanguage = (language: string): string => {
  switch (language.toLowerCase()) {
    case 'python':
      return 'python';
    case 'typescript':
      return 'typescript';
    case 'javascript':
    default:
      return 'javascript';
  }
};

// Get file extension for language
const getFileExtension = (language: string): string => {
  switch (language.toLowerCase()) {
    case 'python':
      return '.py';
    case 'typescript':
      return '.ts';
    case 'javascript':
    default:
      return '.js';
  }
};

const Battle: React.FC = () => {
  const navigate = useNavigate();
  const { lobbyCode } = useParams<{ lobbyCode: string }>();
  const { toast } = useToast();
  const { user } = useAuth();
  
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);
  const [problems, setProblems] = useState<Problem[]>([]);

  const [playerCode, setPlayerCode] = useState<string>(`# Welcome to Python Playground!
# Type your Python code here and press 'Run Code' or Ctrl+Enter

def greet(name):
    return f"Hello, {name}!"

# Print a greeting
print(greet("World"))

# Try some math
print("2 + 2 =", 2 + 2)
`);
  const [isRunningCode, setIsRunningCode] = useState(false);

  const [terminalOutput, setTerminalOutput] = useState<string>('');
  const terminalRef = useRef<HTMLPreElement>(null);

  const editorRef = useRef<Monaco.editor.IStandaloneCodeEditor | null>(null);
  const monacoRef = useRef<typeof Monaco | null>(null);
  const cursorPosition = useRef<Monaco.Position | null>(null);

  // --- State Definitions --- 
  const [isHost, setIsHost] = useState(false);
  const [opponentId, setOpponentId] = useState<string | null>(null);
  const [opponentUsername, setOpponentUsername] = useState<string>('Opponent');
  const [matchStarted, setMatchStarted] = useState(false);
  const [matchEnded, setMatchEnded] = useState(false);
  const [winner, setWinner] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState(600);
  const [playerHealth, setPlayerHealth] = useState(MAX_HEALTH);
  const [opponentHealth, setOpponentHealth] = useState(MAX_HEALTH);
  const [currentProblemIndex, setCurrentProblemIndex] = useState(0);
  const [selectedLanguage, setSelectedLanguage] = useState<string>('python');
  const supportedLanguages = ['python', 'javascript', 'typescript'];
  
  // Track code and results by problem ID and language
  const [playerCodes, setPlayerCodes] = useState<Record<string, Record<string, string>>>({});
  const [playerTestResults, setPlayerTestResults] = useState<Record<string, Record<string, TestResult[]>>>({});
  
  const [completedProblems, setCompletedProblems] = useState<string[]>([]);
  const [opponentCompletedProblems, setOpponentCompletedProblems] = useState<string[]>([]);

  // Add state for avatar URLs
  const [opponentAvatarUrl, setOpponentAvatarUrl] = useState<string | null>(null);
  const [playerAvatarUrl, setPlayerAvatarUrl] = useState<string | null>(null);

  // Add state for output tabs and console
  const [activeOutputTab, setActiveOutputTab] = useState('test-cases'); // 'test-cases' or 'console'
  const [consoleOutput, setConsoleOutput] = useState<string>('');
  
  // --- Refs --- 
  const consoleScrollAreaRef = useRef<HTMLDivElement>(null);

  const currentProblem = problems.length > 0 ? problems[currentProblemIndex] : null;

  // --- State for Individual Test Case Expansion --- 
  const [expandedTestCases, setExpandedTestCases] = useState<Record<number, boolean>>({});

  // Toggle function for expanding/collapsing test case details
  const toggleTestCaseExpansion = (index: number) => {
    setExpandedTestCases(prev => ({ ...prev, [index]: !prev[index] }));
  };

  // --- Get Current Code --- 
  const getCurrentCode = useCallback(() => {
    if (!currentProblem) return '';
    
    // Get code for this problem and language
    if (playerCodes[currentProblem.id]?.[selectedLanguage]) {
      return playerCodes[currentProblem.id][selectedLanguage];
    }
    
    // Default to starter code if available
    if (currentProblem.languages?.[selectedLanguage]) {
      return currentProblem.languages[selectedLanguage];
    }
    
    // Fall back to first available language or empty string
    if (currentProblem.languages) {
      const firstAvailableLanguage = Object.keys(currentProblem.languages)[0];
      if (firstAvailableLanguage) {
        return currentProblem.languages[firstAvailableLanguage];
      }
    }
    
    return '';
  }, [currentProblem, selectedLanguage, playerCodes]);

  // --- Get Test Results for Current Problem and Language ---
  const getCurrentTestResults = useCallback(() => {
    if (!currentProblem) return [];
    
    return playerTestResults[currentProblem.id]?.[selectedLanguage] || [];
  }, [currentProblem, selectedLanguage, playerTestResults]);

  // --- Handle Language Change ---
  const handleLanguageChange = (language: string) => {
    if (supportedLanguages.includes(language)) {
      setSelectedLanguage(language);
      
      // Update editor model when language changes
      if (editorRef.current && monacoRef.current && currentProblem) {
        const code = playerCodes[currentProblem.id]?.[language] || 
                    currentProblem.languages?.[language] || 
                    currentProblem.starterCode || '';
                    
        const model = monacoRef.current.editor.createModel(
          code,
          language === 'python' ? 'python' : 
          language === 'typescript' ? 'typescript' : 'javascript'
        );
        
        editorRef.current.setModel(model);
      }
    }
  };

  // Add a function to fetch problems from the backend
  const fetchProblems = useCallback(async () => {
    setIsLoadingProblems(true);
    
    try {
      // Use the Supabase Edge Function to fetch problems
      const { data, error } = await supabase.functions.invoke('fetch-problems');
      
      if (error) {
        console.error('Error fetching problems:', error);
        toast({ 
          title: 'Error loading problems', 
          description: 'Failed to load coding problems. Please try again.',
          variant: 'destructive'
        });
        return;
      }
      
      console.log('Fetched problems:', data);
      if (Array.isArray(data)) {
        setProblems(data);
      }
    } catch (err) {
      console.error('Error in fetchProblems:', err);
      toast({ 
        title: 'Error loading problems', 
        description: 'Failed to load coding problems. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsLoadingProblems(false);
    }
  }, [toast]);

  // Fetch test cases for a specific problem
  const fetchTestCases = useCallback(async (problemId: string) => {
    try {
      // User auth is required to fetch test cases due to RLS
      const { data, error } = await supabase.functions.invoke(`fetch-problems?id=${problemId}&includeTestCases=true`);
      
      if (error) {
        console.error(`Error fetching test cases for problem ${problemId}:`, error);
        return null;
      }
      
      // Update the problem with test cases in the local state
      if (data && data.testCases) {
        setProblems(prev => 
          prev.map(p => 
            p.id === problemId 
              ? { ...p, testCases: data.testCases } 
              : p
          )
        );
        
        return data.testCases;
      }
      
      return null;
    } catch (err) {
      console.error(`Error in fetchTestCases for problem ${problemId}:`, err);
      return null;
    }
  }, []);

  // Fetch problems on component mount
  useEffect(() => {
    fetchProblems();
  }, [fetchProblems]);

  useEffect(() => {
    if (!lobbyCode || !user?.uid) {
      console.warn("Missing lobby code or user information for channel naming.");
      setIsReady(true);
      return;
    }

    let isMounted = true;
    console.log("Setting up simplified battle channel (optional):", lobbyCode);

    const battleChannel = supabase.channel(`battle:${lobbyCode}_simple_runner`)
      .subscribe((status) => {
        console.log(`Simplified Runner channel status: ${status}`);
        if (status === 'SUBSCRIBED') {
          console.log('Successfully subscribed to simplified runner channel');
          if(isMounted) setIsReady(true);
        } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
           if(isMounted) setIsReady(true);
        }
      });

    setChannel(battleChannel);

    return () => {
      console.log("Cleaning up simplified runner component");
      isMounted = false;
      if (battleChannel) {
        console.log("Removing simplified runner channel");
        supabase.removeChannel(battleChannel)
          .then(() => console.log("Simplified runner channel removed"))
          .catch(err => console.error("Error removing channel:", err));
        setChannel(null);
      }
    };
  }, [lobbyCode, user?.uid]);

  const handleEditorDidMount = (editor: Monaco.editor.IStandaloneCodeEditor, monaco: typeof Monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    editor.updateOptions({
      minimap: { enabled: false },
      fontSize: 14,
      lineNumbers: 'on',
      roundedSelection: false,
      scrollBeyondLastLine: false,
      readOnly: false,
      theme: 'vs-dark',
      automaticLayout: true,
      tabSize: 4,
      insertSpaces: true,
      wordWrap: 'on'
    });

    editor.onDidChangeCursorPosition(e => {
      cursorPosition.current = e.position;
    });

    editor.onDidChangeModelContent(() => {
      if (currentProblem?.id && editorRef.current) { 
        const currentCode = editorRef.current.getValue();
        
        // Store code by problem ID and language
        setPlayerCodes(prev => ({
          ...prev,
          [currentProblem.id]: {
            ...(prev[currentProblem.id] || {}),
            [selectedLanguage]: currentCode
          }
        }));
      }
    });

    editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter, () => {
      void runCode();
    });

    editor.focus();
  };

  // --- Updated runCode Function to fetch test cases if needed --- 
  const runCode = async () => {
    if (!currentProblem) {
      toast({ title: "Error", description: "No problem selected.", variant: "destructive" });
      return;
    }

    setIsRunningCode(true);
    
    // Initialize test results for this problem/language if needed
    setPlayerTestResults(prev => ({
      ...prev,
      [currentProblem.id]: {
        ...(prev[currentProblem.id] || {}),
        [selectedLanguage]: []
      }
    }));
    
    setConsoleOutput(`> Running test cases for "${currentProblem.title}" using ${selectedLanguage.toUpperCase()}...\n`);
    setActiveOutputTab('test-cases');

    const sourceCode = getCurrentCode();
    
    // Check for valid Solution class definition based on language
    let hasValidSolution = false;
    if (selectedLanguage === 'python' && sourceCode.includes("class Solution")) {
      hasValidSolution = true;
    } else if ((selectedLanguage === 'javascript' || selectedLanguage === 'typescript') && 
                (sourceCode.includes("class Solution") || sourceCode.includes("function Solution"))) {
      hasValidSolution = true;
    }
    
    if (!sourceCode || !hasValidSolution) {
        setConsoleOutput(prev => prev + `\n❌ Error: Code must define a 'Solution' class/function.\n`);
        toast({ title: "Code Error", description: `Your ${selectedLanguage} code must define a 'Solution' class/function.`, variant: "destructive" });
        setIsRunningCode(false);
        return;
    }

    // Check if the problem has test cases, if not, fetch them
    let testCases = currentProblem.testCases;
    if (!testCases || testCases.length === 0) {
      setConsoleOutput(prev => prev + `\n> Fetching test cases for this problem...\n`);
      testCases = await fetchTestCases(currentProblem.id);
      
      if (!testCases || testCases.length === 0) {
        setConsoleOutput(prev => prev + `\n❌ Error: Failed to fetch test cases for this problem.\n`);
        toast({ title: "Error", description: "Failed to fetch test cases for this problem.", variant: "destructive" });
        setIsRunningCode(false);
        return;
      }
      
      setConsoleOutput(prev => prev + `> Successfully fetched ${testCases.length} test cases.\n`);
    }
    
    setConsoleOutput(prev => prev + `\n> Running ${testCases.length} test cases...\n`);

    const results: TestResult[] = [];
    let allPassed = true;

    // Add debug info to console with language highlighting
    setConsoleOutput(prev => prev + `\n> DEBUG: Running tests with ${selectedLanguage.toUpperCase()} for ${currentProblem.title}\n`);
    
    // Show a sample of the submitted code
    const codePreview = sourceCode.split('\n').slice(0, 3).join('\n') + '\n...';
    setConsoleOutput(prev => prev + `\n\`\`\`${selectedLanguage}\n${codePreview}\n\`\`\`\n`);

    for (let i = 0; i < testCases.length; i++) {
      const testCase = testCases[i];
      const inputString = reprForPython(testCase.input);
      const expectedString = reprForPython(testCase.expected);

      setConsoleOutput(prev => prev + `  Running Test Case #${i + 1}... `);
      
      // Add debug info for input/expected format
      console.log(`TC#${i+1} Input (${typeof testCase.input}):`, testCase.input);
      console.log(`TC#${i+1} Expected (${typeof testCase.expected}):`, testCase.expected);
      console.log(`TC#${i+1} Input Repr:`, inputString);
      console.log(`TC#${i+1} Expected Repr:`, expectedString);

      try {
        const { data, error: invocationError } = await supabase.functions.invoke('execute-code', {
          body: {
            code: sourceCode,
            language: selectedLanguage,
            input: inputString,
            expected: expectedString
          }
        });

        // Log raw response for debugging
        console.log(`TC#${i+1} Raw Response:`, data, invocationError);
        setConsoleOutput(prev => prev + `\n  DEBUG TC#${i+1} - Response received: ${JSON.stringify(data)}\n`);

        // Handle Invocation Errors
        if (invocationError) {
          console.error(`Invocation Error TC#${i + 1}:`, invocationError);
          setConsoleOutput(prev => prev + `❌ Failed (Invocation Error: ${invocationError.message})\n`); 
          results.push({ 
             passed: false, input: testCase.input, expected: testCase.expected, actual: null,
             message: "Invocation Error", error: invocationError.message 
          });
          allPassed = false;
          continue; // Move to next test case
        }

        // Validate Backend Response
        if (!data) {
           console.error(`Invalid Response TC#${i + 1}:`, data);
           setConsoleOutput(prev => prev + `❌ Failed (Invalid Server Response)\n`); 
           results.push({ 
             passed: false, input: testCase.input, expected: testCase.expected, actual: null,
             message: "Invalid Response", error: "Server returned invalid data." 
           });
          allPassed = false;
          continue; // Move to next test case
        }
        
        setConsoleOutput(prev => prev + `${data.passed ? '✅' : '❌'}\n`); 
        
        // Create result object directly using backend's passed status
        results.push({
          passed: data.passed,
          input: testCase.input,
          expected: testCase.expected,
          actual: data.passed ? testCase.expected : (data.actualValue || null),
          message: data.message,
          time: data.time,
          memory: data.memory,
          error: data.error
        });

        if (!data.passed) {
          allPassed = false;
        }

      } catch (err: any) {
        console.error(`Frontend Error TC#${i + 1}:`, err);
        setConsoleOutput(prev => prev + `❌ Failed (Frontend Error: ${err.message})\n`);
         results.push({ 
             passed: false, input: testCase.input, expected: testCase.expected, actual: null,
             message: "Frontend Error", error: err.message 
          });
        allPassed = false;
      }
      
       // Update intermediate results
       setPlayerTestResults(prev => ({
         ...prev,
         [currentProblem.id]: {
           ...(prev[currentProblem.id] || {}),
           [selectedLanguage]: [...results]
         }
       }));
    } // End loop

    // --- Final Update & Summary --- 
    setIsRunningCode(false);
    
    // Ensure final state is set
    setPlayerTestResults(prev => ({
      ...prev,
      [currentProblem.id]: {
        ...(prev[currentProblem.id] || {}),
        [selectedLanguage]: results
      }
    }));

    const summary = `Execution finished: ${results.filter(r => r.passed).length}/${results.length} test cases passed.`;
    setConsoleOutput(prev => prev + summary + '\n');
    toast({ 
       title: "Execution Finished", 
       description: summary,
       variant: allPassed ? "default" : "destructive"
    });

    // Scroll Console to bottom
     requestAnimationFrame(() => {
      if (consoleScrollAreaRef.current) {
          consoleScrollAreaRef.current.scrollTop = consoleScrollAreaRef.current.scrollHeight;
      }
     });
  };
  
  // --- Add helper to generate Python repr string --- 
  function reprForPython(value: any): string {
    if (value === null) return 'None';
    if (typeof value === 'boolean') return value ? 'True' : 'False';
    if (typeof value === 'string') return JSON.stringify(value); // JSON stringify handles quotes/escapes
    if (typeof value === 'number') return String(value); // Numbers are straightforward
    if (Array.isArray(value)) {
      return '[' + value.map(reprForPython).join(', ') + ']';
    }
    // Basic object handling (might need improvement for complex objects)
    if (typeof value === 'object') {
       return '{' + Object.entries(value).map(([k, v]) => `${reprForPython(k)}: ${reprForPython(v)}`).join(', ') + '}';
    }
    // Fallback for unknown types
    return JSON.stringify(String(value)); 
  }

  // --- Add helper to parse Python repr string (simplified) ---
  function parsePythonRepr(reprStr: string): any {
      if (!reprStr) return reprStr; // Return empty/nullish as is
      const trimmed = reprStr.trim();
      try {
          // Prioritize direct matches
          if (trimmed === "None") return null;
          if (trimmed === "True") return true;
          if (trimmed === "False") return false;
          
          // Use ast.literal_eval equivalent (JSON.parse after replacing quotes carefully)
          // Replace Python dict/list syntax if needed, be cautious with eval
          // This is complex; a safer subset is using JSON.parse after replacing single quotes
          // This won't handle tuples directly, requires more robust parsing
           if ((trimmed.startsWith("[") && trimmed.endsWith("]")) || (trimmed.startsWith("{") && trimmed.endsWith("}"))) {
               // Attempt to parse as JSON after replacing Python quotes
               try {
                   return JSON.parse(trimmed.replace(/'/g, '"'));
               } catch (e) { 
                   console.warn("JSON parse failed after quote replacement, falling back", e); 
                   // Fallback needed, maybe a safer custom parser or return raw string
                   return trimmed; 
               }
           }
          
          // Handle numbers
          if (!isNaN(Number(trimmed))) {
              return Number(trimmed);
          }
          
          // Handle quoted strings
           if ((trimmed.startsWith("'") && trimmed.endsWith("'")) || (trimmed.startsWith('"') && trimmed.endsWith('"'))) {
             return trimmed.slice(1, -1);
           }

          // Fallback: return the trimmed string itself
          return trimmed;
      } catch (e) {
          console.error(`Failed to parse Python repr string '${reprStr}':`, e);
          return reprStr; // Return original string on error
      }
  }

  // --- Updated Editor Model Effect ---
  useEffect(() => {
    if (!monacoRef.current || !currentProblem) return;

    const languageMode = selectedLanguage === 'python' ? 'python' : 
                         selectedLanguage === 'typescript' ? 'typescript' : 'javascript';
                           
    const code = getCurrentCode();

    const model = monacoRef.current.editor.createModel(
      code,
      languageMode
    );

    if (editorRef.current) {
      editorRef.current.setModel(model);
      if (cursorPosition.current) {
        editorRef.current.setPosition(cursorPosition.current);
        editorRef.current.revealPositionInCenter(cursorPosition.current);
      } else {
        // Set cursor to first line after class declaration if no previous position
        const lineCount = model.getLineCount();
        const firstLine = model.getLineContent(1);
        if (firstLine.includes('class Solution')) {
          editorRef.current.setPosition({ lineNumber: 2, column: 1 });
        }
      }
    }

    return () => {
      model.dispose();
    };
  }, [currentProblem, selectedLanguage, getCurrentCode]);

  // --- Updated Tab Change Handler --- 
  const handleTabChange = (value: string) => {
    const newIndex = parseInt(value, 10);
    console.log(`Tab changed: value='${value}', attempted newIndex=${newIndex}`);
    
    if (!isNaN(newIndex) && newIndex >= 0 && newIndex < problems.length) {
      setCurrentProblemIndex(newIndex);
      setConsoleOutput(''); // Clear console output on problem change
      
      // Reset cursor position when switching problems
      cursorPosition.current = null;
    } else {
      console.error('Invalid index derived from tab value:', value);
    }
  };

  // --- Helper Functions ---
  // Add formatTime function
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  // --- Timer Effect (Implement Countdown & End Condition) --- 
  useEffect(() => {
    if (!isReady || matchEnded) return; // Don't run if not ready or match ended

    if (timeLeft <= 0) {
       // Handle timeout - Trigger game end logic (placeholder)
       console.log("Time ran out!");
       // handleGameEnd(null); // Or determine winner based on score
       setMatchEnded(true); // Stop timer by setting matchEnded
       toast({ title: "Time's Up!", description: "The match has ended.", variant: "destructive" });
       return;
    }

    const timerInterval = setInterval(() => {
      setTimeLeft(prev => prev - 1);
    }, 1000);

    // Cleanup interval on component unmount or when match ends/time runs out
    return () => clearInterval(timerInterval);
  }, [isReady, timeLeft, matchEnded]); // Add matchEnded dependency

  // Add a debugger to track problem switching
  useEffect(() => {
    console.log("Problem switched to:", currentProblemIndex, currentProblem?.id);
    
    // Ensure we reset cursor and load correct code for this problem/language
    if (currentProblem) {
      setConsoleOutput(`> Ready to solve: ${currentProblem.title}\n> Select a language and write your solution.`);
      
      // Make sure we have the initial code loaded when problem changes
      if (!playerCodes[currentProblem.id]?.[selectedLanguage]) {
        setPlayerCodes(prev => ({
          ...prev,
          [currentProblem.id]: {
            ...(prev[currentProblem.id] || {}),
            [selectedLanguage]: currentProblem.languages?.[selectedLanguage] || currentProblem.starterCode || ''
          }
        }));
      }
    }
  }, [currentProblemIndex, currentProblem]);

  // Fix the problem index tracking when loading problems
  useEffect(() => {
    if (problems.length > 0 && currentProblemIndex >= problems.length) {
      // Reset to the first problem if current index is out of bounds
      setCurrentProblemIndex(0);
    }
  }, [problems, currentProblemIndex]);

  // --- UI Rendering --- 
  if (!isReady) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="flex items-center space-x-4 mb-6">
           <Swords className="h-12 w-12 animate-pulse text-primary" /> 
           <h1 className="text-4xl font-bold text-gray-100">Preparing Duel</h1>
        </div>
        <p className="mt-4 text-gray-400">Loading arena and problems...</p>
      </div>
    );
  }

  // Add loading state for problems
  if (isLoadingProblems) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="flex items-center space-x-4 mb-6">
           <Code className="h-12 w-12 animate-pulse text-primary" /> 
           <h1 className="text-4xl font-bold text-gray-100">Loading Problems</h1>
        </div>
        <p className="mt-4 text-gray-400">Fetching coding challenges from the server...</p>
      </div>
    );
  }

  // Handle case where no problems were found
  if (problems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-gray-900 to-black">
        <div className="flex items-center space-x-4 mb-6 text-red-500">
           <X className="h-12 w-12" /> 
           <h1 className="text-4xl font-bold text-gray-100">No Problems Found</h1>
        </div>
        <p className="mt-4 text-gray-400">Couldn't load any coding problems. Please try again later.</p>
        <Button onClick={fetchProblems} className="mt-6">Retry</Button>
      </div>
    );
  }

  // Add Game End Overlay (Placeholder)
   if (matchEnded) {
     // Basic overlay, replace with proper modal/screen later
     return (
       <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-50">
         <h1 className="text-4xl font-bold text-white mb-4">Match Over!</h1>
         {/* Add Winner/Loser text based on 'winner' state later */} 
         <p className="text-xl text-gray-300 mb-8">{winner ? `Winner: ${winner === user?.uid ? 'You' : opponentUsername}` : "Time Expired!"}</p>
         <Button onClick={() => navigate('/arena')} size="lg">Back to Arena</Button>
       </div>
     );
   }

  // Main Battle UI
  return (
    <div className="flex flex-col h-screen bg-gradient-to-br from-gray-900 via-black to-gray-800 text-gray-100 p-1 sm:p-2 gap-2 font-sans relative"> 
      {/* Apply overlay if matchEnded */} 
      {matchEnded && (
         <div className="absolute inset-0 bg-black/70 backdrop-blur-sm z-40"></div>
      )}
      
      {/* === Redesigned Top Bar === */} 
      <div className={cn(
          "flex items-center justify-between border border-gray-700/50 rounded-lg p-2 px-4 bg-gradient-to-r from-gray-800 via-gray-900 to-gray-800 shadow-lg flex-shrink-0 transition-opacity duration-300",
          matchEnded && "opacity-50" // Dim if match ended
          )}>
        {/* Player 1 (You) */} 
        <div className="flex items-center gap-3 min-w-[200px]">
          <Avatar className="h-10 w-10 border-2 border-blue-400 shadow-md">
            <AvatarImage src={playerAvatarUrl || undefined} alt="Your Avatar" />
            <AvatarFallback className="bg-gradient-to-br from-blue-500 to-blue-700 text-white font-semibold">YOU</AvatarFallback>
          </Avatar>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-gray-100 truncate">You</span>
            <Progress value={playerHealth} title={`Health: ${playerHealth}%`} className="w-28 h-1.5 mt-1 bg-gray-700 [&>*]:bg-gradient-to-r [&>*]:from-blue-400 [&>*]:to-blue-600" />
            <span className="text-xs text-blue-300 mt-0.5">{completedProblems.length}/{problems.length} Solved</span>
          </div>
        </div>

        {/* Center: Timer */} 
        <div className="flex flex-col items-center">
           <div className="flex items-center gap-2 px-4 py-1 bg-gray-700/50 border border-gray-600/50 rounded-full shadow-inner">
              <TimerIcon className="h-5 w-5 text-yellow-400 animate-pulse" /> 
              <span className="font-mono text-xl font-bold tracking-wider text-gray-50">{formatTime(timeLeft)}</span>
           </div>
        </div>

        {/* Player 2 (Opponent) */} 
        <div className="flex items-center justify-end gap-3 min-w-[200px]">
           <div className="flex flex-col items-end">
            <span className="text-sm font-semibold text-gray-100 truncate">{opponentUsername}</span>
            <Progress value={opponentHealth} title={`Health: ${opponentHealth}%`} className="w-28 h-1.5 mt-1 bg-gray-700 [&>*]:bg-gradient-to-r [&>*]:from-red-400 [&>*]:to-red-600" />
            <span className="text-xs text-red-300 mt-0.5">{opponentCompletedProblems.length}/{problems.length} Solved</span>
          </div>
          <Avatar className="h-10 w-10 border-2 border-red-400 shadow-md">
            <AvatarImage src={opponentAvatarUrl || undefined} alt="Opponent Avatar" />
            <AvatarFallback className="bg-gradient-to-br from-red-500 to-red-700 text-white font-semibold">OPP</AvatarFallback>
          </Avatar>
        </div>
      </div>

      {/* === Main Content Area === */} 
      <div className={cn(
           "flex-1 flex gap-2 overflow-hidden transition-opacity duration-300",
           matchEnded && "opacity-50 pointer-events-none" // Dim and disable interaction if match ended
           )}>
        <Allotment defaultSizes={[40, 60]}> 
          {/* Left Pane: Problems */} 
          <Allotment.Pane minSize={350}>
             <Card className="h-full flex flex-col overflow-hidden bg-gray-800/80 border border-gray-700/60 shadow-xl rounded-lg">
                <Tabs 
                   value={String(currentProblemIndex)} 
                   onValueChange={handleTabChange}
                   className="flex-1 flex flex-col overflow-hidden"
                >
                  <TabsList className="m-1 flex-shrink-0 bg-gray-900/70 border-b border-gray-700 rounded-t-lg gap-px">
                    {problems.map((problem, index) => (
                      <TabsTrigger 
                        key={problem.id} 
                        value={String(index)}
                        className={cn(
                          `relative flex-1 data-[state=active]:bg-gray-700/80 data-[state=active]:text-white data-[state=active]:shadow-inner data-[state=active]:shadow-black/30 text-gray-400 hover:bg-gray-700/50 py-2 px-1 truncate text-xs sm:text-sm rounded-sm transition-colors duration-150`,
                          index === 0 && 'rounded-tl-md', index === problems.length - 1 && 'rounded-tr-md'
                          )}
                      >
                        {problem.title}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                  <ScrollArea className="flex-1 p-4 bg-gray-800/50 rounded-b-lg">
                    {currentProblem ? (
                        <div className="space-y-4">
                          <div className="flex justify-between items-start mb-3">
                              <h2 className="text-xl font-semibold text-gray-100 mr-4">{currentProblem.title}</h2>
                              {/* Improved Difficulty Badge */} 
                               <Badge 
                                className={cn(
                                  "ml-2 flex-shrink-0 px-2.5 py-0.5 rounded-full text-xs font-semibold border",
                                  currentProblem.difficulty === 'easy' && 'bg-green-800/70 border-green-600/50 text-green-100',
                                  currentProblem.difficulty === 'medium' && 'bg-yellow-800/70 border-yellow-600/50 text-yellow-100',
                                  currentProblem.difficulty === 'hard' && 'bg-red-800/70 border-red-600/50 text-red-100'
                                )}
                              >
                                {currentProblem.difficulty.charAt(0).toUpperCase() + currentProblem.difficulty.slice(1)}
                              </Badge>
                          </div>
                          <div className="prose prose-sm prose-invert max-w-none text-gray-300">
                            {/* Using prose class for better markdown-like styling if description includes markdown */} 
                            <p className="whitespace-pre-wrap leading-relaxed">
                              {currentProblem.description}
                            </p>
                          </div>
                          <div>
                            <h3 className="text-md font-semibold mt-6 mb-3 text-gray-200 border-t border-gray-700 pt-3">Examples:</h3>
                            {currentProblem.examples && currentProblem.examples.map((ex, index) => (
                              <Card key={index} className="mb-3 bg-gradient-to-br from-gray-900/70 to-gray-800/80 border border-gray-700/50 shadow-md rounded-md">
                                <CardContent className="p-3 text-xs font-mono whitespace-pre-wrap text-gray-300">
                                  <p className="font-semibold mb-1.5 text-gray-100">Example {index + 1}:</p>
                                  <p><strong className="text-gray-400 font-medium mr-1">Input:</strong><code className="bg-gray-700/50 px-1 py-0.5 rounded text-gray-200">{ex.input}</code></p>
                                  <p><strong className="text-gray-400 font-medium mr-1">Output:</strong><code className="bg-gray-700/50 px-1 py-0.5 rounded text-gray-200">{ex.output}</code></p>
                                  {ex.explanation && <p className="mt-2 text-gray-400 text-[11px]"><strong className="font-medium">Explanation:</strong> {ex.explanation}</p>}
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center h-full py-12">
                          <div className="text-gray-500 flex flex-col items-center">
                            <Code className="h-12 w-12 mb-4 opacity-20" />
                            <p className="text-center">No problem selected or problems still loading.</p>
                            <Button onClick={fetchProblems} variant="outline" className="mt-4">Reload Problems</Button>
                          </div>
                        </div>
                      )}
                    </ScrollArea>
                </Tabs>
             </Card>
          </Allotment.Pane>
          
          {/* Right Pane: Editor + Results */} 
          <Allotment.Pane>
            <Allotment vertical defaultSizes={[65, 35]} className="[&>.allotment-sash]:bg-gray-700/50 [&>.allotment-sash]:hover:bg-blue-600">
              {/* Top: Editor */} 
              <Allotment.Pane minSize={200}>
                 <Card className="h-full flex flex-col overflow-hidden bg-gray-900/80 border border-gray-700/60 shadow-xl rounded-lg">
                    <CardHeader className="p-2 border-b border-gray-700 flex-shrink-0 flex items-center justify-between bg-gray-800/50 rounded-t-lg">
                      <CardTitle className="text-sm flex items-center gap-1.5 text-gray-200 font-medium">
                         <Code className="h-4 w-4"/> Solution Code
                       </CardTitle>
                       <div className="flex items-center gap-2">
                         <div className="relative">
                           <select 
                             value={selectedLanguage}
                             onChange={(e) => handleLanguageChange(e.target.value)}
                             className="h-7 px-2 py-0 text-xs rounded bg-gray-700 text-gray-200 border border-gray-600 appearance-none pr-7 cursor-pointer"
                           >
                             {supportedLanguages.map(lang => (
                               <option key={lang} value={lang}>{lang.charAt(0).toUpperCase() + lang.slice(1)}</option>
                             ))}
                           </select>
                           <ChevronDown className="h-3 w-3 absolute right-2 top-2 text-gray-400 pointer-events-none" />
                         </div>
                         <Button onClick={runCode} disabled={isRunningCode} size="sm" variant="default" className="h-8 px-3 py-1 flex items-center gap-1.5 bg-blue-600 hover:bg-blue-700">
                           <Play className="h-3.5 w-3.5" />
                           {isRunningCode ? 'Running...' : 'Run Code'}
                         </Button>
                       </div>
                    </CardHeader>
                    <div className="flex-1 overflow-hidden p-0 bg-editor-dark"> {/* Use a specific bg color */} 
                      <Editor
                        height="100%"
                        language={getMonacoLanguage(selectedLanguage)}
                        theme="vs-dark"
                        value={getCurrentCode()}
                        onMount={handleEditorDidMount}
                        onChange={(value) => {
                          if (currentProblem?.id) {
                             setPlayerCodes(prev => ({
                               ...prev,
                               [currentProblem.id]: {
                                 ...(prev[currentProblem.id] || {}),
                                 [selectedLanguage]: value || ''
                               }
                             }));
                           }
                        }}
                        options={{ 
                          automaticLayout: true,
                          scrollBeyondLastLine: false,
                          minimap: { enabled: false },
                          fontSize: 14,
                          tabSize: selectedLanguage === 'python' ? 4 : 2, // Different tab size for different languages
                          insertSpaces: true,
                          wordWrap: 'on',
                          lineNumbers: 'on',
                          roundedSelection: false,
                          readOnly: false,
                          padding: { top: 10, bottom: 10 }
                        }}
                      />
                    </div>
                 </Card>
              </Allotment.Pane>
              
              {/* Bottom: Results/Console */} 
              <Allotment.Pane minSize={120}>
                 <Card className="h-full flex flex-col overflow-hidden bg-gray-900/50 border border-gray-700/60 shadow-xl rounded-lg">
                    {/* Output Tabs Header */} 
                    <Tabs 
                       value={activeOutputTab} 
                       onValueChange={setActiveOutputTab} 
                       className="flex-1 flex flex-col overflow-hidden"
                    >
                      <TabsList className="grid w-full grid-cols-2 h-9 flex-shrink-0 bg-gray-800/60 border-b border-gray-700 rounded-t-lg gap-px">
                        <TabsTrigger 
                           value="test-cases" 
                           className={cn(
                             "h-full data-[state=active]:bg-gray-700/50 data-[state=active]:text-white data-[state=active]:shadow-inner text-gray-400 hover:bg-gray-700/30 text-xs sm:text-sm rounded-tl-md transition-colors duration-150 flex items-center justify-center gap-1.5",
                             )}
                          >
                            Test Results
                             {getCurrentTestResults().length > 0 && (
                                <Badge 
                                   variant={getCurrentTestResults().every((r: TestResult) => r.passed) ? 'success' : 'destructive'} 
                                   className="ml-1.5 px-1.5 py-0.5 text-[10px] leading-tight font-medium rounded-full"
                                >
                                  {getCurrentTestResults().filter((r: TestResult) => r.passed).length}/{getCurrentTestResults().length}
                                </Badge>
                             )}
                        </TabsTrigger>
                        <TabsTrigger 
                           value="console" 
                           className={cn(
                             "h-full data-[state=active]:bg-gray-700/50 data-[state=active]:text-white data-[state=active]:shadow-inner text-gray-400 hover:bg-gray-700/30 text-xs sm:text-sm rounded-tr-md transition-colors duration-150 flex items-center justify-center gap-1.5",
                             )}
                         >
                            <Terminal className="h-3.5 w-3.5 mr-0.5"/> Console
                        </TabsTrigger>
                      </TabsList>
                      
                      {/* Test Cases Content Panel */} 
                      <TabsContent value="test-cases" className="flex-1 overflow-y-auto p-3 bg-gray-800/30 m-0 rounded-b-lg focus-visible:ring-0 focus-visible:ring-offset-0">
                        {isRunningCode && (
                          <div className="flex items-center justify-center h-full">
                            <p className="text-sm text-gray-400 animate-pulse">Executing code...</p>
                          </div>
                        )} 
                        {!isRunningCode && currentProblem && getCurrentTestResults().length > 0 ? (
                            <div className="space-y-2">
                              {getCurrentTestResults().map((result: TestResult, index: number) => {
                                const isExpanded = !result.passed && expandedTestCases[index]; // Only failed tests can be expanded
                                return (
                                  // Use standard div/button instead of Disclosure
                                  <div key={index} className={cn(
                                    "border rounded-md overflow-hidden shadow-sm transition-all duration-200",
                                    result.passed ? 'border-green-600/30 bg-green-900/10' : 'border-red-600/30 bg-red-900/10'
                                    )}>
                                    {/* Test Case Header Button */} 
                                    <button 
                                       className="flex w-full justify-between items-center px-3 py-1.5 text-left text-sm font-medium focus:outline-none focus-visible:ring focus-visible:ring-blue-500/75 hover:bg-gray-700/20 disabled:hover:bg-transparent disabled:cursor-default"                                         
                                       onClick={() => !result.passed && toggleTestCaseExpansion(index)} // Only allow expanding failed tests
                                       disabled={result.passed} // Disable button for passed tests
                                       aria-expanded={isExpanded}
                                     >
                                      <div className={cn("flex items-center gap-1.5", result.passed ? 'text-green-400' : 'text-red-400')}>
                                        {result.passed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                                        <span>Test Case #{index + 1}</span>
                                      </div>
                                      <div className="flex items-center gap-2">
                                         <Badge variant={result.passed ? 'success' : 'destructive'} className="text-[10px] px-1.5 py-0.5 leading-tight rounded-full font-semibold">{result.message}</Badge>
                                         {/* Show Chevron only for expandable (failed) tests */} 
                                         {!result.passed && (
                                              <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${ isExpanded ? 'rotate-180 transform' : '' }`} />
                                         )}
                                      </div>
                                    </button>
                                    {/* Collapsible Details Area */} 
                                    {isExpanded && (
                                        <div 
                                            className="px-3 pb-2 pt-1 text-xs bg-black/20 font-mono text-gray-300 border-t border-gray-700/50"
                                        >
                                          <p className="text-xs text-gray-500 mb-1.5">
                                            <code className="bg-gray-800/50 px-1 py-0.5 rounded">
                                              Solution{getFileExtension(selectedLanguage)}
                                            </code>
                                          </p>
                                          <p className="mb-0.5"><strong className="text-gray-500 mr-1">Input:</strong><code className="text-gray-300">{JSON.stringify(result.input)}</code></p>
                                          <p className="mb-0.5"><strong className="text-gray-500 mr-1">Expected:</strong><code className="text-gray-300">{JSON.stringify(result.expected)}</code></p>
                                          <p className="mb-0.5"><strong className="text-gray-500 mr-1">Actual:</strong><code className="text-red-300">{JSON.stringify(result.actual)}</code></p>
                                          {result.error && <p className="mt-1 text-red-400"><strong className="font-semibold">Error:</strong> {result.error}</p>}
                                        </div>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                         ) : (
                           !isRunningCode && <p className="text-xs text-gray-500 p-4 text-center italic">Run code to see test results.</p>
                         )}
                      </TabsContent>
                      
                      {/* Console Content Panel */} 
                      <TabsContent value="console" className="flex-1 overflow-y-auto p-0 m-0 bg-black rounded-b-lg focus-visible:ring-0 focus-visible:ring-offset-0">
                         <ScrollArea className="h-full">
                           <pre className="font-mono text-[11px] whitespace-pre-wrap break-words text-gray-300 p-2 leading-relaxed">
                              {consoleOutput || '> Console output will appear here...'} 
                           </pre>
                         </ScrollArea>
                      </TabsContent>
                    </Tabs>
                 </Card>
              </Allotment.Pane>
            </Allotment>
          </Allotment.Pane>
        </Allotment>
      </div>
    </div>
  );
};

export default Battle;

