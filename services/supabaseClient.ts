import { createClient } from '@supabase/supabase-js';

const PROJECT_URL = 'https://qlthnmclefdwszoajhhn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsdGhubWNsZWZkd3N6b2FqaGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzQzMTIsImV4cCI6MjA4MDc1MDMxMn0.PBtmV8OJ8izwyCL2E9sVboDAOekt_r4BaLX2zRPSUg8';

export const supabase = createClient(PROJECT_URL, ANON_KEY);