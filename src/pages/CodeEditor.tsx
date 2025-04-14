import React, { useState, useEffect } from 'react';
import PythonCodeEditor from '@shared/components/PythonCodeEditor';
import { Button } from '@ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@ui/data/card';
import { Badge } from '@ui/data/badge';
import { Check, X } from 'lucide-react';
import { Play, Terminal, Plus } from 'lucide-react';
import { useToast } from '@shared/hooks/ui/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@ui/form/select';
import { getAllProblems, getProblemById, addProblem, validateSolution, PythonProblem, TestCase } from '@/api/problemsApi';

// Import from Python problems file
// This would use a proper import in a real application
// For demonstration, we'll simulate the data structure
interface Example {
  input: string;
  output: string;
  explanation?: string;
}

interface TestResult {
  passed: boolean;
  message: string;
  input?: string;
  expected?: string;
  actual?: string;
}

const CodeEditor = () => {
  const [problems, setProblems] = useState<PythonProblem[]>([]);
  const [selectedProblemId, setSelectedProblemId] = useState<string>("");
  const [currentProblem, setCurrentProblem] = useState<PythonProblem | null>(null);
  const [code, setCode] = useState<string>("");
  const [isRunningCode, setIsRunningCode] = useState<boolean>(false);
  const [testResults, setTestResults] = useState<TestResult[]>([]);
  const { toast } = useToast();

  // Load problems
  useEffect(() => {
    const loadedProblems = getAllProblems();
    setProblems(loadedProblems);
    
    // Select first problem by default
    if (loadedProblems.length > 0) {
      setSelectedProblemId(loadedProblems[0].id);
      setCurrentProblem(loadedProblems[0]);
      setCode(loadedProblems[0].starter_code);
    }
  }, []);

  // Handle problem selection
  const handleProblemChange = (problemId: string) => {
    const problem = getProblemById(problemId);
    if (problem) {
      setSelectedProblemId(problemId);
      setCurrentProblem(problem);
      setCode(problem.starter_code);
      setTestResults([]);
    }
  };

  // Run code against test cases
  const runCode = async () => {
    if (!currentProblem) return;

    setIsRunningCode(true);
    setTestResults([]);

    try {
      // Validate code format
      if (!validateSolution(code, currentProblem)) {
        setTestResults([{ 
          passed: false, 
          message: 'Your solution must include a Solution class with a solve method'
        }]);
        return;
      }

      // Simulate a delay to represent code execution
      await new Promise(resolve => setTimeout(resolve, 1000));

      const results: TestResult[] = [];

      // Basic validation checks
      if (!code || code === currentProblem.starter_code) {
        results.push({ 
          passed: false, 
          message: 'Write some code first!' 
        });
      } else if (!code.includes('return')) {
        results.push({ 
          passed: false, 
          message: 'Your function must return a value.' 
        });
      } else {
        // Simulate test execution for each test case
        // In a real application, this would be done server-side for security
        let passedCount = 0;
        
        for (const [index, test] of currentProblem.test_cases.entries()) {
          // Simulate test evaluation
          const passed = Math.random() > 0.3; // Random success/failure for demo
          
          if (passed) {
            passedCount++;
            results.push({
              passed: true,
              message: `Test case ${index + 1} passed`,
              input: JSON.stringify(test.input),
              expected: JSON.stringify(test.expected),
              actual: JSON.stringify(test.expected) // In a real app, this would be the actual output
            });
          } else {
            const wrongAnswer = test.expected === true ? false : 
                               (test.expected === false ? true : 
                               (Array.isArray(test.expected) ? [] : 
                               (typeof test.expected === 'number' ? test.expected + 1 : "wrong")));
            
            results.push({
              passed: false,
              message: `Test case ${index + 1} failed`,
              input: JSON.stringify(test.input),
              expected: JSON.stringify(test.expected),
              actual: JSON.stringify(wrongAnswer)
            });
          }
          
          // Only show results for the first 3 test cases
          if (index >= 2) break;
        }
        
        // Add summary
        if (passedCount === currentProblem.test_cases.length) {
          toast({
            title: "All tests passed!",
            description: "Great job! Your solution works for all test cases."
          });
        }
      }
      
      setTestResults(results);
    } catch (error) {
      toast({
        title: "Error running code",
        description: "There was an error running your code. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsRunningCode(false);
    }
  };

  // Add new problem (placeholder)
  const addNewProblem = () => {
    const newProblem = {
      title: "New Problem",
      difficulty: "medium",
      description: "Please update this description with your problem statement.",
      examples: [
        {input: "Example Input", output: "Example Output", explanation: "Example explanation"}
      ],
      test_cases: [
        {input: {}, expected: null}
      ],
      starter_code: `class Solution:
    def solve(self, params):
        # Your code here
        pass`
    };
    
    const createdProblem = addProblem(newProblem);
    
    toast({
      title: "Problem created",
      description: "A new problem template has been created. Select it from the dropdown to edit."
    });
    
    // Refresh problems list
    setProblems(getAllProblems());
    
    // Select the new problem
    setSelectedProblemId(createdProblem.id);
    setCurrentProblem(createdProblem);
    setCode(createdProblem.starter_code);
  };

  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Python Code Editor</h1>
        
        <div className="flex gap-2">
          <Select value={selectedProblemId} onValueChange={handleProblemChange}>
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select a problem" />
            </SelectTrigger>
            <SelectContent>
              {problems.map(problem => (
                <SelectItem key={problem.id} value={problem.id}>
                  {problem.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button variant="outline" onClick={addNewProblem}>
            <Plus className="h-4 w-4 mr-2" />
            Add Problem
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Panel - Code Editor */}
        <div className="flex flex-col gap-4">
          <PythonCodeEditor 
            value={code}
            onChange={setCode}
            onRun={runCode}
            height="calc(100vh - 350px)"
          />
          
          <div className="flex gap-2">
            <Button 
              onClick={runCode} 
              disabled={isRunningCode || !currentProblem}
              className="gap-2 flex-1"
            >
              {isRunningCode ? (
                <>
                  <Terminal className="h-4 w-4 animate-spin" />
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
          
          {/* Test Results */}
          {testResults.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-lg">
                  Test Results 
                  <Badge className="ml-2" variant={testResults.every(r => r.passed) ? "default" : "destructive"}>
                    {testResults.filter(r => r.passed).length}/{testResults.length} Passed
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {testResults.map((result, index) => (
                    <div key={index} className={`p-3 rounded-md ${result.passed ? 'bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900' : 'bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900'}`}>
                      <div className="flex items-start">
                        <span className={`rounded-full p-1 ${result.passed ? 'bg-green-100 text-green-600 dark:bg-green-900 dark:text-green-400' : 'bg-red-100 text-red-600 dark:bg-red-900 dark:text-red-400'}`}>
                          {result.passed ? <Check className="h-4 w-4" /> : <X className="h-4 w-4" />}
                        </span>
                        <span className="ml-2 font-medium">{result.message}</span>
                      </div>
                      
                      {result.input && (
                        <div className="mt-2 text-sm">
                          <div><span className="font-semibold">Input:</span> {result.input}</div>
                          <div><span className="font-semibold">Expected:</span> {result.expected}</div>
                          {result.actual && <div><span className="font-semibold">Actual:</span> {result.actual}</div>}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
        
        {/* Right Panel - Problem Description */}
        {currentProblem && (
          <div className="flex flex-col gap-4">
            <Card className="flex-grow overflow-auto">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`px-3 py-1 ${currentProblem.difficulty === 'easy' ? 'border-green-500 text-green-600' : currentProblem.difficulty === 'medium' ? 'border-yellow-500 text-yellow-600' : 'border-red-500 text-red-600'}`}>
                    {currentProblem.difficulty.charAt(0).toUpperCase() + currentProblem.difficulty.slice(1)}
                  </Badge>
                  <CardTitle>{currentProblem.title}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <div className="prose dark:prose-invert">
                  <p>{currentProblem.description}</p>
                  
                  <h3 className="text-lg font-semibold mt-4 mb-2">Examples</h3>
                  {currentProblem.examples.map((example, i) => (
                    <div key={i} className="mb-4 p-3 bg-muted/50 rounded-md font-mono text-sm">
                      <div><span className="text-muted-foreground">Input:</span> {example.input}</div>
                      <div><span className="text-muted-foreground">Output:</span> {example.output}</div>
                      {example.explanation && (
                        <div><span className="text-muted-foreground">Explanation:</span> {example.explanation}</div>
                      )}
                    </div>
                  ))}
                  
                  <h3 className="text-lg font-semibold mt-4 mb-2">Requirements</h3>
                  <ul className="list-disc pl-5">
                    <li>You must implement your solution in a class called <code>Solution</code>.</li>
                    <li>Implement a <code>solve</code> method with the appropriate parameters.</li>
                    <li>Your solution must work for all valid inputs within the constraints.</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};

export default CodeEditor; 