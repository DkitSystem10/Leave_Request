-- Add status column to employees table to track Active/Deactivated/Rejoined status
ALTER TABLE employees 
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active';

-- Update any existing records that have no status to be 'active' by default
UPDATE employees 
SET status = 'active' 
WHERE status IS NULL;
