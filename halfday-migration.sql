-- Migration script to add halfday leave support
-- Run this in your Supabase SQL Editor

-- Step 1: Add half_day_session column if it doesn't exist
ALTER TABLE requests 
ADD COLUMN IF NOT EXISTS half_day_session VARCHAR(20) CHECK (half_day_session IN ('morning', 'afternoon'));

-- Step 2: Update the type CHECK constraint to include 'halfday'
ALTER TABLE requests 
DROP CONSTRAINT IF EXISTS requests_type_check;

ALTER TABLE requests 
ADD CONSTRAINT requests_type_check CHECK (type IN ('leave', 'permission', 'halfday'));

