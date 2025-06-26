-- Migration script to fix user_profiles table structure
-- Run this in your Supabase SQL Editor if you get errors about missing columns

-- Add new columns if they don't exist
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS total_input_tokens BIGINT DEFAULT 0;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS total_output_tokens BIGINT DEFAULT 0;

-- Remove old column if it exists (be careful with this in production!)
-- ALTER TABLE user_profiles DROP COLUMN IF EXISTS total_tokens_used;

-- Update existing records to have proper values
UPDATE user_profiles 
SET 
  total_input_tokens = 0,
  total_output_tokens = 0
WHERE total_input_tokens IS NULL OR total_output_tokens IS NULL;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
ORDER BY ordinal_position; 