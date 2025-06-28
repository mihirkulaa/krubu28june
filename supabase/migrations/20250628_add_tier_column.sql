-- Add tier column to users table if it doesn't exist
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS tier INTEGER DEFAULT 1;

-- Ensure tier is always a valid value
ALTER TABLE users 
ADD CONSTRAINT valid_tier CHECK (tier BETWEEN 1 AND 4);
