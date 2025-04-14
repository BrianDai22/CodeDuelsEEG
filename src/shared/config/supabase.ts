import { createClient } from '@supabase/supabase-js'

// Ensure these environment variables are set in your .env file
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  console.error('Error: VITE_SUPABASE_URL is not defined. Please add it to your .env file.');
}

if (!supabaseAnonKey) {
  console.error('Error: VITE_SUPABASE_ANON_KEY is not defined. Please add it to your .env file.');
}

// Create and export the Supabase client instance
export const supabase = createClient(supabaseUrl!, supabaseAnonKey!)

// Log initialization status (optional)
if (supabaseUrl && supabaseAnonKey) {
  console.log('Supabase client initialized successfully.');
} else {
  console.error('Supabase client initialization failed due to missing environment variables.');
} 