// Supabase Edge Function for Code Execution
// Using Judge0 API to execute code and validate solutions

import { corsHeaders } from "../_shared/cors.ts"

console.log("Hello from execute-code function!")

// Language mappings with wider support
const languageMap: { [key: string]: number } = {
  python: 71,    // Python 3.8.1
  javascript: 63, // JavaScript Node.js 12.14.0
  typescript: 74, // TypeScript 3.7.4
  java: 62,      // Java 13.0.1
  cpp: 54,       // C++ GCC 9.2.0
  csharp: 51,    // C# Mono 6.6.0.161
  go: 60,        // Go 1.13.5
  ruby: 72,      // Ruby 2.7.0
};

// Function to call Judge0 API
async function executeOnJudge0(apiKey: string, sourceCode: string, languageId: number, stdin: string = "") { 
  const rapidApiHost = "judge0-ce.p.rapidapi.com";
  const url = `https://${rapidApiHost}/submissions?base64_encoded=false&wait=true`;

  const body = JSON.stringify({
    source_code: sourceCode,
    language_id: languageId,
    stdin: stdin || "",
  });

  console.log(`Calling Judge0: langId=${languageId}, stdin length=${stdin?.length || 0}`);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "X-RapidAPI-Key": apiKey,
      "X-RapidAPI-Host": rapidApiHost,
      "Content-Type": "application/json",
    },
    body: body,
  });

  if (!response.ok) {
    const errorBody = await response.text();
    console.error("Judge0 API Error:", response.status, errorBody);
    throw new Error(`Judge0 API request failed: ${response.statusText} - ${errorBody}`);
  }

  const result = await response.json();
  console.log("Judge0 Result:", result?.status?.id, `Time: ${result?.time}s`, `Memory: ${result?.memory}KB`);
  return result;
}

// Helper to safely decode Base64
function safeDecode(encoded: string | null | undefined): string {
  if (!encoded) return "";
  try {
    return atob(encoded);
  } catch (e) {
    console.warn("Failed to decode base64 string:", encoded);
    return encoded || ""; 
  }
}

