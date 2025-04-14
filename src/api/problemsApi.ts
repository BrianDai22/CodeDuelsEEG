/**
 * Problems API
 * 
 * This file provides functions for interacting with the problems database.
 * In a real application, these would make server requests.
 */

// Store problems in localStorage for now
const LOCAL_STORAGE_KEY = 'codeduels_problems';

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

// Sample default problems
const DEFAULT_PROBLEMS: PythonProblem[] = [
  {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "easy",
    description: "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
    examples: [
      {input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]."},
      {input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]."}
    ],
    test_cases: [
      {input: {nums: [2,7,11,15], target: 9}, expected: [0,1]},
      {input: {nums: [3,2,4], target: 6}, expected: [1,2]},
      {input: {nums: [3,3], target: 6}, expected: [0,1]},
      {input: {nums: [1,4,8,3,2,9,15], target: 17}, expected: [2,6], isHidden: true},
      {input: {nums: [1,3,5,7,9], target: 8}, expected: [0,3], isHidden: true}
    ],
    starter_code: `class Solution:
    def solve(self, nums, target):
        # Your code here
        pass`
  },
  {
    id: "palindrome",
    title: "Valid Palindrome",
    difficulty: "easy",
    description: "A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string s, return true if it is a palindrome, or false otherwise.",
    examples: [
      {input: "s = 'A man, a plan, a canal: Panama'", output: "True", explanation: "'amanaplanacanalpanama' is a palindrome."},
      {input: "s = 'race a car'", output: "False", explanation: "'raceacar' is not a palindrome."}
    ],
    test_cases: [
      {input: {s: "A man, a plan, a canal: Panama"}, expected: true},
      {input: {s: "race a car"}, expected: false},
      {input: {s: " "}, expected: true},
      {input: {s: "No lemon, no melon"}, expected: true, isHidden: true},
      {input: {s: "Was it a car or a cat I saw?"}, expected: true, isHidden: true}
    ],
    starter_code: `class Solution:
    def solve(self, s):
        # Your code here
        pass`
  }
];

// Initialize problems in localStorage if they don't exist
const initProblems = () => {
  const problems = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!problems) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_PROBLEMS));
  }
};

// Get all problems
export const getAllProblems = (): PythonProblem[] => {
  initProblems();
  const problems = localStorage.getItem(LOCAL_STORAGE_KEY);
  return problems ? JSON.parse(problems) : [];
};

// Get a problem by ID
export const getProblemById = (id: string): PythonProblem | null => {
  const problems = getAllProblems();
  return problems.find(p => p.id === id) || null;
};

// Add a new problem
export const addProblem = (problem: Partial<PythonProblem>): PythonProblem => {
  // Generate a unique ID if not provided
  const newProblem: PythonProblem = {
    id: problem.id || `problem-${Date.now()}`,
    title: problem.title || 'Untitled Problem',
    difficulty: problem.difficulty || 'medium',
    description: problem.description || 'No description provided.',
    examples: problem.examples || [],
    test_cases: problem.test_cases || [],
    starter_code: problem.starter_code || DEFAULT_STARTER
  };
  
  const problems = getAllProblems();
  problems.push(newProblem);
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(problems));
  
  return newProblem;
};

// Update an existing problem
export const updateProblem = (id: string, updates: Partial<PythonProblem>): PythonProblem | null => {
  const problems = getAllProblems();
  const index = problems.findIndex(p => p.id === id);
  
  if (index === -1) return null;
  
  const updatedProblem = { ...problems[index], ...updates };
  problems[index] = updatedProblem;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(problems));
  
  return updatedProblem;
};

// Delete a problem
export const deleteProblem = (id: string): boolean => {
  const problems = getAllProblems();
  const filteredProblems = problems.filter(p => p.id !== id);
  
  if (filteredProblems.length === problems.length) return false;
  
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filteredProblems));
  return true;
};

// Simple validation for code submission - this would typically happen server-side
export const validateSolution = (code: string, problem: PythonProblem): boolean => {
  // Simple validation to check for Solution class and solve method
  if (!code.includes('class Solution')) return false;
  if (!code.includes('def solve')) return false;
  
  return true;
}; 