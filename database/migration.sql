-- Migration script for LanGPT database schema
-- Run this in your Supabase SQL Editor

-- Drop existing tables if they exist (be careful with this in production!)
-- DROP TABLE IF EXISTS vocabulary CASCADE;
-- DROP TABLE IF EXISTS user_settings CASCADE;
-- DROP TABLE IF EXISTS usage_stats CASCADE;
-- DROP TABLE IF EXISTS user_profiles CASCADE;

-- Create user_profiles table
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  email TEXT NOT NULL,
  total_input_tokens BIGINT DEFAULT 0,
  total_output_tokens BIGINT DEFAULT 0,
  total_cost_usd DECIMAL(10,8) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create usage_stats table with detailed tracking
CREATE TABLE IF NOT EXISTS usage_stats (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  input_tokens INTEGER NOT NULL,
  output_tokens INTEGER NOT NULL,
  total_tokens INTEGER NOT NULL,
  input_cost_usd DECIMAL(10,8) NOT NULL,
  output_cost_usd DECIMAL(10,8) NOT NULL,
  total_cost_usd DECIMAL(10,8) NOT NULL,
  model TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create user_settings table for language learning preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
  target_language TEXT DEFAULT 'spanish',
  always_correct_sentences BOOLEAN DEFAULT true,
  suggest_natural_alternatives BOOLEAN DEFAULT true,
  show_verb_conjugations BOOLEAN DEFAULT true,
  explain_tense_usage BOOLEAN DEFAULT true,
  track_vocabulary BOOLEAN DEFAULT true,
  custom_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add track_vocabulary column to existing user_settings table if it doesn't exist
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS track_vocabulary BOOLEAN DEFAULT true;

-- Create vocabulary table to track learned words
CREATE TABLE IF NOT EXISTS vocabulary (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  word TEXT NOT NULL,
  translation TEXT,
  part_of_speech TEXT,
  example_sentence TEXT,
  difficulty_level INTEGER DEFAULT 1,
  times_used INTEGER DEFAULT 1,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, word)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_user_id ON usage_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_stats_created_at ON usage_stats(created_at);
CREATE INDEX IF NOT EXISTS idx_usage_stats_model ON usage_stats(model);
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_user_id ON vocabulary(user_id);
CREATE INDEX IF NOT EXISTS idx_vocabulary_word ON vocabulary(word);

-- Enable Row Level Security
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE vocabulary ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_profiles
DROP POLICY IF EXISTS "Users can view own profile" ON user_profiles;
CREATE POLICY "Users can view own profile" ON user_profiles
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own profile" ON user_profiles;
CREATE POLICY "Users can update own profile" ON user_profiles
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own profile" ON user_profiles;
CREATE POLICY "Users can insert own profile" ON user_profiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for usage_stats
DROP POLICY IF EXISTS "Users can view own usage" ON usage_stats;
CREATE POLICY "Users can view own usage" ON usage_stats
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own usage" ON usage_stats;
CREATE POLICY "Users can insert own usage" ON usage_stats
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for user_settings
DROP POLICY IF EXISTS "Users can view own settings" ON user_settings;
CREATE POLICY "Users can view own settings" ON user_settings
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own settings" ON user_settings;
CREATE POLICY "Users can update own settings" ON user_settings
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own settings" ON user_settings;
CREATE POLICY "Users can insert own settings" ON user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create RLS policies for vocabulary
DROP POLICY IF EXISTS "Users can view own vocabulary" ON vocabulary;
CREATE POLICY "Users can view own vocabulary" ON vocabulary
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own vocabulary" ON vocabulary;
CREATE POLICY "Users can update own vocabulary" ON vocabulary
  FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own vocabulary" ON vocabulary;
CREATE POLICY "Users can insert own vocabulary" ON vocabulary
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own vocabulary" ON vocabulary;
CREATE POLICY "Users can delete own vocabulary" ON vocabulary
  FOR DELETE USING (auth.uid() = user_id);

-- Create function to update user profile totals atomically
CREATE OR REPLACE FUNCTION update_user_profile_totals(
  user_id_param UUID,
  input_tokens_param INTEGER,
  output_tokens_param INTEGER,
  cost_param DECIMAL(10,8)
)
RETURNS VOID AS $$
BEGIN
  UPDATE user_profiles 
  SET 
    total_input_tokens = total_input_tokens + input_tokens_param,
    total_output_tokens = total_output_tokens + output_tokens_param,
    total_cost_usd = total_cost_usd + cost_param,
    updated_at = NOW()
  WHERE user_id = user_id_param;
END;
$$ LANGUAGE plpgsql;

-- Create function to update vocabulary usage
CREATE OR REPLACE FUNCTION update_vocabulary_usage(
  user_id_param UUID,
  word_param TEXT
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO vocabulary (user_id, word, times_used, last_used)
  VALUES (user_id_param, word_param, 1, NOW())
  ON CONFLICT (user_id, word)
  DO UPDATE SET 
    times_used = vocabulary.times_used + 1,
    last_used = NOW();
END;
$$ LANGUAGE plpgsql;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON user_profiles;
CREATE TRIGGER update_user_profiles_updated_at
  BEFORE UPDATE ON user_profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_settings_updated_at ON user_settings;
CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON user_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Insert default user settings for existing users (optional)
-- This will create default settings for any existing users
INSERT INTO user_settings (user_id, target_language, always_correct_sentences, suggest_natural_alternatives, show_verb_conjugations, explain_tense_usage, track_vocabulary)
SELECT 
  id as user_id,
  'spanish' as target_language,
  true as always_correct_sentences,
  true as suggest_natural_alternatives,
  true as show_verb_conjugations,
  true as explain_tense_usage,
  true as track_vocabulary
FROM auth.users
WHERE id NOT IN (SELECT user_id FROM user_settings)
ON CONFLICT (user_id) DO NOTHING; 