export interface TestCase {
  input: any;
  expected: any;
  isHidden?: boolean;
}

export interface CodeProblem {
  id: string;
  title: string;
  description: string;
  difficulty: 'easy' | 'medium' | 'hard';
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  testCases: TestCase[];
  starter: string;
  // Add any other metadata if needed, e.g., tags, constraints array
}

export const pythonProblems: Record<string, CodeProblem> = {
  'two-sum': {
    id: 'two-sum',
    title: 'Two Sum',
    difficulty: 'easy',
    description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.',
    examples: [
      { input: "nums = [2,7,11,15], target = 9", output: "[0,1]", explanation: "Because nums[0] + nums[1] == 9, we return [0, 1]." },
      { input: "nums = [3,2,4], target = 6", output: "[1,2]", explanation: "Because nums[1] + nums[2] == 6, we return [1, 2]." }
    ],
    testCases: [
      { input: { nums: [2,7,11,15], target: 9 }, expected: [0,1] },
      { input: { nums: [3,2,4], target: 6 }, expected: [1,2] },
      { input: { nums: [3,3], target: 6 }, expected: [0,1] },
      { input: { nums: [1,4,8,3,2,9,15], target: 17 }, expected: [2,6], isHidden: true },
      { input: { nums: [1,3,5,7,9], target: 8 }, expected: [0,3], isHidden: true }
    ],
    starter: `class Solution:
    def two_sum(self, nums, target):
        # Your code here
        pass`
  },
  'palindrome': {
    id: 'palindrome',
    title: 'Valid Palindrome',
    difficulty: 'easy',
    description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string s, return true if it is a palindrome, or false otherwise.',
    examples: [
      { input: "s = 'A man, a plan, a canal: Panama'", output: "True", explanation: "'amanaplanacanalpanama' is a palindrome." },
      { input: "s = 'race a car'", output: "False", explanation: "'raceacar' is not a palindrome." }
    ],
    testCases: [
      { input: { s: 'A man, a plan, a canal: Panama' }, expected: true },
      { input: { s: 'race a car' }, expected: false },
      { input: { s: ' ' }, expected: true },
      { input: { s: 'No lemon, no melon' }, expected: true, isHidden: true },
      { input: { s: 'Was it a car or a cat I saw?' }, expected: true, isHidden: true }
    ],
    starter: `class Solution:
    def is_palindrome(self, s):
        # Your code here
        pass`
  },
  'max-subarray': {
    id: 'max-subarray',
    title: 'Maximum Subarray',
    difficulty: 'medium',
    description: 'Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.',
    examples: [
      { input: "nums = [-2,1,-3,4,-1,2,1,-5,4]", output: "6", explanation: "The contiguous subarray [4,-1,2,1] has the largest sum = 6." },
      { input: "nums = [1]", output: "1", explanation: "The subarray [1] has the largest sum 1." }
    ],
    testCases: [
      { input: { nums: [-2,1,-3,4,-1,2,1,-5,4] }, expected: 6 },
      { input: { nums: [1] }, expected: 1 },
      { input: { nums: [5,4,-1,7,8] }, expected: 23 },
      { input: { nums: [-1] }, expected: -1, isHidden: true },
      { input: { nums: [-2,-1] }, expected: -1, isHidden: true }
    ],
    starter: `class Solution:
    def max_sub_array(self, nums):
        # Your code here
        pass`
  }
  // Add more problems here following the same structure
}; 