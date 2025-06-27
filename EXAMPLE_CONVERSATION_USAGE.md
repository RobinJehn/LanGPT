# Example Conversation Usage Guide

This guide explains how to use the example conversation data to test your LanGPT UI without making actual API calls.

## Files Created

1. **`services/exampleConversation.ts`** - Contains the example conversation data and helper functions
2. **`components/ExampleConversationLoader.tsx`** - UI component for loading different conversation configurations
3. **`app/test-example.tsx`** - Test screen to preview the example conversations

## Example Conversation Features

The example conversation includes:

- **6 user messages** and **6 AI responses**
- **Grammar corrections** with explanations
- **Vocabulary tracking** with translations and parts of speech
- **Verb conjugations** for different tenses
- **Natural alternatives** for awkward phrases
- **Tense explanations** for incorrect tense usage

## How to Integrate with Main Chat

### Option 1: Temporary Integration (Recommended for Testing)

Add this to your main chat screen (`app/(tabs)/index.tsx`) temporarily:

```typescript
// Add this import at the top
import { exampleConversation } from '@/services/exampleConversation';

// Add this function inside your HomeScreen component
const loadExampleConversation = () => {
  setMessages(exampleConversation);
  // Optionally set example settings
  const exampleSettings = {
    always_correct_sentences: true,
    track_vocabulary: true,
    suggest_natural_alternatives: true,
    show_verb_conjugations: true,
    explain_tense_usage: true,
    target_language: 'spanish'
  };
  setUserSettings(exampleSettings);
  languageLearningService.updateSettings(exampleSettings);
};

// Add this button in your header or as a floating button
<TouchableOpacity 
  style={styles.exampleButton} 
  onPress={loadExampleConversation}
>
  <Text style={styles.exampleButtonText}>Load Example</Text>
</TouchableOpacity>
```

### Option 2: Use the Test Screen

Navigate to `/test-example` to use the dedicated test screen:

```typescript
// In your navigation or router
router.push('/test-example');
```

### Option 3: Development Mode Toggle

Add a development mode that automatically loads example data:

```typescript
// Add this state
const [isDevMode, setIsDevMode] = useState(__DEV__);

// In useEffect, load example data if in dev mode
useEffect(() => {
  if (isDevMode && messages.length === 0) {
    loadExampleConversation();
  }
}, [isDevMode]);
```

## Example Conversation Content

The conversation covers these learning scenarios:

1. **Basic greetings** with accent corrections
2. **Language learning goals** with vocabulary tracking
3. **Past tense usage** with tense explanations
4. **Grammar questions** with verb conjugations
5. **Common mistakes** (ser vs estar) with corrections
6. **Food vocabulary** with natural alternatives

## Testing Different Configurations

Use the `getExampleConversation()` function to test different settings:

```typescript
import { getExampleConversation } from '@/services/exampleConversation';

// Test corrections only
const correctionsOnly = getExampleConversation({
  always_correct_sentences: true,
  track_vocabulary: false,
  suggest_natural_alternatives: false,
  show_verb_conjugations: false,
  explain_tense_usage: false,
});

// Test vocabulary only
const vocabularyOnly = getExampleConversation({
  always_correct_sentences: false,
  track_vocabulary: true,
  suggest_natural_alternatives: false,
  show_verb_conjugations: false,
  explain_tense_usage: false,
});
```

## Removing Example Data

When you're ready to remove the example data:

1. Delete the `services/exampleConversation.ts` file
2. Delete the `components/ExampleConversationLoader.tsx` file
3. Delete the `app/test-example.tsx` file
4. Remove any integration code from your main chat screen

## Benefits

- **No API costs** during development
- **Consistent test data** for UI development
- **All features covered** in one conversation
- **Easy to modify** for different test scenarios
- **Realistic responses** that match your app's structure

## Customization

You can easily modify the example conversation by:

1. Adding new messages to the `exampleConversation` array
2. Changing the structured responses to test different scenarios
3. Adding new vocabulary words or verb conjugations
4. Modifying the correction examples

The example data follows the exact same structure as your real GPT responses, so your UI components will work seamlessly with both real and example data. 