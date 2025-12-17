# Environment Variables Setup

## Quick Setup

1. **Create a `.env` file** in the project root directory (`C:\Users\DESK\Desktop\LeaveRequest\.env`)

2. **Add the following content** to the `.env` file:

```
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

3. **Replace the placeholder values** with your actual Supabase credentials:

### How to Get Supabase Credentials:

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Create a new project (or use existing)
4. Go to **Project Settings** → **API**
5. Copy:
   - **Project URL** → Replace `your_supabase_project_url`
   - **anon/public key** → Replace `your_supabase_anon_key`

### Example `.env` file:

```
REACT_APP_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MDAwMDAwMCwiZXhwIjoxOTU1NTU1NTU1fQ.example_key_here
```

## Important Notes:

- ⚠️ **Never commit `.env` file to Git** (it's already in `.gitignore`)
- 🔄 **Restart the development server** after creating/updating `.env` file
- ✅ The app will show warnings if credentials are missing, but won't crash

## After Setup:

1. Run the SQL schema in Supabase (see `supabase-schema.sql`)
2. Restart your React app: `npm start`
3. The app should now connect to Supabase successfully!

