import { createClient } from '@supabase/supabase-js';

// Access environment variables
// Note: In Vite, these might need import.meta.env.VITE_SUPABASE_URL, 
// but we use process.env to match the existing pattern in geminiService.ts
const PROJECT_URL = process.env.SUPABASE_URL || 'https://qlthnmclefdwszoajhhn.supabase.co';
const ANON_KEY = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsdGhubWNsZWZkd3N6b2FqaGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzQzMTIsImV4cCI6MjA4MDc1MDMxMn0.PBtmV8OJ8izwyCL2E9sVboDAOekt_r4BaLX2zRPSUg8';

export const supabase = createClient(PROJECT_URL, ANON_KEY);