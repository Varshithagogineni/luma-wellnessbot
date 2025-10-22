// Supabase Configuration
const SUPABASE_URL = 'https://yqrvoonodlkruhgzyosq.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlxcnZvb25vZGxrcnVoZ3p5b3NxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjEwOTI1MjAsImV4cCI6MjA3NjY2ODUyMH0._HuezvgQ6rKV3GxJXjXgKsFj-DcZKiQqAmnOdHZALaU';

// Initialize Supabase client
const supabaseClient = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Export for use in other files
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { supabaseClient, SUPABASE_URL, SUPABASE_ANON_KEY };
}
