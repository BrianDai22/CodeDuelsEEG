#!/usr/bin/env python3
"""
Test script for execute-code function
Run this script to test if code execution is working
"""

import json
import requests
import sys

# Configuration
SUPABASE_URL = "https://fdryghcvdeeybrnykppd.supabase.co"  # Use project URL instead of localhost
FUNCTION_PATH = "/functions/v1/execute-code"
ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0"

# Simple Python test cases
TEST_CASES = [
    {
        "name": "Two Sum (Python)",
        "code": """
class Solution:
    def twoSum(self, nums, target):
        for i in range(len(nums)):
            for j in range(i + 1, len(nums)):
                if nums[i] + nums[j] == target:
                    return [i, j]
        return []
        """,
        "language": "python",
        "input": '{"nums": [2, 7, 11, 15], "target": 9}',
        "expected": "[0, 1]"
    },
    {
        "name": "Palindrome Check (Python)",
        "code": """
class Solution:
    def isPalindrome(self, s):
        # Convert to lowercase and remove non-alphanumeric characters
        clean_s = ''.join(c.lower() for c in s if c.isalnum())
        # Check if the string is equal to its reverse
        return clean_s == clean_s[::-1]
        """,
        "language": "python",
        "input": '"A man, a plan, a canal: Panama"',
        "expected": "true"
    },
    {
        "name": "Reverse String (Python)",
        "code": """
class Solution:
    def reverseString(self, s):
        # In-place reversal
        left, right = 0, len(s) - 1
        while left < right:
            s[left], s[right] = s[right], s[left]
            left += 1
            right -= 1
        """,
        "language": "python",
        "input": '["h","e","l","l","o"]',
        "expected": '["o","l","l","e","h"]'
    },
    {
        "name": "Two Sum (JavaScript)",
        "code": """
class Solution {
    twoSum(nums, target) {
        for (let i = 0; i < nums.length; i++) {
            for (let j = i + 1; j < nums.length; j++) {
                if (nums[i] + nums[j] === target) {
                    return [i, j];
                }
            }
        }
        return [];
    }
}
        """,
        "language": "javascript",
        "input": '{"nums": [2, 7, 11, 15], "target": 9}',
        "expected": "[0, 1]"
    },
    {
        "name": "Palindrome Check (JavaScript)",
        "code": """
class Solution {
    isPalindrome(s) {
        // Convert to lowercase and remove non-alphanumeric characters
        const cleanS = s.toLowerCase().replace(/[^a-z0-9]/g, '');
        // Check if the string is equal to its reverse
        return cleanS === cleanS.split('').reverse().join('');
    }
}
        """,
        "language": "javascript",
        "input": '"A man, a plan, a canal: Panama"',
        "expected": "true"
    },
    {
        "name": "Reverse String (TypeScript)",
        "code": """
class Solution {
    reverseString(s: string[]): void {
        // In-place reversal
        let left = 0, right = s.length - 1;
        while (left < right) {
            [s[left], s[right]] = [s[right], s[left]];
            left++;
            right--;
        }
    }
}
        """,
        "language": "typescript",
        "input": '["h","e","l","l","o"]',
        "expected": '["o","l","l","e","h"]'
    }
]

def test_execute_code():
    """Test execute-code function with various test cases"""
    url = SUPABASE_URL + FUNCTION_PATH
    headers = {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {ANON_KEY}"
    }

    print(f"Testing execute-code function at {url}")
    print("-" * 50)

    success_count = 0
    for idx, test_case in enumerate(TEST_CASES, 1):
        print(f"Test Case #{idx}: {test_case['name']}")
        print(f"Input: {test_case['input']}")
        print(f"Expected: {test_case['expected']}")
        
        try:
            response = requests.post(
                url,
                headers=headers,
                json={
                    "code": test_case["code"],
                    "language": test_case["language"],
                    "input": test_case["input"],
                    "expected": test_case["expected"]
                },
                timeout=30
            )
            
            if response.status_code != 200:
                print(f"❌ HTTP Error: {response.status_code}")
                print(response.text)
                continue
                
            result = response.json()
            print(f"Result: {json.dumps(result, indent=2)}")
            
            if result.get("passed"):
                print("✅ Test passed!")
                success_count += 1
            else:
                print(f"❌ Test failed: {result.get('message')}")
                if result.get("error"):
                    print(f"Error: {result.get('error')}")
                    
        except Exception as e:
            print(f"❌ Exception: {e}")
        
        print("-" * 50)
    
    print(f"Summary: {success_count}/{len(TEST_CASES)} tests passed")
    return success_count == len(TEST_CASES)

if __name__ == "__main__":
    success = test_execute_code()
    sys.exit(0 if success else 1) 