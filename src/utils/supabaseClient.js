import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Check if credentials are provided
const hasCredentials = supabaseUrl && supabaseAnonKey && 
                       supabaseUrl !== 'your_supabase_project_url' && 
                       supabaseAnonKey !== 'your_supabase_anon_key';

let supabase;

if (!hasCredentials) {
  if (process.env.NODE_ENV === 'development') {
    console.warn('⚠️ Missing Supabase environment variables. Please check your .env file.');
    console.warn('📝 The app will continue to run, but database operations will fail.');
    console.warn('💡 To fix:');
    console.warn('   1. Create a .env file in the project root');
    console.warn('   2. Add: REACT_APP_SUPABASE_URL=your_actual_url');
    console.warn('   3. Add: REACT_APP_SUPABASE_ANON_KEY=your_actual_key');
    console.warn('   4. Restart the development server');
  }
  
  // Create a mock client that returns promises to prevent network errors
  // This prevents "Failed to fetch" errors while Supabase is not configured
  const createMockQueryBuilder = () => {
    const defaultPromise = Promise.resolve({ data: [], error: null });
    
    const builder = {
      eq: (column, value) => builder,
      neq: (column, value) => builder,
      or: (filter) => builder,
      gte: (column, value) => builder,
      lte: (column, value) => builder,
      order: (column, options) => defaultPromise,
      single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured', code: 'PGRST116' } }),
      // Make it thenable so it works with await
      then: (onResolve, onReject) => defaultPromise.then(onResolve, onReject),
      catch: (onReject) => defaultPromise.catch(onReject)
    };
    
    return builder;
  };

  supabase = {
    from: (table) => ({
      select: (columns) => createMockQueryBuilder(),
      insert: (values) => ({
        select: (columns) => ({
          single: () => Promise.resolve({ data: null, error: { message: 'Supabase not configured. Please set up .env file.' } })
        })
      }),
      update: (values) => createMockQueryBuilder(),
      delete: () => createMockQueryBuilder()
    })
  };
} else {
  supabase = createClient(supabaseUrl, supabaseAnonKey);
}

export { supabase };

