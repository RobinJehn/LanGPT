# Quick Setup Instructions

## 1. Apply Database Changes

### Option A: If you're setting up for the first time
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/migration.sql`
4. Click "Run" to execute the migration

### Option B: If you get the "track_vocabulary column does not exist" error
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/add_track_vocabulary_column.sql`
4. Click "Run" to add the missing column
5. Then run the full migration script from `database/migration.sql`

### Option C: If you get the "total_tokens_used column does not exist" error
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/fix_user_profiles.sql`
4. Click "Run" to fix the user_profiles table structure
5. Then run the full migration script from `database/migration.sql`

### Option D: If you get errors about missing correction settings columns
1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/add_correction_settings.sql`
4. Click "Run" to add the new correction strictness settings
5. This adds the new columns for punctuation, capitalization, and accent corrections

### Option E: Quick fix for existing tables
If you have existing tables and want to add just the missing columns:
```sql
-- Add track_vocabulary column
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS track_vocabulary BOOLEAN DEFAULT true;

-- Add new user_profiles columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS total_input_tokens BIGINT DEFAULT 0;

ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS total_output_tokens BIGINT DEFAULT 0;

-- Add correction strictness settings
ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS correct_punctuation BOOLEAN DEFAULT false;

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS correct_capitalization BOOLEAN DEFAULT false;

ALTER TABLE user_settings 
ADD COLUMN IF NOT EXISTS correct_accents BOOLEAN DEFAULT false;

-- Remove old vocabulary columns
ALTER TABLE vocabulary 
DROP COLUMN IF EXISTS times_used;

ALTER TABLE vocabulary 
DROP COLUMN IF EXISTS last_used;

-- Update existing records
UPDATE user_settings 
SET track_vocabulary = true 
WHERE track_vocabulary IS NULL;

UPDATE user_profiles 
SET 
  total_input_tokens = 0,
  total_output_tokens = 0
WHERE total_input_tokens IS NULL OR total_output_tokens IS NULL;

UPDATE user_settings 
SET 
  correct_punctuation = false,
  correct_capitalization = false,
  correct_accents = false
WHERE correct_punctuation IS NULL 
   OR correct_capitalization IS NULL 
   OR correct_accents IS NULL;
```

## 2. Test the App

1. Start the development server: `npm start`
2. Open the app in your browser or mobile device
3. Log in or create a new account
4. Navigate to the "Profile" tab (now combined with settings)
5. Test the vocabulary tracking toggle in the Settings sub-tab

## 3. What's New

### ✅ **Fixed Tab Navigation**
- Active tabs now show filled icons when selected
- Improved tab bar styling with better visibility
- Clear visual feedback for current tab

### ✅ **Responsive Settings Updates**
- Settings changes are now immediate (no more 1-second delay)
- Local state updates instantly for better UX
- Background sync with server for consistency
- Automatic rollback if server update fails

### ✅ **Simplified Vocabulary Tracking**
- Removed usage counts - now just shows unique words
- Cleaner vocabulary list without "Used X times" text
- Focus on word collection rather than frequency tracking

### ✅ **Correction Strictness Settings**
- New sub-settings for "Always correct sentences"
- Control punctuation corrections (default: off)
- Control capitalization corrections (default: off)
- Control accent corrections (default: off)
- Only show corrections for the types you care about

### ✅ **Combined Profile & Settings Page**
- Single tab with three sub-sections: Profile, Settings, Vocabulary
- Clean tab navigation within the page
- All functionality in one place

### ✅ **Structured AI Responses**
- ChatGPT responds in JSON format
- Visual learning features in chat:
  - Corrections (yellow boxes)
  - Vocabulary (blue boxes)
  - Natural alternatives (green boxes)
  - Verb conjugations (red boxes)
  - Tense explanations (gray boxes)

## 4. Troubleshooting

### If you get "track_vocabulary column does not exist" error:
1. Run the `database/add_track_vocabulary_column.sql` script first
2. Then run the full migration script
3. This adds the missing column to existing tables

### If you get "total_tokens_used column does not exist" error:
1. Run the `database/fix_user_profiles.sql` script first
2. This adds the new `total_input_tokens` and `total_output_tokens` columns
3. Then run the full migration script

### If vocabulary tracking toggle doesn't work:
1. Make sure you've run the database migration
2. Check that the `track_vocabulary` field exists in your `user_settings` table
3. Try refreshing the app

### If you see terminal errors:
1. Check that all environment variables are set
2. Make sure your Supabase project is properly configured
3. Verify your OpenAI API key is valid

### If structured responses aren't working:
1. Ensure your OpenAI API key supports the selected model
2. Check that the model supports JSON response format
3. Try sending a message with grammatical errors to test corrections

## 5. Features to Test

1. **Language Selection**: Change your target language in Settings
2. **Learning Preferences**: Toggle different features on/off
3. **Vocabulary Tracking**: Enable/disable and send messages to see words tracked
4. **Structured Responses**: Send messages with errors to see visual corrections
5. **Usage Statistics**: Check your token usage and costs in Profile tab

## 6. Next Steps

After testing:
1. Monitor vocabulary tracking accuracy
2. Test with different languages
3. Try various types of grammatical errors
4. Check that usage statistics are updating correctly 