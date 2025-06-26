import OpenAI from 'openai';
import { settingsService, UserSettings } from './settings';
import { usageService } from './usage';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY, // You'll need to set this in your environment
    dangerouslyAllowBrowser: true, // Only for development - use a backend in production
});

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export interface StructuredResponse {
    response: string;
    corrections?: {
        original: string;
        corrected: string;
        explanation: string;
    }[];
    vocabulary?: {
        word: string;
        translation?: string;
        part_of_speech?: string;
        example_sentence?: string;
    }[];
    natural_alternatives?: {
        original: string;
        alternatives: string[];
        explanation: string;
    }[];
    verb_conjugations?: {
        verb: string;
        tense: string;
        conjugations: string[];
        explanation: string;
    }[];
    tense_explanation?: {
        incorrect_usage: string;
        correct_tense: string;
        explanation: string;
        examples: string[];
    }[];
}

export class LanguageLearningService {
    private conversationHistory: ChatMessage[] = [];
    private currentSettings: UserSettings | null = null;

    async sendMessage(
        userMessage: string,
        userId?: string,
        model: string = 'gpt-4.1-nano',
        settings?: UserSettings
    ): Promise<StructuredResponse> {
        try {
            // Load or update settings
            if (settings) {
                this.currentSettings = settings;
            } else if (userId && !this.currentSettings) {
                const { settings: userSettings } = await settingsService.getUserSettings(userId);
                this.currentSettings = userSettings;
            }

            // Debug: Log current settings
            console.log('Current settings for AI:', {
                track_vocabulary: this.currentSettings?.track_vocabulary,
                show_verb_conjugations: this.currentSettings?.show_verb_conjugations,
                always_correct_sentences: this.currentSettings?.always_correct_sentences,
                suggest_natural_alternatives: this.currentSettings?.suggest_natural_alternatives,
                explain_tense_usage: this.currentSettings?.explain_tense_usage,
            });

            // Generate system prompt based on user settings
            const systemPrompt = this.generateStructuredSystemPrompt();

            // Initialize or update conversation history with system prompt
            if (this.conversationHistory.length === 0) {
                this.conversationHistory = [{ role: 'system', content: systemPrompt }];
            } else {
                // Update existing system prompt with new settings
                this.conversationHistory[0] = { role: 'system', content: systemPrompt };
            }

            // Add user message to conversation history
            this.conversationHistory.push({
                role: 'user',
                content: userMessage
            });

            // Make API call to OpenAI
            const completion = await openai.chat.completions.create({
                model: model,
                messages: this.conversationHistory,
                max_tokens: 1000,
                temperature: 0.7,
                response_format: { type: "json_object" }, // Force JSON response
            });

            const assistantResponseText = completion.choices[0]?.message?.content || '{"response": "Sorry, I couldn\'t generate a response."}';

            // Parse the JSON response
            let structuredResponse: StructuredResponse;
            try {
                structuredResponse = JSON.parse(assistantResponseText);
            } catch (error) {
                console.error('Failed to parse JSON response:', error);
                // Fallback to plain text response
                structuredResponse = {
                    response: assistantResponseText,
                };
            }

            // Add assistant response to conversation history (only the main response text)
            this.conversationHistory.push({
                role: 'assistant',
                content: structuredResponse.response
            });

            // Track vocabulary if enabled and user is authenticated
            if (userId && this.currentSettings?.track_vocabulary && structuredResponse.vocabulary) {
                await this.trackVocabulary(userId, structuredResponse.vocabulary);
            }

            // Track usage if user is authenticated
            if (userId && completion.usage) {
                await usageService.recordUsage(
                    userId,
                    model,
                    completion.usage.prompt_tokens,
                    completion.usage.completion_tokens
                );
            }

            return structuredResponse;
        } catch (error) {
            console.error('Error calling OpenAI API:', error);
            throw new Error('Failed to get response from AI assistant');
        }
    }

