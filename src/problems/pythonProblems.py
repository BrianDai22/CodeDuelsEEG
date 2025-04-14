"""
Python Problems Database

This file contains coding problems in Python format with Class Solution structure.
"""

class PythonProblem:
    def __init__(self, id, title, difficulty, description, examples, test_cases, starter_code):
        self.id = id
        self.title = title
        self.difficulty = difficulty  # 'easy', 'medium', 'hard'
        self.description = description
        self.examples = examples  # List of dicts with input, output, and optional explanation
        self.test_cases = test_cases  # List of dicts with input and expected output
        self.starter_code = starter_code
    
    def to_dict(self):
        return {
            'id': self.id,
            'title': self.title,
            'difficulty': self.difficulty,
            'description': self.description,
            'examples': self.examples,
            'test_cases': self.test_cases,
            'starter_code': self.starter_code
        }

# Default starter code template
DEFAULT_STARTER = """class Solution:
    def solve(self, params):
        # Your code here
        pass
"""

# Example problems
PROBLEMS = [
    PythonProblem(
        id="two-sum",
        title="Two Sum",
        difficulty="easy",
        description="Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target. You may assume that each input would have exactly one solution, and you may not use the same element twice.",
        examples=[
            {"input": "nums = [2,7,11,15], target = 9", "output": "[0,1]", "explanation": "Because nums[0] + nums[1] == 9, we return [0, 1]."},
            {"input": "nums = [3,2,4], target = 6", "output": "[1,2]", "explanation": "Because nums[1] + nums[2] == 6, we return [1, 2]."}
        ],
        test_cases=[
            {"input": {"nums": [2,7,11,15], "target": 9}, "expected": [0,1]},
            {"input": {"nums": [3,2,4], "target": 6}, "expected": [1,2]},
            {"input": {"nums": [3,3], "target": 6}, "expected": [0,1]},
            {"input": {"nums": [1,4,8,3,2,9,15], "target": 17}, "expected": [2,6]},
            {"input": {"nums": [1,3,5,7,9], "target": 8}, "expected": [0,3]}
        ],
        starter_code="""class Solution:
    def solve(self, nums, target):
        # Your code here
        pass
"""
    ),
    
    PythonProblem(
        id="palindrome",
        title="Valid Palindrome",
        difficulty="easy",
        description="A phrase is a palindrome if, after converting all uppercase letters into lowercase letters and removing all non-alphanumeric characters, it reads the same forward and backward. Given a string s, return true if it is a palindrome, or false otherwise.",
        examples=[
            {"input": "s = 'A man, a plan, a canal: Panama'", "output": "True", "explanation": "'amanaplanacanalpanama' is a palindrome."},
            {"input": "s = 'race a car'", "output": "False", "explanation": "'raceacar' is not a palindrome."}
        ],
        test_cases=[
            {"input": {"s": "A man, a plan, a canal: Panama"}, "expected": True},
            {"input": {"s": "race a car"}, "expected": False},
            {"input": {"s": " "}, "expected": True},
            {"input": {"s": "No lemon, no melon"}, "expected": True},
            {"input": {"s": "Was it a car or a cat I saw?"}, "expected": True}
        ],
        starter_code="""class Solution:
    def solve(self, s):
        # Your code here
        pass
"""
    ),
    
    PythonProblem(
        id="max-subarray",
        title="Maximum Subarray",
        difficulty="medium",
        description="Given an integer array nums, find the contiguous subarray (containing at least one number) which has the largest sum and return its sum.",
        examples=[
            {"input": "nums = [-2,1,-3,4,-1,2,1,-5,4]", "output": "6", "explanation": "The contiguous subarray [4,-1,2,1] has the largest sum = 6."},
            {"input": "nums = [1]", "output": "1", "explanation": "The subarray [1] has the largest sum 1."}
        ],
        test_cases=[
            {"input": {"nums": [-2,1,-3,4,-1,2,1,-5,4]}, "expected": 6},
            {"input": {"nums": [1]}, "expected": 1},
            {"input": {"nums": [5,4,-1,7,8]}, "expected": 23},
            {"input": {"nums": [-1]}, "expected": -1},
            {"input": {"nums": [-2,-1]}, "expected": -1}
        ],
        starter_code="""class Solution:
    def solve(self, nums):
        # Your code here
        pass
"""
    )
]

# Functions to interact with problems
def get_all_problems():
    """Return all problems as dictionaries"""
    return [problem.to_dict() for problem in PROBLEMS]

def get_problem_by_id(problem_id):
    """Return a specific problem by ID"""
    for problem in PROBLEMS:
        if problem.id == problem_id:
            return problem.to_dict()
    return None

def add_problem(problem_data):
    """Add a new problem to the database"""
    # In a real implementation, this would save to a database
    new_problem = PythonProblem(
        id=problem_data.get('id'),
        title=problem_data.get('title'),
        difficulty=problem_data.get('difficulty'),
        description=problem_data.get('description'),
        examples=problem_data.get('examples', []),
        test_cases=problem_data.get('test_cases', []),
        starter_code=problem_data.get('starter_code', DEFAULT_STARTER)
    )
    PROBLEMS.append(new_problem)
    return new_problem.to_dict()

# Support for evaluating code
def evaluate_solution(problem_id, code, test_case):
    """
    This would normally be done server-side for security.
    For now we'll include a placeholder for the evaluation logic.
    
    In a real implementation:
    1. Send code to a sandbox environment
    2. Execute it with the test case input
    3. Compare output to expected
    4. Return result
    """
    return {
        'result': 'Not implemented - would run in a secure server environment',
        'message': 'Evaluation must be implemented server-side'
    } 