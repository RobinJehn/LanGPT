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
        has_issue: boolean;
    }[];
    vocabulary?: {
        word: string;
        translation?: string;
        part_of_speech?: string;
    }[];
    natural_alternatives?: {
        original: string;
        alternatives: string[];
        explanation: string;
        has_issue: boolean;
    }[];
    verb_conjugations?: {
        verb: string;
        tense: string;
        conjugations: { pronoun: string; form: string }[];
        explanation: string;
    }[];
    tense_explanation?: {
        original_tense: string;
        correct_tense: string;
        explanation: string;
        examples: string[];
        has_issue: boolean;
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
            console.log('System prompt:', systemPrompt);

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

            // Always log the raw GPT response
            console.log('[GPT RAW RESPONSE]', assistantResponseText);

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

            // Always log the parsed structured response
            console.log('[GPT PARSED RESPONSE]', structuredResponse);

            // Add assistant response to conversation history (only the main response text)
            this.conversationHistory.push({
                role: 'assistant',
                content: structuredResponse.response
            });

            // Track vocabulary if enabled and user is authenticated
            if (userId && this.currentSettings?.track_vocabulary && structuredResponse.vocabulary) {
                console.log('Vocabulary tracking enabled, user:', userId, 'vocabulary:', structuredResponse.vocabulary);
                await this.trackVocabulary(userId, structuredResponse.vocabulary);
            } else {
                console.log('Vocabulary tracking conditions not met:', {
                    userId: !!userId,
                    track_vocabulary: this.currentSettings?.track_vocabulary,
                    hasVocabulary: !!structuredResponse.vocabulary,
                    vocabulary: structuredResponse.vocabulary
                });
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
  "response": "Your main response to the user in natural, conversational language. ONLY reply to the user's prompt, do NOT comment on the user's language, mistakes, or correctness in this field—just reply as if you were having a conversation."`;

        let rules = [];

        if (this.currentSettings?.always_correct_sentences) {
            jsonStructure += `,
  "corrections": [{"original": "incorrect text", "corrected": "correct text", "explanation": "why it's wrong", "has_issue": true}]`;
            let rule = "Only include the 'corrections' field if the user made a mistake. For corrections, always include a boolean field (has_issue) indicating whether there was a problem with the user's usage.";

            if (this.currentSettings?.correct_accents) {
                rule += " Don't correct missing accents (e.g. 'como' instead of 'cómo').";
            } else {
                rule += " Correct missing accents (e.g. 'como' instead of 'cómo').";
            }

            if (this.currentSettings?.correct_punctuation) {
                rule += " Don't correct missing punctuation (e.g. 'Hola' instead of '¡Hola!').";
            } else {
                rule += " Correct missing punctuation (e.g. 'Hola' instead of '¡Hola!').";
            }

            if (this.currentSettings?.correct_capitalization) {
                rule += " Don't correct missing capitalization (e.g. 'hola' instead of 'Hola').";
            } else {
                rule += " Correct missing capitalization (e.g. 'hola' instead of 'Hola').";
            }

            rules.push(rule);
        }

        if (this.currentSettings?.track_vocabulary) {
            jsonStructure += `,
  "vocabulary": [{"word": "target_language_word", "translation": "English translation", "part_of_speech": "noun/verb/etc"}]`;
            rules.push("For verbs, always provide the base form (infinitive) in the vocabulary section, not conjugated forms. For example: - If user says 'estás', track 'estar' - If user says 'hablo', track 'hablar' - If user says 'comí', track 'comer'");
        }

        if (this.currentSettings?.suggest_natural_alternatives) {
            jsonStructure += `,
  "natural_alternatives": [{"original": "user's phrase", "alternatives": ["better phrase 1", "better phrase 2"], "explanation": "why these are better", "has_issue": true}]`;
            rules.push("Only include the 'natural_alternatives' field if the user's original phrase was unnatural or awkward. Do NOT include natural_alternatives just for spelling, punctuation, or grammar mistakes if the original was otherwise natural. Do not include any alternatives that are already shown in the corrections section.");
        }

        if (this.currentSettings?.show_verb_conjugations) {
            jsonStructure += `,
  "verb_conjugations": [{
    "verb": "base_verb",
    "tense": "present/past/future/imperativo/etc",
    "conjugations": [{ "pronoun": "yo", "form": "estoy" }, { "pronoun": "tú", "form": "estás" }, ...],
    "explanation": "when to use this tense"
  }]`;
            rules.push(
                "Always include the 'verb_conjugations' field, regardless of whether a mistake was made. " +
                "For each verb, provide an array of objects for conjugations, each with a 'pronoun' and 'form'. " +
                "If multiple verbs share the same tense, group them together in a single table (for UI rendering). " +
                "If a verb is in the 'imperativo' tense, put it in its own table, as the pronouns differ (no 'yo', special forms for 'usted', etc.). " +
                "Example: {\"pronoun\": \"yo\", \"form\": \"estoy\"}. " +
                "For imperativo, only include the appropriate pronouns (tú, usted, vosotros, ustedes). " +
                "If multiple verbs are relevant, include all of them in the array."
            );
        }

        if (this.currentSettings?.explain_tense_usage) {
            jsonStructure += `,
  "tense_explanation": [{"original_tense": "presente/preterito/futuro/etc", "correct_tense": "presente/preterito/futuro/etc", "explanation": "why", "examples": ["example 1", "example 2"], "has_issue": true}]`;
            rules.push("For tense_explanation, only include it and set has_issue to true if the user used the wrong tense (e.g., present instead of past, future instead of present). Do NOT set has_issue to true for other errors like using the wrong verb, spelling mistakes, or punctuation errors.");
        }

        jsonStructure += `\n}`;

        prompt += `\n${jsonStructure}

IMPORTANT RULES:`;
        if (rules.length > 0) {
            rules.forEach((rule, idx) => {
                prompt += `\n${idx + 1}. ${rule}`;
            });
        }

        prompt += `\n\nAlways be encouraging and patient. Adapt to the user's skill level and provide clear explanations.`;

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
            console.log('Tracking vocabulary for user:', userId, 'words:', vocabulary);
            for (const vocab of vocabulary) {
                console.log('Adding vocabulary word:', vocab);
                const result = await settingsService.addVocabularyWord(
                    userId,
                    vocab.word,
                    vocab.translation,
                    vocab.part_of_speech,
                );
                if (result.error) {
                    console.error('Error adding vocabulary word:', result.error);
                } else {
                    console.log('Successfully added vocabulary word:', vocab.word);
                }
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