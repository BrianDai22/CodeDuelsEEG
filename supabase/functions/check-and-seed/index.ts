// Utility function to check database status and seed data if needed
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Seed data for database initialization
const seedData = {
  problems: [
    {
      problem_id: 'two-sum',
      title: 'Two Sum',
      description: 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.',
      difficulty: 'easy'
    },
    {
      problem_id: 'reverse-string',
      title: 'Reverse String',
      description: 'Write a function that reverses a string. The input string is given as an array of characters s.',
      difficulty: 'easy'
    },
    {
      problem_id: 'valid-palindrome',
      title: 'Valid Palindrome',
      description: 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.\n\nGiven a string s, return true if it is a palindrome, or false otherwise.',
      difficulty: 'easy'
    }
  ],
  examples: [
    // Two Sum
    {
      problem_id: 'two-sum',
      input: 'nums = [2,7,11,15], target = 9',
      output: '[0,1]',
      explanation: 'Because nums[0] + nums[1] == 9',
      display_order: 1
    },
    {
      problem_id: 'two-sum',
      input: 'nums = [3,2,4], target = 6',
      output: '[1,2]',
      explanation: null,
      display_order: 2
    },
    // Reverse String
    {
      problem_id: 'reverse-string',
      input: 's = ["h","e","l","l","o"]',
      output: '["o","l","l","e","h"]',
      explanation: null,
      display_order: 1
    },
    {
      problem_id: 'reverse-string',
      input: 's = ["H","a","n","n","a","h"]',
      output: '["h","a","n","n","a","H"]',
      explanation: null,
      display_order: 2
    },
    // Valid Palindrome
    {
      problem_id: 'valid-palindrome',
      input: 's = "A man, a plan, a canal: Panama"',
      output: 'true',
      explanation: '"amanaplanacanalpanama" is a palindrome.',
      display_order: 1
    },
    {
      problem_id: 'valid-palindrome',
      input: 's = "race a car"',
      output: 'false',
      explanation: '"raceacar" is not a palindrome.',
      display_order: 2
    },
    {
      problem_id: 'valid-palindrome',
      input: 's = " "',
      output: 'true',
      explanation: 'An empty string reads the same forwards and backwards.',
      display_order: 3
    }
  ],
  starterCode: [
    // Two Sum
    {
      problem_id: 'two-sum',
      language: 'python',
      code: 'class Solution:\n    def twoSum(self, nums, target):\n        """\n        :type nums: List[int]\n        :type target: int\n        :rtype: List[int]\n        """\n        # Write your solution here\n        pass',
      method_name: 'twoSum'
    },
    {
      problem_id: 'two-sum',
      language: 'javascript',
      code: 'class Solution {\n    twoSum(nums, target) {\n        // Write your solution here\n        return [];\n    }\n}',
      method_name: 'twoSum'
    },
    {
      problem_id: 'two-sum',
      language: 'typescript',
      code: 'class Solution {\n    twoSum(nums: number[], target: number): number[] {\n        // Write your solution here\n        return [];\n    }\n}',
      method_name: 'twoSum'
    },
    // Reverse String
    {
      problem_id: 'reverse-string',
      language: 'python',
      code: 'class Solution:\n    def reverseString(self, s):\n        """\n        :type s: List[str]\n        :rtype: None Do not return anything, modify s in-place instead.\n        """\n        # Write your solution here\n        pass',
      method_name: 'reverseString'
    },
    {
      problem_id: 'reverse-string',
      language: 'javascript',
      code: 'class Solution {\n    reverseString(s) {\n        // Write your solution here - modify s in-place\n        return;\n    }\n}',
      method_name: 'reverseString'
    },
    {
      problem_id: 'reverse-string',
      language: 'typescript',
      code: 'class Solution {\n    reverseString(s: string[]): void {\n        // Write your solution here - modify s in-place\n        return;\n    }\n}',
      method_name: 'reverseString'
    },
    // Valid Palindrome
    {
      problem_id: 'valid-palindrome',
      language: 'python',
      code: 'class Solution:\n    def isPalindrome(self, s: str) -> bool:\n        # Write your solution here\n        pass',
      method_name: 'isPalindrome'
    },
    {
      problem_id: 'valid-palindrome',
      language: 'javascript',
      code: 'class Solution {\n    isPalindrome(s) {\n        // Write your solution here\n        return false;\n    }\n}',
      method_name: 'isPalindrome'
    },
    {
      problem_id: 'valid-palindrome',
      language: 'typescript',
      code: 'class Solution {\n    isPalindrome(s: string): boolean {\n        // Write your solution here\n        return false;\n    }\n}',
      method_name: 'isPalindrome'
    }
  ],
  testCases: [
    // Two Sum Test Cases
    {
      problem_id: 'two-sum',
      input_json: {"nums": [2, 7, 11, 15], "target": 9},
      expected_json: [0, 1],
      test_order: 1
    },
    {
      problem_id: 'two-sum',
      input_json: {"nums": [3, 2, 4], "target": 6},
      expected_json: [1, 2],
      test_order: 2
    },
    {
      problem_id: 'two-sum',
      input_json: {"nums": [3, 3], "target": 6},
      expected_json: [0, 1],
      test_order: 3
    },
    // Reverse String Test Cases
    {
      problem_id: 'reverse-string',
      input_json: ["h","e","l","l","o"],
      expected_json: ["o","l","l","e","h"],
      test_order: 1
    },
    {
      problem_id: 'reverse-string',
      input_json: ["H","a","n","n","a","h"],
      expected_json: ["h","a","n","n","a","H"],
      test_order: 2
    },
    // Valid Palindrome Test Cases
    {
      problem_id: 'valid-palindrome',
      input_json: "A man, a plan, a canal: Panama",
      expected_json: true,
      test_order: 1
    },
    {
      problem_id: 'valid-palindrome',
      input_json: "race a car",
      expected_json: false,
      test_order: 2
    },
    {
      problem_id: 'valid-palindrome',
      input_json: " ",
      expected_json: true,
      test_order: 3
    }
  ]
};

