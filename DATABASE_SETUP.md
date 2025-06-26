# Database Setup Instructions

## Overview
This guide will help you set up the database schema for LanGPT with proper usage tracking, user settings, and vocabulary management.

## New Features in This Update

### 🎯 **Structured AI Responses**
- ChatGPT now responds in JSON format with separate fields for:
  - Main response text
  - Grammar corrections with explanations
  - Vocabulary words with translations and examples
  - Natural alternative phrases
  - Verb conjugations
  - Tense usage explanations

### 🎨 **Visual Learning Features**
- Corrections appear in yellow boxes with strikethrough text
- Vocabulary appears in blue boxes with translations
- Natural alternatives appear in green boxes
- Verb conjugations appear in red boxes
- Tense explanations appear in gray boxes

### ⚙️ **Configurable Vocabulary Tracking**
- Toggle to enable/disable automatic vocabulary tracking
- Only tracks words when the feature is enabled
- More accurate word identification through AI analysis

## Prerequisites
- A Supabase project set up
- Access to your Supabase dashboard

## Step 1: Apply Database Schema

1. Go to your Supabase dashboard
2. Navigate to the SQL Editor
3. Copy and paste the contents of `database/migration.sql` into the SQL editor
4. Click "Run" to execute the migration

This will create:
- `user_profiles` table for tracking user totals
- `usage_stats` table for detailed usage tracking
- `user_settings` table for language learning preferences (including new `track_vocabulary` field)
- `vocabulary` table for tracking learned words
- All necessary indexes, RLS policies, and functions

## Step 2: Verify the Setup

After running the migration, you can verify the setup by checking:

1. **Tables**: Go to Table Editor and verify these tables exist:
   - `user_profiles`
   - `usage_stats` 
   - `user_settings`
   - `vocabulary`

2. **Functions**: Go to Database > Functions and verify these exist:
   - `update_user_profile_totals`
   - `update_vocabulary_usage`
   - `update_updated_at_column`

3. **Policies**: Go to Authentication > Policies and verify RLS policies are set up for all tables

## Step 3: Test the Application

1. Start your development server: `npm start`
2. Create a new account or log in
3. Go to Settings tab and configure your preferences:
   - Select your target language
   - Toggle learning features on/off
   - Enable/disable vocabulary tracking
   - Add custom instructions if desired
4. Try sending a message in the chat
5. Observe the structured learning features in the response
6. Check the Profile tab to see usage statistics
7. View tracked vocabulary in the Settings tab

## Troubleshooting

### If you get permission errors:
- Make sure RLS policies are properly set up
- Check that the user is authenticated before accessing data

### If usage isn't being tracked:
- Verify the `update_user_profile_totals` function exists
- Check that the `usage_stats` table has the correct structure
- Ensure your OpenAI API key is properly configured

### If settings aren't saving:
- Verify the `user_settings` table exists
- Check that RLS policies allow users to insert/update their own settings

### If structured responses aren't working:
- Ensure your OpenAI API key supports the selected model
- Check that the model supports JSON response format
- Verify the system prompt is being generated correctly

## Features Added

### 1. Language Selection
- Users can select from 20+ languages
- Target language is displayed in the chat header
- AI responses are tailored to the selected language

### 2. Learning Preferences
- **Always correct sentences**: Automatically corrects grammatical errors
- **Suggest natural alternatives**: Provides more natural ways to express ideas
- **Show verb conjugations**: Displays all conjugations when errors are made
- **Explain tense usage**: Explains which tense to use and why
- **Track vocabulary**: Toggle to enable/disable automatic vocabulary tracking

### 3. Custom Instructions
- Users can add their own specific instructions for the AI
- Instructions are saved and applied to all conversations

### 4. Smart Vocabulary Tracking
- Only tracks words when the feature is enabled
- AI identifies relevant vocabulary words from conversations
- Includes translations, parts of speech, and example sentences
- Shows word usage frequency
- Allows manual deletion of words
- Displays vocabulary count in settings

### 5. Visual Learning Features
- **Corrections**: Yellow boxes with strikethrough text showing what was wrong
- **Vocabulary**: Blue boxes with word details and translations
- **Natural Alternatives**: Green boxes with better ways to say things
- **Verb Conjugations**: Red boxes with complete conjugation tables
- **Tense Explanations**: Gray boxes explaining when to use different tenses

### 6. Improved Usage Tracking
- Separate tracking of input and output tokens
- Detailed cost breakdown by model
- Real-time updates in profile screen
- Historical usage data

## Database Schema

### user_profiles
- Tracks total tokens and costs across all models
- Updated atomically using database functions

### usage_stats  
- Detailed record of each API call
- Separate input/output token tracking
- Cost breakdown by model

### user_settings
- Language learning preferences
- Target language selection
- Custom instructions
- Vocabulary tracking toggle

### vocabulary
- Words used in conversations
- Usage frequency tracking
- Optional translation and metadata

## Next Steps

After applying the database changes:

1. Test all features thoroughly
2. Monitor usage tracking accuracy
3. Try different languages and learning preferences
4. Test the structured response system with various types of errors
5. Consider adding more language-specific features
6. Implement vocabulary export/import functionality
7. Add progress tracking and learning goals 