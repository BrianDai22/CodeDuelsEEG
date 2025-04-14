// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Import Supabase client library - may not be needed if only using env vars
// import { createClient } from '@supabase/supabase-js'

// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
// Remove specific serve import, rely on Deno.serve
// import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from "../_shared/cors.ts"

console.log("Hello from Functions!")

// Judge0 Language IDs (add more if needed)
const languageMap: { [key: string]: number } = {
  python: 71, // Python 3.8.1
  javascript: 63, // Node.js 12.14.0
  // Add other languages if you plan to support them
};

// Function to call Judge0 API via RapidAPI
async function executeOnJudge0(apiKey: string, sourceCode: string, languageId: number, stdin?: string, expectedOutput?: string) {
  const rapidApiHost = "judge0-ce.p.rapidapi.com";
  const url = `https://${rapidApiHost}/submissions?base64_encoded=false&wait=true`; // Wait for result

  const body = JSON.stringify({
    source_code: sourceCode,
    language_id: languageId,
    stdin: stdin,
    expected_output: expectedOutput,
    // You can add CPU/memory limits here if needed
    // cpu_time_limit: 1, // e.g., 1 second
    // memory_limit: 128000, // e.g., 128 MB (in KB)
  });

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
    console.error("Judge0 API Error Status:", response.status);
    console.error("Judge0 API Error Body:", errorBody);
    throw new Error(`Judge0 API request failed: ${response.statusText}`);
  }

  const result = await response.json();
  console.log("Judge0 Raw Result:", result);
  return result; // Contains stdout, stderr, status, time, memory, etc.
}

// Use Deno.serve as in the default template
Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { code, language, testCases } = await req.json();
    console.log("Edge function received request:", { language, testCasesCount: testCases?.length });

    // Validate input
    if (!code || !language || !Array.isArray(testCases)) {
      return new Response(JSON.stringify({ error: "Missing code, language, or testCases" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    const languageId = languageMap[language.toLowerCase()];
    if (!languageId) {
      return new Response(JSON.stringify({ error: `Unsupported language: ${language}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 400,
      });
    }

    // Retrieve the API key from secrets using Deno.env.get
    const judge0ApiKey = Deno.env.get("JUDGE0_API_KEY");
    if (!judge0ApiKey) {
      console.error("JUDGE0_API_KEY secret is not set in Supabase project settings.");
      return new Response(JSON.stringify({ error: "API key configuration error" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 500,
      });
    }

    // Execute code for each test case in parallel
    const executionPromises = testCases.map(testCase => 
      executeOnJudge0(
        judge0ApiKey, 
        code, 
        languageId, 
        // Ensure input/output are strings as Judge0 expects
        String(testCase.input ?? ''), 
        String(testCase.expected ?? '') 
      )
    );

    const judge0Results = await Promise.all(executionPromises);

    // Format results
    const formattedResults = judge0Results.map((result, index) => {
      const testCase = testCases[index];
      let passed = false;
      let message = "Failed";
      // Judge0 stdout/stderr are typically base64 encoded, decode them
      let actualOutput = "";
      let compileOutput = "";
      let stdErr = "";

      try {
        actualOutput = result.stdout ? atob(result.stdout) : "";
      } catch (e) { 
        console.warn("Failed to decode stdout (might not be base64):", result.stdout, e);
        actualOutput = result.stdout || ""; // Use raw if decode fails
      }
      try {
        compileOutput = result.compile_output ? atob(result.compile_output) : "";
      } catch (e) {
         console.warn("Failed to decode compile_output:", result.compile_output, e);
         compileOutput = result.compile_output || "";
      }
        try {
        stdErr = result.stderr ? atob(result.stderr) : "";
      } catch (e) {
         console.warn("Failed to decode stderr:", result.stderr, e);
         stdErr = result.stderr || "";
      }

      // Trim whitespace from actual output for comparison if needed
      const trimmedOutput = actualOutput.trim();
      const expectedOutputString = String(testCase.expected ?? '').trim();

      if (result.status.id === 3) { // Status ID 3 means "Accepted"
        // Judge0 'Accepted' means it matched expected_output if provided, 
        // otherwise it just means successful execution.
        // We might need to compare outputs manually if expectedOutput wasn't sent to Judge0
        // or if we want stricter comparison (e.g., ignoring whitespace differences)
        if (expectedOutputString === trimmedOutput) {
            passed = true;
            message = "Passed";
        } else {
            // If Judge0 accepted but output doesn't match our check, mark as Wrong Answer
            passed = false;
            message = "Wrong Answer";
        }
      } else if (result.status.id === 4) { // Status ID 4 means "Wrong Answer"
        message = "Wrong Answer";
      } else if (result.status.id === 5) { // Status ID 5 means "Time Limit Exceeded"
        message = `Time Limit Exceeded (${result.time}s)`;
        actualOutput = "TLE";
      } else if (result.status.id === 6) { // Status ID 6 means "Compilation Error"
        message = "Compilation Error";
        actualOutput = compileOutput || stdErr || "Compilation failed";
      } else if (result.status.id >= 7 && result.status.id <= 12) { // Runtime Errors
        message = `Runtime Error (${result.status.description})`;
        actualOutput = stdErr || "Runtime Error";
      } else if (result.status.id === 13) { // Internal Error
        message = "Internal Server Error";
        actualOutput = "Server Error";
      } else { // Other statuses
        message = result.status.description || "Execution Error";
        actualOutput = stdErr || actualOutput || "Unknown Error";
      }

      // Ensure output is a string
      if (actualOutput === null || actualOutput === undefined) {
         actualOutput = "" // Represent null/undefined output as empty string
      }
      
      return {
        passed: passed,
        message: message,
        input: testCase.input,
        expected: testCase.expected,
        // Return the decoded & trimmed output for consistency
        actual: passed ? expectedOutputString : trimmedOutput, 
        time: result.time,
        memory: result.memory,
      };
    });

    console.log("Formatted results:", formattedResults);

    return new Response(JSON.stringify({ results: formattedResults }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 200,
    });

  } catch (error) {
    console.error("Error in Edge Function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
      status: 500,
    });
  }
})

/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/execute-code' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
