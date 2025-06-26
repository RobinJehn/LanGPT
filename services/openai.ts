import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.EXPO_PUBLIC_OPENAI_API_KEY, // You'll need to set this in your environment
    dangerouslyAllowBrowser: true, // Only for development - use a backend in production
});

export interface ChatMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
}

export class LanguageLearningService {
    private conversationHistory: ChatMessage[] = [
        {
            role: 'system',
            content: `You are LanGPT, an AI language learning assistant. Your role is to help users learn languages effectively. You should:

1. Be encouraging and patient
2. Provide clear explanations of grammar concepts
3. Give examples in context
4. Correct mistakes gently and explain why
5. Suggest practice exercises
6. Adapt to the user's skill level
7. Use the target language when appropriate, but explain in English if needed
8. Provide cultural context when relevant

Always respond in a helpful, educational manner. If the user doesn't specify a language, ask which language they want to learn.`
        }
    ];

    async sendMessage(userMessage: string): Promise<string> {
        try {
            // Add user message to conversation history
            this.conversationHistory.push({
                role: 'user',
                content: userMessage
            });

            // Make API call to OpenAI
            const completion = await openai.chat.completions.create({
                model: 'gpt-4.1-nano',
                messages: this.conversationHistory,
                max_tokens: 500,
                temperature: 0.7,
            });

            const assistantResponse = completion.choices[0]?.message?.content || 'Sorry, I couldn\'t generate a response.';

            // Add assistant response to conversation history
            this.conversationHistory.push({
                role: 'assistant',
                content: assistantResponse
            });

            return assistantResponse;
        } catch (error) {
            console.error('Error calling OpenAI API:', error);
            throw new Error('Failed to get response from AI assistant');
        }
    }

    // Method to start a new conversation (clear history)
    startNewConversation(): void {
        this.conversationHistory = [
            {
                role: 'system',
                content: `You are LanGPT, an AI language learning assistant. Your role is to help users learn languages effectively. You should:

1. Be encouraging and patient
2. Provide clear explanations of grammar concepts
3. Give examples in context
4. Correct mistakes gently and explain why
5. Suggest practice exercises
6. Adapt to the user's skill level
7. Use the target language when appropriate, but explain in English if needed
8. Provide cultural context when relevant

Always respond in a helpful, educational manner. If the user doesn't specify a language, ask which language they want to learn.`
            }
        ];
    }

    // Method to get conversation history (for debugging or persistence)
    getConversationHistory(): ChatMessage[] {
        return [...this.conversationHistory];
    }
}

// Export a singleton instance
export const languageLearningService = new LanguageLearningService(); 