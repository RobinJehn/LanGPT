-- Migration script to add track_vocabulary column to existing user_settings table
-- Run this in your Supabase SQL Editor if you get the error about track_vocabulary column not existing

-- Add the track_vocabulary column to existing user_settings table
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS track_vocabulary BOOLEAN DEFAULT true;

-- Update existing records to have track_vocabulary = true
UPDATE user_settings 
SET track_vocabulary = true 
WHERE track_vocabulary IS NULL;

-- Verify the column was added
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'user_settings' AND column_name = 'track_vocabulary'; 