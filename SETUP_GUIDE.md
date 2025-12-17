# LeaveHub Setup Guide

## Issue: "Failed to submit request"

This error occurs because Supabase database is not configured. Follow these steps to fix it:

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click **"New Project"**
4. Fill in:
   - **Name**: LeaveHub (or any name)
   - **Database Password**: (choose a strong password - save it!)
   - **Region**: Choose closest to you
5. Click **"Create new project"**
6. Wait 2-3 minutes for project to be created

## Step 2: Get Supabase Credentials

1. In your Supabase project, go to **Settings** (gear icon) → **API**
2. Find these two values:
   - **Project URL** (looks like: `https://abcdefghijklmnop.supabase.co`)
   - **anon public key** (long JWT token starting with `eyJ...`)

## Step 3: Create .env File

1. In your project root (`C:\Users\DESK\Desktop\LeaveRequest`), create a file named `.env`
2. Add these lines (replace with YOUR actual values):

```
REACT_APP_SUPABASE_URL=https://your-project-id.supabase.co
REACT_APP_SUPABASE_ANON_KEY=your_anon_key_here
```

**Example:**
```
REACT_APP_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFiY2RlZmdoaWprbG1ub3AiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MDAwMDAwMCwiZXhwIjoxOTU1NTU1NTU1fQ.example
```

## Step 4: Set Up Database Schema

1. In Supabase, go to **SQL Editor** (left sidebar)
2. Click **"New query"**
3. Copy the entire contents of `supabase-schema.sql` file
4. Paste into the SQL Editor
5. Click **"Run"** (or press Ctrl+Enter)
6. You should see "Success. No rows returned"

## Step 5: Add Half Day Support (if not already done)

Run this SQL in Supabase SQL Editor:

```sql
-- Add half_day_session column
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS half_day_session VARCHAR(20) CHECK (half_day_session IN ('morning', 'afternoon'));

-- Update type constraint to include 'halfday'
ALTER TABLE requests 
DROP CONSTRAINT IF EXISTS requests_type_check;

ALTER TABLE requests 
ADD CONSTRAINT requests_type_check CHECK (type IN ('leave', 'permission', 'halfday'));
```

## Step 6: Restart Development Server

1. Stop your current server (Ctrl+C in terminal)
2. Start it again: `npm start`
3. The app should now connect to Supabase!

## Verification

After setup, you should:
- ✅ No more "Supabase not configured" warnings in console
- ✅ No more "Failed to load resource" errors
- ✅ Can successfully submit leave requests
- ✅ Can see requests in the dashboard

## Troubleshooting

### Still getting errors?

1. **Check .env file location**: Must be in project root, not in `src/` folder
2. **Check .env file format**: No spaces around `=`, no quotes needed
3. **Restart server**: Environment variables only load on server start
4. **Check Supabase project**: Make sure project is active (not paused)
5. **Check credentials**: Copy-paste directly from Supabase dashboard

### Common Issues

- **"Invalid API key"**: Double-check the anon key is correct
- **"Project not found"**: Check the URL is correct
- **"Table doesn't exist"**: Run the schema SQL again
- **"Type constraint error"**: Run the halfday migration SQL

## Need Help?

Check the console for specific error messages. They will tell you exactly what's wrong.

