# Simple Database Setup - No RLS, Just Data Storage

## Step 1: Delete Existing Tables

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Go to **SQL Editor**
4. Run this command first to delete everything:

```sql
DROP TABLE IF EXISTS requests CASCADE;
DROP TABLE IF EXISTS employees CASCADE;
```

## Step 2: Create New Simple Tables

1. In the same SQL Editor
2. Copy the entire content from `simple-schema.sql`
3. Paste and click **Run**
4. You should see "Success. No rows returned"

## What's Included:

✅ **Simple Tables Only:**
- `employees` table - stores employee data
- `requests` table - stores leave/permission requests

✅ **Basic Indexes:**
- For faster queries (no performance impact)

✅ **Sample Data:**
- 4 employees, 1 manager, 1 HR, 1 Super Admin
- Ready to test immediately

❌ **Removed:**
- No RLS (Row Level Security) policies
- No triggers
- No functions
- No complex features

## Step 3: Verify Setup

After running the SQL, check:

1. Go to **Table Editor** in Supabase
2. You should see:
   - `employees` table with 7 rows
   - `requests` table (empty, ready for data)

## Step 4: Test the Application

1. Restart your React app: `npm start`
2. Try logging in with:
   - Email: `john@company.com`
   - Password: `john123`
3. Try creating a leave request

## Troubleshooting

If you get errors:
1. Make sure you ran the DROP commands first
2. Make sure the SQL ran successfully (check for errors)
3. Refresh the Table Editor
4. Restart your React app

## Notes

- All IDs are VARCHAR(50) - no UUID issues
- Simple structure - easy to understand
- No security policies - for development only
- Data persists normally in Supabase



