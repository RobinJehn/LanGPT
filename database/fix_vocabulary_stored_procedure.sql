-- Migration script to fix the update_vocabulary_usage stored procedure
-- Run this in your Supabase SQL Editor

-- Drop the old stored procedure if it exists
DROP FUNCTION IF EXISTS update_vocabulary_usage(UUID, TEXT);

-- Create the correct stored procedure
CREATE OR REPLACE FUNCTION update_vocabulary_usage(
  user_id_param UUID,
  word_param TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO vocabulary (user_id, word)
  VALUES (user_id_param, word_param)
  ON CONFLICT (user_id, word)
  DO NOTHING;
END;
$$ LANGUAGE plpgsql; 