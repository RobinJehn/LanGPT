# LanGPT Setup Guide

## Prerequisites

1. **OpenAI API Key**: You'll need an OpenAI API key to use this app. Get one from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Supabase Account**: You'll need a Supabase account for user authentication and database. Sign up at [Supabase](https://supabase.com)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Set up Supabase Database

1. **Create a new Supabase project**:
   - Go to [Supabase Dashboard](https://app.supabase.com)
   - Click "New Project"
   - Choose your organization and enter project details
   - Wait for the project to be created

2. **Run the database schema**:
   - Go to your project's SQL Editor
   - Copy and paste the contents of `database/schema.sql`
   - Click "Run" to create the tables and policies

3. **Get your Supabase credentials**:
   - Go to Settings → API
   - Copy your Project URL and anon/public key

### 3. Configure Environment Variables

Create a `.env` file in the root directory and add your API keys:

```bash
# Create .env file
touch .env
```

Add the following to your `.env` file:
```
# OpenAI Configuration
EXPO_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here

# Supabase Configuration
EXPO_PUBLIC_SUPABASE_URL=your_supabase_project_url
EXPO_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Important**: Replace the placeholder values with your actual API keys.

### 4. Start the Development Server
```bash
npx expo start
```

### 5. Run on Your Device
- **iOS**: Press `i` in the terminal or scan the QR code with the Expo Go app
- **Android**: Press `a` in the terminal or scan the QR code with the Expo Go app
- **Web**: Press `w` in the terminal

## Features

- **User Authentication**: Sign up and sign in with email/password
- **AI Language Learning Assistant**: Chat with an AI specifically trained to help with language learning
- **Usage Tracking**: Monitor your token usage and costs in real-time
- **Conversation History**: The AI remembers your conversation context
- **Profile Management**: View your usage statistics and account information
- **New Chat**: Start fresh conversations anytime
- **Real-time Responses**: Get instant feedback and explanations

## Usage

1. **First Time Setup**:
   - Open the app and you'll be prompted to sign up or sign in
   - Create an account with your email and password
   - Once authenticated, you'll see the chat interface

2. **Using the Chat**:
   - Type your language learning questions or requests
   - The AI will respond with helpful explanations, examples, and practice suggestions
   - Your usage (tokens and costs) will be automatically tracked

3. **Viewing Usage**:
   - Tap the "Profile" tab to see your usage statistics
   - View total tokens used and costs
   - See recent usage history

4. **Managing Conversations**:
   - Use the "New Chat" button to start fresh conversations
   - Sign out from the Profile tab when done

## Example Prompts

- "Help me learn Spanish"
- "What's the difference between 'ser' and 'estar' in Spanish?"
- "Give me some practice sentences for French present tense"
- "Explain Japanese particles"
- "Help me practice German pronunciation"

## Database Schema

The app uses two main tables:

1. **user_profiles**: Stores user information and total usage statistics
2. **usage_stats**: Stores individual usage records for each API call

## Security Features

- **Row Level Security (RLS)**: Users can only access their own data
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: All user inputs are validated
- **Error Handling**: Comprehensive error handling throughout the app

## Troubleshooting

- **Authentication Errors**: Make sure your Supabase credentials are correct in the `.env` file
- **API Key Error**: Ensure your OpenAI API key is valid and has sufficient credits
- **Database Errors**: Verify that the database schema has been properly set up
- **Network Issues**: Ensure you have a stable internet connection
- **App Not Starting**: Try clearing the cache with `npx expo start --clear`

## Production Considerations

⚠️ **Important**: This app uses `dangerouslyAllowBrowser: true` for development purposes. For production use, you should:

1. Implement a backend server to handle API calls securely
2. Use environment-specific API keys
3. Implement rate limiting
4. Add proper error monitoring
5. Set up automated backups for the database 