// Create Python test wrapper with improved problem detection and handling
function createPythonTestWrapper(userCode: string, expected: string, inputStr: string): string {
  // Extract method name from user code if possible
  const methodNameMatch = userCode.match(/def\s+(\w+)\s*\(/);
  const methodName = methodNameMatch ? methodNameMatch[1] : null;
  
  return `
${userCode}

# Comprehensive Test Framework
import sys
import json
import traceback
import re
import ast
from typing import Any, Dict, List, Optional, Union

class TestFramework:
    def __init__(self):
        self.solution = Solution()
        self.method_name = None
        self.input_data = None
        self.expected_data = None
        
    def find_method(self):
        """Find the correct method to call in the Solution class"""
        # Check if method name is explicitly passed
        if "${methodName}" and hasattr(self.solution, "${methodName}"):
            self.method_name = "${methodName}"
            return
            
        # Try to find it by examining the Solution class
        for name in dir(self.solution):
            if not name.startswith('__') and callable(getattr(self.solution, name)):
                self.method_name = name
                return
                
        # If we couldn't find a method, raise an error
        raise ValueError("No method found in Solution class")
        
    def parse_input_and_expected(self):
        """Parse the input and expected values using robust parsing"""
        try:
            # Try JSON parsing first
            self.input_data = json.loads("""${inputStr}""")
            self.expected_data = json.loads("""${expected}""")
        except json.JSONDecodeError:
            # Fallback: Try Python literal evaluation
            try:
                # Use ast.literal_eval to safely evaluate Python literals
                self.input_data = ast.literal_eval("""${inputStr}""")
                self.expected_data = ast.literal_eval("""${expected}""")
            except (SyntaxError, ValueError):
                # Last resort: use as raw strings
                self.input_data = """${inputStr}"""
                self.expected_data = """${expected}"""
                print(f"DEBUG: Using raw string values: input={self.input_data}, expected={self.expected_data}")
                
    def identify_problem_type(self):
        """Try to determine the problem type based on method name and inputs"""
        if not self.method_name:
            return "unknown"
            
        method_name = self.method_name.lower()
        
        # Two Sum problem detection
        if "twosum" in method_name or "two_sum" in method_name:
            return "twosum"
            
        # String Palindrome detection
        if "palindrome" in method_name:
            return "palindrome"
            
        # Reverse String detection
        if "reversestring" in method_name or "reverse_string" in method_name:
            return "reversestring"
            
        # Default handling
        return "generic"
        
    def execute_solution(self):
        """Execute the solution with proper parameter handling based on problem type"""
        method = getattr(self.solution, self.method_name)
        problem_type = self.identify_problem_type()
        result = None
        
        try:
            # Handle Two Sum problem
            if problem_type == "twosum":
                if isinstance(self.input_data, dict) and "nums" in self.input_data:
                    result = method(self.input_data["nums"], self.input_data.get("target"))
                elif isinstance(self.input_data, list) and len(self.input_data) == 2:
                    result = method(self.input_data[0], self.input_data[1])
                else:
                    raise ValueError(f"Invalid input format for Two Sum problem: {self.input_data}")
                    
            # Handle String Palindrome problem
            elif problem_type == "palindrome":
                if isinstance(self.input_data, str):
                    result = method(self.input_data)
                elif isinstance(self.input_data, dict) and "s" in self.input_data:
                    result = method(self.input_data["s"])
                else:
                    raise ValueError(f"Invalid input format for Palindrome problem: {self.input_data}")
                    
            # Handle Reverse String problem
            elif problem_type == "reversestring":
                if isinstance(self.input_data, list):
                    # This is an in-place modification, so we need to make a copy
                    input_copy = self.input_data.copy()
                    method(input_copy)
                    result = input_copy
                else:
                    raise ValueError(f"Invalid input format for Reverse String problem: {self.input_data}")
                
            # Generic handling
            else:
                # Try multiple approaches in order:
                try:
                    # Approach 1: If input is a dictionary with named parameters
                    if isinstance(self.input_data, dict):
                        result = method(**self.input_data)
                    # Approach 2: If input is a list, unpack as positional arguments
                    elif isinstance(self.input_data, list):
                        result = method(*self.input_data)
                    # Approach 3: Pass the input directly
                    else:
                        result = method(self.input_data)
                except Exception as e1:
                    print(f"DEBUG: First attempt failed: {str(e1)}")
                    # Second attempt: If it's a dict, extract values and pass as positional args
                    try:
                        if isinstance(self.input_data, dict):
                            result = method(*self.input_data.values())
                        else:
                            raise e1
                    except Exception as e2:
                        print(f"DEBUG: Second attempt failed: {str(e2)}")
                        # Last attempt: Try extracting just the first value from dict
                        if isinstance(self.input_data, dict):
                            first_key = next(iter(self.input_data))
                            result = method(self.input_data[first_key])
                        else:
                            raise e2
            
            return result
            
        except Exception as e:
            print(f"EXECUTION_ERROR: {type(e).__name__}: {str(e)}")
            traceback.print_exc()
            raise
            
    def compare_results(self, result):
        """Compare the actual result with the expected value"""
        # Handle special cases of None, True, False
        if result is None and self.expected_data is None:
            return True
        if result is True and (self.expected_data is True or self.expected_data == "true" or self.expected_data == "True"):
            return True
        if result is False and (self.expected_data is False or self.expected_data == "false" or self.expected_data == "False"):
            return True
            
        # Convert to JSON for string comparison to normalize formats
        result_json = json.dumps(result)
        expected_json = json.dumps(self.expected_data)
        
        print(f"RESULT: {result_json}")
        print(f"EXPECTED: {expected_json}")
        
        return result_json == expected_json
        
    def run(self):
        """Main test execution logic"""
        try:
            # Step 1: Find the method to call
            self.find_method()
            print(f"DEBUG: Found method: {self.method_name}")
            
            # Step 2: Parse input and expected values
            self.parse_input_and_expected()
            print(f"DEBUG: Parsed input type: {type(self.input_data).__name__}")
            print(f"DEBUG: Parsed expected type: {type(self.expected_data).__name__}")
            
            # Step 3: Execute the solution
            result = self.execute_solution()
            print(f"DEBUG: Solution executed, result type: {type(result).__name__}")
            
            # Step 4: Compare the results
            passed = self.compare_results(result)
            
            # Step 5: Output the result
            if passed:
                print("PASSED")
            else:
                print("FAILED")
                
        except Exception as e:
            print(f"ERROR: {type(e).__name__}: {str(e)}")
            traceback.print_exc()
            return False
            
        return True

# Run the test
if __name__ == "__main__":
    framework = TestFramework()
    framework.run()
`;
}

// Create wrappers for other languages
function createJavaScriptTestWrapper(userCode: string, expected: string, inputStr: string): string {
  return `
${userCode}

// Test Framework
(function runTest() {
  try {
    // Parse input and expected values
    let inputData;
    let expectedData;
    
    try {
      inputData = JSON.parse(\`${inputStr}\`);
      expectedData = JSON.parse(\`${expected}\`);
    } catch (e) {
      console.log("DEBUG: JSON parsing failed, using raw strings");
      inputData = \`${inputStr}\`;
      expectedData = \`${expected}\`;
    }
    
    // Find the Solution class and method
    if (typeof Solution !== 'function') {
      throw new Error("Solution class is not defined");
    }
    
    const solution = new Solution();
    const methods = Object.getOwnPropertyNames(Solution.prototype)
      .filter(name => name !== 'constructor' && typeof solution[name] === 'function');
      
    if (methods.length === 0) {
      throw new Error("No methods found in Solution class");
    }
    
    const methodName = methods[0]; // Use the first method found
    console.log("DEBUG: Using method: " + methodName);
    
    // Execute the solution
    let result;
    
    // Determine how to call the method based on input type
    if (Array.isArray(inputData)) {
      result = solution[methodName](...inputData);
    } else if (typeof inputData === 'object' && inputData !== null) {
      // Extract values from object
      const args = Object.values(inputData);
      result = solution[methodName](...args);
    } else {
      // Pass directly as single argument
      result = solution[methodName](inputData);
    }
    
    // Compare results
    const resultStr = JSON.stringify(result);
    const expectedStr = JSON.stringify(expectedData);
    
    console.log("RESULT: " + resultStr);
    console.log("EXPECTED: " + expectedStr);
    
    if (resultStr === expectedStr) {
      console.log("PASSED");
    } else {
      console.log("FAILED");
    }
    
  } catch (error) {
    console.log("ERROR: " + error.name + ": " + error.message);
    console.log(error.stack);
  }
})();
`;
}

// Main function handler with improved error handling and response formatting
Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const requestData = await req.json();
    const { code, language, input, expected } = requestData;
    
    console.log("Execution Request:", { 
      language, 
      inputProvided: !!input, 
      expectedProvided: !!expected, 
      codeLength: code?.length 
    });

    // Validation with better error messages
    if (!code) { 
      throw new Error("Missing required field: code. Please provide valid source code.");
    }
    
    if (!language) {
      throw new Error("Missing required field: language. Supported languages: " + Object.keys(languageMap).join(", "));
    }
    
    if (input === undefined) {
      throw new Error("Missing required field: input. Please provide a test input.");
    }
    
    if (expected === undefined) {
      throw new Error("Missing required field: expected. Please provide the expected output.");
    }

    const languageId = languageMap[language.toLowerCase()];
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}. Supported languages: ${Object.keys(languageMap).join(", ")}`);
    }

    const judge0ApiKey = Deno.env.get("JUDGE0_API_KEY");
    if (!judge0ApiKey) {
      console.error("CRITICAL: JUDGE0_API_KEY secret is not set");
      throw new Error("Server configuration error: API key missing. Please set the JUDGE0_API_KEY environment variable.");
    }

    // Generate language-specific test wrapper
    let testCode = code;
    let wrapperUsed = false;
    
    if (language.toLowerCase() === 'python') {
      testCode = createPythonTestWrapper(code, expected, input);
      wrapperUsed = true;
      console.log("Generated Python test wrapper");
    } else if (language.toLowerCase() === 'javascript' || language.toLowerCase() === 'typescript') {
      testCode = createJavaScriptTestWrapper(code, expected, input);
      wrapperUsed = true;
      console.log("Generated JavaScript/TypeScript test wrapper");
    }
    // Add handlers for other languages as needed
    
    // For languages without wrappers, just execute the code with input as stdin
    const stdin = wrapperUsed ? "" : input;

    // Execute code on Judge0
    const result = await executeOnJudge0(judge0ApiKey, testCode, languageId, stdin);
    
    // Process results with improved error handling
    const stdout = safeDecode(result.stdout || "").trim();
    const stderr = safeDecode(result.stderr || "");
    const compileErr = safeDecode(result.compile_output || "");
    
    console.log("Raw stdout:", stdout);
    console.log("Raw stderr:", stderr);
    
    let passed = false;
    let message = "";
    let error: string | null = null;
    let actualValue: any = null;
    
    // Check for compilation errors
    if (result.status?.id === 6) { // Compilation Error
      message = "Compilation Error";
      error = compileErr || "Unknown compilation error";
    } 
    // Check for runtime errors or other Judge0 status codes
    else if (result.status?.id !== 3) { // Not "Accepted"
      message = result.status?.description || "Execution Error";
      error = stderr || "Unknown execution error";
    } 
    // Process successful execution
    else {
      // If using wrappers, check for our test markers in stdout
      if (wrapperUsed) {
        if (stdout.includes("PASSED")) {
          passed = true;
          message = "Passed";
        } else if (stdout.includes("FAILED")) {
          passed = false;
          message = "Wrong Answer";
          
          // Extract actual result from stdout
          const resultMatch = stdout.match(/RESULT: (.*)/);
          if (resultMatch && resultMatch[1]) {
            try {
              actualValue = JSON.parse(resultMatch[1]);
            } catch (e) {
              actualValue = resultMatch[1]; // Use as string if can't parse
            }
          }
          
          // Add debugging info to error
          const errorLines = stdout.split('\n').filter(line => 
            line.startsWith("DEBUG:") || line.startsWith("ERROR:") || line.startsWith("EXECUTION_ERROR:")
          );
          if (errorLines.length > 0) {
            error = errorLines.join('\n');
          }
        } else if (stdout.includes("ERROR:") || stdout.includes("EXECUTION_ERROR:")) {
          passed = false;
          message = "Execution Error";
          // Extract error details from stdout
          const errorRegex = /(ERROR|EXECUTION_ERROR): (.*)/;
          const errorMatch = stdout.match(errorRegex);
          if (errorMatch && errorMatch[2]) {
            error = errorMatch[2];
          } else {
            error = stderr || stdout || "Unknown error during execution";
          }
        } else {
          passed = false;
          message = "Unexpected Output";
          error = `Output doesn't contain expected markers. Output: ${stdout.substring(0, 200)}${stdout.length > 200 ? '...' : ''}`;
        }
      } else {
        // For languages without wrappers, we need to directly compare output with expected
        const trimmedOutput = stdout.trim();
        const trimmedExpected = expected.trim();
        
        passed = trimmedOutput === trimmedExpected;
        message = passed ? "Passed" : "Wrong Answer";
        
        if (!passed) {
          actualValue = trimmedOutput;
          error = `Expected: ${trimmedExpected}\nGot: ${trimmedOutput}`;
        }
      }
    }

    // Return comprehensive result
    return new Response(JSON.stringify({
      passed,
      message,
      stdout: stdout,
      stderr,
      error,
      actualValue,
      time: result.time,
      memory: result.memory,
      compile_output: compileErr
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error: any) {
    console.error("Error in Edge Function handler:", error);
    return new Response(JSON.stringify({ 
      passed: false,
      message: "Server Error",
      error: error.message || "An unexpected server error occurred",
      stderr: null
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200, // Use 200 to avoid client fetch errors
    });
  }
}); 