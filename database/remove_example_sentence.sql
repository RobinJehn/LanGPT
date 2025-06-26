-- Migration script to remove example_sentence column from vocabulary table
-- Run this in your Supabase SQL Editor

-- Remove the example_sentence column from vocabulary table
ALTER TABLE vocabulary DROP COLUMN IF EXISTS example_sentence; 