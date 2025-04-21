import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams, useLocation } from 'react-router-dom';
import { useAuth } from '@features/auth/AuthContext';
import { useAdmin } from '@shared/context/AdminContext';
import { usePremium } from '@shared/context/PremiumContext';
import { Button } from '@ui/button';
import { useToast } from '@shared/hooks/ui/use-toast';
import { 
  Clock, Play, Terminal, Code, User, Swords, Check, X, 
  ChevronDown, ChevronUp, TimerIcon, ShieldAlert, Timer, 
  Shield, Crown, Home 
} from 'lucide-react';
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
import CodeEditor from '@shared/components/CodeEditor';
import MonacoEditor from '@shared/components/MonacoEditor';
import LandingHeader from '@shared/components/LandingHeader';
import PremiumHeader from '@shared/components/PremiumHeader';
import LandingFooter from '@shared/components/LandingFooter';

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
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const { isAdmin } = useAdmin();
  const { isPremium } = usePremium();
  
  const difficulty = searchParams.get('difficulty') || 'easy';
  const problem = sampleProblems[difficulty];
  
  const [channel, setChannel] = useState<RealtimeChannel | null>(null);
  
  const [isReady, setIsReady] = useState(false);
  const [isLoadingProblems, setIsLoadingProblems] = useState(true);
  const [problems, setProblems] = useState<Problem[]>([]);
  const [matchStarted, setMatchStarted] = useState(false);
  const [timeLeft, setTimeLeft] = useState(300);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [opponentHealth, setOpponentHealth] = useState(100);
  const [playerCode, setPlayerCode] = useState<string>(problem.starter);
  const [opponentProgress, setOpponentProgress] = useState(0);
  const [playerPassedTests, setPlayerPassedTests] = useState(0);

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

  // Effect to simulate opponent progress
  useEffect(() => {
    if (!matchStarted) return;
    
    const interval = setInterval(() => {
      setOpponentProgress(prev => {
        const newProgress = prev + (Math.random() * 0.5);
        if (newProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => navigate('/results?result=lose'), 1000);
          return 100;
        }
        return newProgress;
      });
    }, 2000);
    
    return () => clearInterval(interval);
  }, [matchStarted, navigate]);

  // Add formatTime function
  const formatTime = (seconds: number): string => {
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
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <MonacoEditor
            value={playerCode}
            onChange={setPlayerCode}
            language="javascript"
            className="flex-grow rounded-md overflow-hidden border"
            onRun={runTests}
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
          
          <div className="flex-grow blur-sm relative border rounded-md">
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
