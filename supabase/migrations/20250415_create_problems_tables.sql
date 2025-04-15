-- Create problems and test cases tables
-- This will securely store problems and test cases in the database

-- Create enum for difficulty
CREATE TYPE difficulty_level AS ENUM ('easy', 'medium', 'hard');

-- Create table for coding problems
CREATE TABLE coding_problems (
  id SERIAL PRIMARY KEY,
  problem_id TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  difficulty difficulty_level NOT NULL DEFAULT 'easy',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Table for problem examples (shown to users)
CREATE TABLE problem_examples (
  id SERIAL PRIMARY KEY,
  problem_id TEXT REFERENCES coding_problems(problem_id) ON DELETE CASCADE,
  input TEXT NOT NULL,
  output TEXT NOT NULL,
  explanation TEXT,
  display_order INT NOT NULL DEFAULT 0
);

-- Table for starter code templates by language
CREATE TABLE problem_starter_code (
  id SERIAL PRIMARY KEY,
  problem_id TEXT REFERENCES coding_problems(problem_id) ON DELETE CASCADE,
  language TEXT NOT NULL,
  code TEXT NOT NULL,
  method_name TEXT,
  UNIQUE(problem_id, language)
);

-- Table for test cases (not shown to users, used for validation)
CREATE TABLE problem_test_cases (
  id SERIAL PRIMARY KEY,
  problem_id TEXT REFERENCES coding_problems(problem_id) ON DELETE CASCADE,
  input_json JSONB NOT NULL,
  expected_json JSONB NOT NULL,
  is_hidden BOOLEAN NOT NULL DEFAULT false,
  test_order INT NOT NULL DEFAULT 0
);

-- Create function to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on coding_problems table
CREATE TRIGGER update_coding_problems_updated_at
BEFORE UPDATE ON coding_problems
FOR EACH ROW
EXECUTE FUNCTION update_updated_at();

-- Create RLS policies
ALTER TABLE coding_problems ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_examples ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_starter_code ENABLE ROW LEVEL SECURITY;
ALTER TABLE problem_test_cases ENABLE ROW LEVEL SECURITY;

-- Anyone can read problems, examples, and starter code
CREATE POLICY "Anyone can read problems" ON coding_problems
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read problem examples" ON problem_examples
  FOR SELECT USING (true);

CREATE POLICY "Anyone can read starter code" ON problem_starter_code
  FOR SELECT USING (true);

-- Only authenticated users can read test cases
-- But hidden test cases are only visible to admins
CREATE POLICY "Authenticated users can read visible test cases" ON problem_test_cases
  FOR SELECT USING (
    auth.role() = 'authenticated' AND 
    (is_hidden = false OR auth.jwt()->>'role' = 'admin')
  );

-- Only admins can modify all tables
CREATE POLICY "Only admins can insert problems" ON coding_problems
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'admin');
CREATE POLICY "Only admins can update problems" ON coding_problems
  FOR UPDATE USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY "Only admins can delete problems" ON coding_problems
  FOR DELETE USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Only admins can insert examples" ON problem_examples
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'admin');
CREATE POLICY "Only admins can update examples" ON problem_examples
  FOR UPDATE USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY "Only admins can delete examples" ON problem_examples
  FOR DELETE USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Only admins can insert starter code" ON problem_starter_code
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'admin');
CREATE POLICY "Only admins can update starter code" ON problem_starter_code
  FOR UPDATE USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY "Only admins can delete starter code" ON problem_starter_code
  FOR DELETE USING (auth.jwt()->>'role' = 'admin');

CREATE POLICY "Only admins can insert test cases" ON problem_test_cases
  FOR INSERT WITH CHECK (auth.jwt()->>'role' = 'admin');
CREATE POLICY "Only admins can update test cases" ON problem_test_cases
  FOR UPDATE USING (auth.jwt()->>'role' = 'admin');
CREATE POLICY "Only admins can delete test cases" ON problem_test_cases
  FOR DELETE USING (auth.jwt()->>'role' = 'admin'); 