# Python Code Editor

This Python Code Editor allows users to solve coding problems using the `class Solution` structure, similar to platforms like LeetCode and HackerRank.

## Features

- Python syntax highlighting and autocompletion
- Built-in test runner for validating solutions
- Class-based solution structure (`class Solution:`)
- Ability to add new coding problems
- Problems are stored in local storage for persistence

## How to Use

1. Navigate to `/code-editor` in the application
2. Select a problem from the dropdown menu
3. Write your solution in the code editor using the `class Solution` structure
4. Click "Run Code" to test your solution against the test cases
5. View results in the test results panel

## Adding New Problems

You can add new problems by clicking the "Add Problem" button. This will create a template problem that you can then customize.

To fully customize a problem, you should:

1. Update the problem title
2. Set the difficulty level
3. Write a clear description
4. Add example inputs and outputs
5. Define test cases with expected results

## Solution Structure

All solutions must follow this structure:

```python
class Solution:
    def solve(self, params):
        # Your code here
        return result
```

The `solve` method should accept the input parameters and return the solution.

## Technical Details

- The editor uses Monaco Editor for code editing
- Test results are currently simulated (in a production environment, code would be executed server-side)
- Problems are stored in localStorage for persistence 