// @ts-ignore: Deno is available in Supabase Edge Functions
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Create Supabase admin client
    // @ts-ignore: Deno env is available in Supabase Edge Functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    // @ts-ignore: Deno env is available in Supabase Edge Functions
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const adminClient = createClient(supabaseUrl, supabaseKey);

    // Check if problems exist
    const { data: existingProblems, error: checkError } = await adminClient
      .from('coding_problems')
      .select('problem_id')
      .limit(1);

    if (checkError) {
      // Table might not exist - return status about the database
      return new Response(
        JSON.stringify({
          status: 'error',
          message: 'Error checking problems table',
          error: checkError.message
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
      );
    }

    let result = {
      status: 'ok',
      message: '',
      problemsCount: existingProblems.length,
      operations: []
    };

    // If no problems exist, seed the database
    if (existingProblems.length === 0) {
      result.message = 'Database empty - seeding data';

      // Insert problems
      const { error: problemsError } = await adminClient
        .from('coding_problems')
        .insert(seedData.problems);

      if (problemsError) {
        result.operations.push({ 
          operation: 'insert_problems',
          status: 'error',
          message: problemsError.message
        });
      } else {
        result.operations.push({ 
          operation: 'insert_problems',
          status: 'success',
          count: seedData.problems.length
        });
      }

      // Insert examples
      const { error: examplesError } = await adminClient
        .from('problem_examples')
        .insert(seedData.examples);

      if (examplesError) {
        result.operations.push({ 
          operation: 'insert_examples',
          status: 'error',
          message: examplesError.message
        });
      } else {
        result.operations.push({ 
          operation: 'insert_examples',
          status: 'success',
          count: seedData.examples.length
        });
      }

      // Insert starter code
      const { error: starterCodeError } = await adminClient
        .from('problem_starter_code')
        .insert(seedData.starterCode);

      if (starterCodeError) {
        result.operations.push({ 
          operation: 'insert_starter_code',
          status: 'error',
          message: starterCodeError.message
        });
      } else {
        result.operations.push({ 
          operation: 'insert_starter_code',
          status: 'success',
          count: seedData.starterCode.length
        });
      }

      // Insert test cases
      const { error: testCasesError } = await adminClient
        .from('problem_test_cases')
        .insert(seedData.testCases);

      if (testCasesError) {
        result.operations.push({ 
          operation: 'insert_test_cases',
          status: 'error',
          message: testCasesError.message
        });
      } else {
        result.operations.push({ 
          operation: 'insert_test_cases',
          status: 'success',
          count: seedData.testCases.length
        });
      }

      // Check if we successfully inserted problems now
      const { data: newProblems, error: countError } = await adminClient
        .from('coding_problems')
        .select('problem_id');

      if (!countError) {
        result.problemsCount = newProblems.length;
      }
    } else {
      result.message = `Database already has ${existingProblems.length} problems`;
    }

    return new Response(
      JSON.stringify(result),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
    );
  } catch (error: any) {
    return new Response(
      JSON.stringify({ 
        status: 'error', 
        message: 'Server error', 
        error: error.message 
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 