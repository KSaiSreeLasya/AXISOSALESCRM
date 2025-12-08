import { createClient } from '@supabase/supabase-js';

// Helper to safely get env vars from Vite (import.meta.env) or standard process.env
const getEnv = (key: string) => {
  // Check for Vite style
  if (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env[key]) {
    return (import.meta as any).env[key];
  }
  // Check for standard process.env
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key];
  }
  return '';
};

const PROJECT_URL = getEnv('VITE_SUPABASE_URL') || 'https://qlthnmclefdwszoajhhn.supabase.co';
const ANON_KEY = getEnv('VITE_SUPABASE_ANON_KEY') || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFsdGhubWNsZWZkd3N6b2FqaGhuIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUxNzQzMTIsImV4cCI6MjA4MDc1MDMxMn0.PBtmV8OJ8izwyCL2E9sVboDAOekt_r4BaLX2zRPSUg8';

export const supabase = createClient(PROJECT_URL, ANON_KEY);