-- Seed data for problems

-- Insert problems
INSERT INTO coding_problems (problem_id, title, description, difficulty)
VALUES 
('two-sum', 'Two Sum', 'Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.', 'easy'),
('reverse-string', 'Reverse String', 'Write a function that reverses a string. The input string is given as an array of characters s.', 'easy'),
('valid-palindrome', 'Valid Palindrome', 'A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward.

Given a string s, return true if it is a palindrome, or false otherwise.', 'easy');

-- Insert examples for Two Sum
INSERT INTO problem_examples (problem_id, input, output, explanation, display_order)
VALUES 
('two-sum', 'nums = [2,7,11,15], target = 9', '[0,1]', 'Because nums[0] + nums[1] == 9', 1),
('two-sum', 'nums = [3,2,4], target = 6', '[1,2]', NULL, 2);

-- Insert examples for Reverse String
INSERT INTO problem_examples (problem_id, input, output, explanation, display_order)
VALUES 
('reverse-string', 's = ["h","e","l","l","o"]', '["o","l","l","e","h"]', NULL, 1),
('reverse-string', 's = ["H","a","n","n","a","h"]', '["h","a","n","n","a","H"]', NULL, 2);

-- Insert examples for Valid Palindrome
INSERT INTO problem_examples (problem_id, input, output, explanation, display_order)
VALUES 
('valid-palindrome', 's = "A man, a plan, a canal: Panama"', 'true', '"amanaplanacanalpanama" is a palindrome.', 1),
('valid-palindrome', 's = "race a car"', 'false', '"raceacar" is not a palindrome.', 2),
('valid-palindrome', 's = " "', 'true', 'An empty string reads the same forwards and backwards.', 3);

-- Insert starter code for Two Sum
INSERT INTO problem_starter_code (problem_id, language, code, method_name)
VALUES
('two-sum', 'python', 'class Solution:
    def twoSum(self, nums, target):
        """
        :type nums: List[int]
        :type target: int
        :rtype: List[int]
        """
        # Write your solution here
        pass', 'twoSum'),
        
('two-sum', 'javascript', 'class Solution {
    twoSum(nums, target) {
        // Write your solution here
        return [];
    }
}', 'twoSum'),

('two-sum', 'typescript', 'class Solution {
    twoSum(nums: number[], target: number): number[] {
        // Write your solution here
        return [];
    }
}', 'twoSum');

-- Insert starter code for Reverse String
INSERT INTO problem_starter_code (problem_id, language, code, method_name)
VALUES
('reverse-string', 'python', 'class Solution:
    def reverseString(self, s):
        """
        :type s: List[str]
        :rtype: None Do not return anything, modify s in-place instead.
        """
        # Write your solution here
        pass', 'reverseString'),
        
('reverse-string', 'javascript', 'class Solution {
    reverseString(s) {
        // Write your solution here - modify s in-place
        return;
    }
}', 'reverseString'),

('reverse-string', 'typescript', 'class Solution {
    reverseString(s: string[]): void {
        // Write your solution here - modify s in-place
        return;
    }
}', 'reverseString');

-- Insert starter code for Valid Palindrome
INSERT INTO problem_starter_code (problem_id, language, code, method_name)
VALUES
('valid-palindrome', 'python', 'class Solution:
    def isPalindrome(self, s: str) -> bool:
        # Write your solution here
        pass', 'isPalindrome'),
        
('valid-palindrome', 'javascript', 'class Solution {
    isPalindrome(s) {
        // Write your solution here
        return false;
    }
}', 'isPalindrome'),

('valid-palindrome', 'typescript', 'class Solution {
    isPalindrome(s: string): boolean {
        // Write your solution here
        return false;
    }
}', 'isPalindrome');

-- Insert test cases for Two Sum
INSERT INTO problem_test_cases (problem_id, input_json, expected_json, test_order)
VALUES
('two-sum', '{"nums": [2, 7, 11, 15], "target": 9}', '[0, 1]', 1),
('two-sum', '{"nums": [3, 2, 4], "target": 6}', '[1, 2]', 2),
('two-sum', '{"nums": [3, 3], "target": 6}', '[0, 1]', 3),
('two-sum', '{"nums": [1, 5, 8, 3, 9, 2], "target": 10}', '[0, 4]', 4),
('two-sum', '{"nums": [1, 2, 3, 4, 5], "target": 9}', '[3, 4]', 5);

-- Insert test cases for Reverse String
INSERT INTO problem_test_cases (problem_id, input_json, expected_json, test_order)
VALUES
('reverse-string', '["h","e","l","l","o"]', '["o","l","l","e","h"]', 1),
('reverse-string', '["H","a","n","n","a","h"]', '["h","a","n","n","a","H"]', 2),
('reverse-string', '["a"]', '["a"]', 3),
('reverse-string', '["a","b"]', '["b","a"]', 4);

-- Insert test cases for Valid Palindrome
INSERT INTO problem_test_cases (problem_id, input_json, expected_json, test_order)
VALUES
('valid-palindrome', '"A man, a plan, a canal: Panama"', 'true', 1),
('valid-palindrome', '"race a car"', 'false', 2),
('valid-palindrome', '" "', 'true', 3),
('valid-palindrome', '"Was it a car or a cat I saw?"', 'true', 4),
('valid-palindrome', '"0P"', 'false', 5),
('valid-palindrome', '".,?"', 'true', 6); 