-- Migration script to add correction strictness settings and simplify vocabulary
-- Run this in your Supabase SQL Editor to add the new columns

-- Add new correction strictness columns
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS correct_punctuation BOOLEAN DEFAULT false;

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS correct_capitalization BOOLEAN DEFAULT false;

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS correct_accents BOOLEAN DEFAULT false;

-- Remove old columns from vocabulary table if they exist
ALTER TABLE vocabulary 
DROP COLUMN IF EXISTS times_used;

ALTER TABLE vocabulary 
DROP COLUMN IF EXISTS last_used;

-- Update existing records to have proper default values
UPDATE user_settings 
SET 
  correct_punctuation = false,
  correct_capitalization = false,
  correct_accents = false
WHERE correct_punctuation IS NULL 
   OR correct_capitalization IS NULL 
   OR correct_accents IS NULL;

-- Verify the table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_settings' 
ORDER BY ordinal_position;

-- Verify vocabulary table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'vocabulary' 
ORDER BY ordinal_position; 