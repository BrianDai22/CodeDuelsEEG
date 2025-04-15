/**
 * Problems API
 * 
 * This file provides functions for interacting with the problems database via Supabase.
 */

import { createClient } from '@supabase/supabase-js';

// Create Supabase client
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'http://127.0.0.1:54321';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJle' + 
'HAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0';
const supabase = createClient(supabaseUrl, supabaseKey);

// Problem Types
export interface Example {
  input: string;
  output: string;
  explanation?: string;
}

export interface TestCase {
  input: Record<string, any>;
  expected: any;
  isHidden?: boolean;
}

export interface PythonProblem {
  id: string;
  title: string;
  difficulty: string; // 'easy', 'medium', 'hard'
  description: string;
  examples: Example[];
  test_cases: TestCase[];
  starter_code: string;
}

// Default starter code
const DEFAULT_STARTER = `class Solution:
    def solve(self, params):
        # Your code here
        pass`;

// Get all problems from Supabase
export const getAllProblems = async (): Promise<PythonProblem[]> => {
  try {
    // Get problems
    const { data: problems, error: problemsError } = await supabase
      .from('coding_problems')
      .select('*');
    
    if (problemsError) throw problemsError;
    if (!problems || problems.length === 0) return [];
    
    // Process each problem to get examples, test cases, and starter code
    const formattedProblems: PythonProblem[] = await Promise.all(
      problems.map(async (problem) => {
        // Get examples
        const { data: examples, error: examplesError } = await supabase
          .from('problem_examples')
          .select('*')
          .eq('problem_id', problem.problem_id)
          .order('display_order', { ascending: true });
        
        if (examplesError) throw examplesError;
        
        // Get test cases
        const { data: testCases, error: testCasesError } = await supabase
          .from('problem_test_cases')
          .select('*')
          .eq('problem_id', problem.problem_id)
          .order('test_order', { ascending: true });
        
        if (testCasesError) throw testCasesError;
        
        // Get starter code (Python)
        const { data: starterCode, error: starterCodeError } = await supabase
          .from('problem_starter_code')
          .select('*')
          .eq('problem_id', problem.problem_id)
          .eq('language', 'python')
          .single();
        
        if (starterCodeError && starterCodeError.code !== 'PGRST116') throw starterCodeError;
        
        // Format examples
        const formattedExamples: Example[] = examples?.map(ex => ({
          input: ex.input,
          output: ex.output,
          explanation: ex.explanation || undefined
        })) || [];
        
        // Format test cases
        const formattedTestCases: TestCase[] = testCases?.map(tc => ({
          input: tc.input_json,
          expected: tc.expected_json,
          isHidden: false // All test cases visible for now
        })) || [];
        
        return {
          id: problem.problem_id,
          title: problem.title,
          difficulty: problem.difficulty,
          description: problem.description,
          examples: formattedExamples,
          test_cases: formattedTestCases,
          starter_code: starterCode?.code || DEFAULT_STARTER
        };
      })
    );
    
    return formattedProblems;
  } catch (error) {
    console.error('Error fetching problems:', error);
    return [];
  }
};

// Get a problem by ID
export const getProblemById = async (id: string): Promise<PythonProblem | null> => {
  const problems = await getAllProblems();
  return problems.find(p => p.id === id) || null;
};

// Add a new problem
export const addProblem = async (problem: Partial<PythonProblem>): Promise<PythonProblem | null> => {
  try {
    // Generate problem ID if not provided
    const problemId = problem.id || `problem-${Date.now()}`;
    
    // Insert into coding_problems table
    const { error: problemError } = await supabase
      .from('coding_problems')
      .insert({
        problem_id: problemId,
        title: problem.title || 'Untitled Problem',
        difficulty: problem.difficulty || 'medium',
        description: problem.description || 'No description provided.'
      });
    
    if (problemError) throw problemError;
    
    // Insert examples if provided
    if (problem.examples && problem.examples.length > 0) {
      const formattedExamples = problem.examples.map((ex, index) => ({
        problem_id: problemId,
        input: ex.input,
        output: ex.output,
        explanation: ex.explanation || null,
        display_order: index + 1
      }));
      
      const { error: examplesError } = await supabase
        .from('problem_examples')
        .insert(formattedExamples);
      
      if (examplesError) throw examplesError;
    }
    
    // Insert test cases if provided
    if (problem.test_cases && problem.test_cases.length > 0) {
      const formattedTestCases = problem.test_cases.map((tc, index) => ({
        problem_id: problemId,
        input_json: tc.input,
        expected_json: tc.expected,
        test_order: index + 1
      }));
      
      const { error: testCasesError } = await supabase
        .from('problem_test_cases')
        .insert(formattedTestCases);
      
      if (testCasesError) throw testCasesError;
    }
    
    // Insert starter code
    const { error: starterCodeError } = await supabase
      .from('problem_starter_code')
      .insert({
        problem_id: problemId,
        language: 'python',
        code: problem.starter_code || DEFAULT_STARTER,
        method_name: 'solve'
      });
    
    if (starterCodeError) throw starterCodeError;
    
    // Return the newly created problem
    return getProblemById(problemId);
  } catch (error) {
    console.error('Error adding problem:', error);
    return null;
  }
};

// Simple validation for code submission - this would typically happen server-side
export const validateSolution = (code: string, problem: PythonProblem): boolean => {
  // Simple validation to check for Solution class and solve method
  if (!code.includes('class Solution')) return false;
  if (!code.includes('def solve')) return false;
  
  return true;
}; 