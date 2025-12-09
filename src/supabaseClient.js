import { createClient } from '@supabase/supabase-js';

const supabaseUrl = ' https://bzwxutrpbmvlzmowvxhp.supabase.co  '; 
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ6d3h1dHJwYm12bHptb3d2eGhwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjUzMDQ5MjQsImV4cCI6MjA4MDg4MDkyNH0.BpfpmyzkHJHMRpQINkWjG-wnpzoW2RHcPPpWS0zR_f4 '; 

export const supabase = createClient(supabaseUrl, supabaseAnonKey);