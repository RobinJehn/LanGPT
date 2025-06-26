# LanGPT Setup Guide

## Prerequisites

1. **OpenAI API Key**: You'll need an OpenAI API key to use this app. Get one from [OpenAI Platform](https://platform.openai.com/api-keys)

## Setup Instructions

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure OpenAI API Key

Create a `.env` file in the root directory and add your OpenAI API key:

```bash
# Create .env file
touch .env
```

Add the following to your `.env` file:
```
EXPO_PUBLIC_OPENAI_API_KEY=your_actual_api_key_here
```

**Important**: Replace `your_actual_api_key_here` with your real OpenAI API key.

### 3. Start the Development Server
```bash
npx expo start
```

### 4. Run on Your Device
- **iOS**: Press `i` in the terminal or scan the QR code with the Expo Go app
- **Android**: Press `a` in the terminal or scan the QR code with the Expo Go app
- **Web**: Press `w` in the terminal

## Features

- **AI Language Learning Assistant**: Chat with an AI specifically trained to help with language learning
- **Conversation History**: The AI remembers your conversation context
- **New Chat**: Start fresh conversations anytime
- **Real-time Responses**: Get instant feedback and explanations

## Usage

1. Open the app and you'll see the chat interface
2. Type your language learning questions or requests
3. The AI will respond with helpful explanations, examples, and practice suggestions
4. Use the "New Chat" button to start fresh conversations

## Example Prompts

- "Help me learn Spanish"
- "What's the difference between 'ser' and 'estar' in Spanish?"
- "Give me some practice sentences for French present tense"
- "Explain Japanese particles"
- "Help me practice German pronunciation"

## Security Note

⚠️ **Important**: This app uses `dangerouslyAllowBrowser: true` for development purposes. For production use, you should implement a backend server to handle API calls securely.

## Troubleshooting

- **API Key Error**: Make sure your `.env` file is in the root directory and contains the correct API key
- **Network Issues**: Ensure you have a stable internet connection
- **App Not Starting**: Try clearing the cache with `npx expo start --clear` 