# Supabase Setup Guide for LeaveHub

## Step 1: Create Supabase Project

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up or log in
3. Click "New Project"
4. Fill in project details:
   - Name: LeaveHub
   - Database Password: (choose a strong password)
   - Region: (choose closest to you)
5. Wait for project to be created

## Step 2: Get API Credentials

1. Go to Project Settings (gear icon)
2. Click on "API" in the sidebar
3. Copy:
   - **Project URL** (under "Project URL")
   - **anon/public key** (under "Project API keys")

## Step 3: Configure Environment Variables

1. Open `.env` file in the project root
2. Replace the placeholders:
   ```
   REACT_APP_SUPABASE_URL=your_actual_project_url
   REACT_APP_SUPABASE_ANON_KEY=your_actual_anon_key
   ```

Example:
```
REACT_APP_SUPABASE_URL=https://abcdefghijklmnop.supabase.co
REACT_APP_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

## Step 4: Create Database Tables

1. Go to Supabase Dashboard
2. Click on "SQL Editor" in the sidebar
3. Click "New Query"
4. Copy and paste the contents of `supabase-schema.sql`
5. Click "Run" to execute the SQL

This will create:
- `employees` table
- `requests` table
- Indexes for performance
- Row Level Security policies
- Sample employee data

## Step 5: Install Dependencies

Run in your terminal:
```bash
npm install
```

This will install `@supabase/supabase-js` package.

## Step 6: Verify Setup

1. Start the application:
   ```bash
   npm start
   ```

2. Check browser console for any Supabase connection errors
3. Try logging in with demo accounts
4. Create a leave request and verify it's saved to Supabase

## Step 7: View Data in Supabase

1. Go to Supabase Dashboard
2. Click on "Table Editor" in the sidebar
3. You should see:
   - `employees` table with sample data
   - `requests` table (empty initially)

## Database Schema

### Employees Table
- `id` (VARCHAR) - Primary Key
- `name` (VARCHAR)
- `email` (VARCHAR) - Unique
- `password` (VARCHAR)
- `department` (VARCHAR)
- `role` (VARCHAR) - employee, manager, hr, superadmin
- `designation` (VARCHAR)
- `manager_id` (VARCHAR)
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

### Requests Table
- `id` (VARCHAR) - Primary Key
- `employee_id` (VARCHAR) - Foreign Key to employees
- `employee_name` (VARCHAR)
- `department` (VARCHAR)
- `type` (VARCHAR) - leave or permission
- `start_date` (DATE)
- `end_date` (DATE)
- `start_time` (TIME) - nullable
- `end_time` (TIME) - nullable
- `reason` (TEXT)
- `alternative_employee_id` (VARCHAR)
- `alternative_employee_name` (VARCHAR)
- `status` (VARCHAR) - pending, approved, rejected, cancelled
- `current_approver` (VARCHAR) - nullable
- `first_approver` (JSONB) - nullable
- `manager_approval` (JSONB) - nullable
- `hr_approval` (JSONB) - nullable
- `super_admin_approval` (JSONB) - nullable
- `escalation_reason` (TEXT) - nullable
- `created_at` (TIMESTAMP)
- `updated_at` (TIMESTAMP)

## Security Notes

- The current RLS policies allow all operations. In production, you should:
  - Restrict access based on user roles
  - Implement proper authentication
  - Use service role key for server-side operations
  - Never expose service role key in frontend code

## Troubleshooting

1. **Connection Error**: Check if `.env` file has correct credentials
2. **Table Not Found**: Run the SQL schema again
3. **Permission Denied**: Check RLS policies in Supabase dashboard
4. **Data Not Saving**: Check browser console for errors

