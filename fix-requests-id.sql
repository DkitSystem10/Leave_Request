-- Fix requests table to use UUID with auto-generation
-- Run this in your Supabase SQL Editor if you want to use UUID instead of VARCHAR

-- Option 1: Change to UUID with auto-generation (Recommended)
ALTER TABLE requests 
DROP CONSTRAINT IF EXISTS requests_pkey;

ALTER TABLE requests 
ALTER COLUMN id TYPE UUID USING gen_random_uuid();

ALTER TABLE requests 
ALTER COLUMN id SET DEFAULT uuid_generate_v4();

ALTER TABLE requests 
ADD PRIMARY KEY (id);

-- Option 2: Keep VARCHAR but make it nullable temporarily, then add default
-- (If you prefer to keep VARCHAR format)
-- ALTER TABLE requests ALTER COLUMN id DROP NOT NULL;
-- ALTER TABLE requests ALTER COLUMN id SET DEFAULT 'REQ-' || to_char(now(), 'YYYYMMDDHH24MISS') || '-' || substr(md5(random()::text), 1, 9);



