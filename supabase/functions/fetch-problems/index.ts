// Edge Function to fetch coding problems and test cases securely
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// This function transforms database problem objects to the format expected by the frontend
const transformProblem = (problem: any, examples: any[], starterCodes: any[], testCases: any[] = []) => {
  return {
    id: problem.problem_id,
    title: problem.title,
    description: problem.description,
    difficulty: problem.difficulty,
    examples: examples.map(ex => ({
      input: ex.input,
      output: ex.output,
      explanation: ex.explanation || undefined
    })),
    languages: starterCodes.reduce((acc, code) => {
      acc[code.language] = code.code;
      return acc;
    }, {}),
    methodName: starterCodes[0]?.method_name || undefined,
    testCases: testCases.map(tc => ({
      input: tc.input_json,
      expected: tc.expected_json
    }))
  };
};

// @ts-ignore: Deno is available in Supabase Edge Functions
Deno.serve(async (req) => {
  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Create supabase client
    // @ts-ignore: Deno env is available in Supabase Edge Functions
    const supabaseUrl = Deno.env.get('SUPABASE_URL') || '';
    // @ts-ignore: Deno env is available in Supabase Edge Functions
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get parameters from the URL or headers
    const url = new URL(req.url);
    // We support both URL params and header params for flexibility
    let problemId = url.searchParams.get('id');
    let includeTestCases = url.searchParams.get('includeTestCases') === 'true';
    
    // Also check headers for parameters (used by the browser client)
    if (!problemId) {
      problemId = req.headers.get('x-problem-id');
    }
    
    if (!includeTestCases) {
      includeTestCases = req.headers.get('x-include-test-cases') === 'true';
    }
    
    // Get auth token from request (if available)
    const authHeader = req.headers.get('Authorization');
    const token = authHeader ? authHeader.replace('Bearer ', '') : null;
    
    // Create auth client if token is present
    const authClient = token ? createClient(
      supabaseUrl,
      supabaseKey,
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    ) : supabase;

    if (problemId) {
      // Fetch a single problem by ID
      const { data: problem, error: problemError } = await supabase
        .from('coding_problems')
        .select('*')
        .eq('problem_id', problemId)
        .single();

      if (problemError) {
        return new Response(
          JSON.stringify({ error: 'Problem not found' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 404 }
        );
      }

      // Fetch examples
      const { data: examples, error: examplesError } = await supabase
        .from('problem_examples')
        .select('*')
        .eq('problem_id', problemId)
        .order('display_order', { ascending: true });

      if (examplesError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch examples' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Fetch starter code
      const { data: starterCodes, error: codesError } = await supabase
        .from('problem_starter_code')
        .select('*')
        .eq('problem_id', problemId);

      if (codesError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch starter code' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      let testCases: any[] = [];
      if (includeTestCases) {
        // Use auth client when fetching test cases (RLS will restrict to authenticated users)
        const { data: testCasesData, error: testCasesError } = await authClient
          .from('problem_test_cases')
          .select('*')
          .eq('problem_id', problemId)
          .order('test_order', { ascending: true });

        if (testCasesError && testCasesError.code !== 'PGRST116') {
          // PGRST116 is permission denied, which is expected for non-auth users
          return new Response(
            JSON.stringify({ error: 'Failed to fetch test cases' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
          );
        }

        testCases = testCasesData || [];
      }

      // Transform to the format expected by frontend
      const transformedProblem = transformProblem(problem, examples, starterCodes, testCases);

      return new Response(
        JSON.stringify(transformedProblem),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    } else {
      // Fetch all problems (without test cases for efficiency)
      const { data: problems, error: problemsError } = await supabase
        .from('coding_problems')
        .select('*')
        .order('id', { ascending: true });

      if (problemsError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch problems' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Fetch examples and starter code for all problems
      const { data: allExamples, error: examplesError } = await supabase
        .from('problem_examples')
        .select('*')
        .order('display_order', { ascending: true });

      if (examplesError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch examples' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      const { data: allStarterCodes, error: codesError } = await supabase
        .from('problem_starter_code')
        .select('*');

      if (codesError) {
        return new Response(
          JSON.stringify({ error: 'Failed to fetch starter code' }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
        );
      }

      // Transform all problems
      const transformedProblems = problems.map(problem => {
        const problemExamples = allExamples.filter(ex => ex.problem_id === problem.problem_id);
        const problemCodes = allStarterCodes.filter(code => code.problem_id === problem.problem_id);
        
        return transformProblem(problem, problemExamples, problemCodes);
      });

      return new Response(
        JSON.stringify(transformedProblems),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 200 }
      );
    }
  } catch (error) {
    console.error('Error fetching problems:', error);
    
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' }, status: 500 }
    );
  }
}); 