    private generateStructuredSystemPrompt(): string {
        const targetLanguage = this.currentSettings?.target_language || 'spanish';
        const languageName = this.getLanguageName(targetLanguage);

        let prompt = `You are LanGPT, an AI language learning assistant specialized in teaching ${languageName}. 

IMPORTANT: You must respond in valid JSON format with the following structure:`;

        // Build JSON structure based on enabled settings
        let jsonStructure = `{
  "response": "Your main response to the user in natural, conversational language"`;

        if (this.currentSettings?.always_correct_sentences) {
            jsonStructure += `,
  "corrections": [{"original": "incorrect text", "corrected": "correct text", "explanation": "why it's wrong"}]`;
        }

        if (this.currentSettings?.track_vocabulary) {
            jsonStructure += `,
  "vocabulary": [{"word": "target_language_word", "translation": "English translation", "part_of_speech": "noun/verb/etc", "example_sentence": "example usage"}]`;
        }

        if (this.currentSettings?.suggest_natural_alternatives) {
            jsonStructure += `,
  "natural_alternatives": [{"original": "user's phrase", "alternatives": ["better phrase 1", "better phrase 2"], "explanation": "why these are better"}]`;
        }

        if (this.currentSettings?.show_verb_conjugations) {
            jsonStructure += `,
  "verb_conjugations": [{"verb": "base_verb", "tense": "present/past/future", "conjugations": ["yo form", "tú form", "él/ella form"], "explanation": "when to use this tense"}]`;
        }

        if (this.currentSettings?.explain_tense_usage) {
            jsonStructure += `,
  "tense_explanation": [{"incorrect_usage": "what user said", "correct_tense": "what they should use", "explanation": "why", "examples": ["example 1", "example 2"]}]`;
        }

        jsonStructure += `
}`;

        prompt += `\n${jsonStructure}

Only include the fields that are enabled in the settings above. If a feature is disabled, do not include that field in your response.

Your teaching approach:`;

        // Add specific instructions based on user preferences
        if (this.currentSettings?.always_correct_sentences) {
            prompt += '\n- Always identify and correct grammatical errors in the user\'s text';
        }

        if (this.currentSettings?.suggest_natural_alternatives) {
            prompt += '\n- Suggest more natural or colloquial ways to express the same idea';
        }

        if (this.currentSettings?.show_verb_conjugations) {
            prompt += '\n- If the user makes a verb conjugation error, provide all conjugations for that verb in the relevant tense';
        }

        if (this.currentSettings?.explain_tense_usage) {
            prompt += '\n- When the user uses the wrong tense, explain which tense should be used and why';
        }

        // Add custom instructions if provided
        if (this.currentSettings?.custom_instructions) {
            prompt += `\n- Additional instructions: ${this.currentSettings.custom_instructions}`;
        }

        // Only include vocabulary instructions if tracking is enabled
        if (this.currentSettings?.track_vocabulary) {
            prompt += `\n\nFor vocabulary tracking, identify words in ${languageName} that the user used or that are relevant to the conversation. 

IMPORTANT: For verbs, always provide the base form (infinitive) in the vocabulary section, not conjugated forms. For example:
- If user says "estás", track "estar" 
- If user says "hablo", track "hablar"
- If user says "comí", track "comer"

Include translations and parts of speech when helpful.`;
        }

        prompt += `\n\nAlways be encouraging and patient. Adapt to the user's skill level and provide clear explanations.

Remember: Your response must be valid JSON!`;

        return prompt;
    }

    private getLanguageName(code: string): string {
        const languages: { [key: string]: string } = {
            'spanish': 'Spanish',
            'french': 'French',
            'german': 'German',
            'italian': 'Italian',
            'portuguese': 'Portuguese',
            'japanese': 'Japanese',
            'chinese': 'Chinese',
            'korean': 'Korean',
            'russian': 'Russian',
            'arabic': 'Arabic',
            'dutch': 'Dutch',
            'swedish': 'Swedish',
            'norwegian': 'Norwegian',
            'danish': 'Danish',
            'polish': 'Polish',
            'turkish': 'Turkish',
            'greek': 'Greek',
            'hebrew': 'Hebrew',
            'hindi': 'Hindi',
            'thai': 'Thai',
        };
        return languages[code] || code;
    }

    private async trackVocabulary(userId: string, vocabulary: any[]): Promise<void> {
        try {
            for (const vocab of vocabulary) {
                await settingsService.addVocabularyWord(
                    userId,
                    vocab.word,
                    vocab.translation,
                    vocab.part_of_speech,
                    vocab.example_sentence
                );
            }
        } catch (error) {
            console.error('Error tracking vocabulary:', error);
        }
    }

    // Method to start a new conversation (clear history)
    startNewConversation(): void {
        this.conversationHistory = [];
        this.currentSettings = null;
    }

    // Method to get conversation history (for debugging or persistence)
    getConversationHistory(): ChatMessage[] {
        return [...this.conversationHistory];
    }

    // Method to update settings for current conversation
    updateSettings(settings: UserSettings): void {
        this.currentSettings = settings;
        // Regenerate system prompt if conversation is active
        if (this.conversationHistory.length > 0) {
            const systemPrompt = this.generateStructuredSystemPrompt();
            this.conversationHistory[0] = { role: 'system', content: systemPrompt };
        }
    }
}

// Export a singleton instance
export const languageLearningService = new LanguageLearningService(); 