import { supabase } from './supabase';

export interface UserSettings {
    id: string;
    user_id: string;
    target_language: string;
    always_correct_sentences: boolean;
    correct_punctuation: boolean;
    correct_capitalization: boolean;
    correct_accents: boolean;
    suggest_natural_alternatives: boolean;
    show_verb_conjugations: boolean;
    explain_tense_usage: boolean;
    track_vocabulary: boolean;
    custom_instructions: string | null;
    created_at: string;
    updated_at: string;
}

export interface VocabularyWord {
    id: string;
    user_id: string;
    word: string;
    translation: string | null;
    part_of_speech: string | null;
    example_sentence: string | null;
    difficulty_level: number;
    created_at: string;
}

export const AVAILABLE_LANGUAGES = [
    { code: 'spanish', name: 'Spanish' },
    { code: 'french', name: 'French' },
    { code: 'german', name: 'German' },
    { code: 'italian', name: 'Italian' },
    { code: 'portuguese', name: 'Portuguese' },
    { code: 'japanese', name: 'Japanese' },
    { code: 'chinese', name: 'Chinese' },
    { code: 'korean', name: 'Korean' },
    { code: 'russian', name: 'Russian' },
    { code: 'arabic', name: 'Arabic' },
    { code: 'dutch', name: 'Dutch' },
    { code: 'swedish', name: 'Swedish' },
    { code: 'norwegian', name: 'Norwegian' },
    { code: 'danish', name: 'Danish' },
    { code: 'polish', name: 'Polish' },
    { code: 'turkish', name: 'Turkish' },
    { code: 'greek', name: 'Greek' },
    { code: 'hebrew', name: 'Hebrew' },
    { code: 'hindi', name: 'Hindi' },
    { code: 'thai', name: 'Thai' },
];

export class SettingsService {
    async getUserSettings(userId: string): Promise<{ settings: UserSettings | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('user_settings')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error && error.code === 'PGRST116') {
                // Settings don't exist, create default settings
                return await this.createDefaultSettings(userId);
            }

            if (error) {
                return { settings: null, error: error.message };
            }

            return { settings: data, error: null };
        } catch (error) {
            return { settings: null, error: 'Failed to fetch user settings' };
        }
    }

    async createDefaultSettings(userId: string): Promise<{ settings: UserSettings | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('user_settings')
                .insert([
                    {
                        user_id: userId,
                        target_language: 'spanish',
                        always_correct_sentences: true,
                        correct_punctuation: false,
                        correct_capitalization: false,
                        correct_accents: false,
                        suggest_natural_alternatives: true,
                        show_verb_conjugations: true,
                        explain_tense_usage: true,
                        track_vocabulary: true,
                        custom_instructions: null,
                    },
                ])
                .select()
                .single();

            if (error) {
                return { settings: null, error: error.message };
            }

            return { settings: data, error: null };
        } catch (error) {
            return { settings: null, error: 'Failed to create default settings' };
        }
    }

    async updateSettings(
        userId: string,
        updates: Partial<Omit<UserSettings, 'id' | 'user_id' | 'created_at' | 'updated_at'>>
    ): Promise<{ settings: UserSettings | null; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('user_settings')
                .update(updates)
                .eq('user_id', userId)
                .select()
                .single();

            if (error) {
                return { settings: null, error: error.message };
            }

            return { settings: data, error: null };
        } catch (error) {
            return { settings: null, error: 'Failed to update settings' };
        }
    }

    async getVocabulary(userId: string): Promise<{ vocabulary: VocabularyWord[]; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('vocabulary')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false });

            if (error) {
                return { vocabulary: [], error: error.message };
            }

            return { vocabulary: data || [], error: null };
        } catch (error) {
            return { vocabulary: [], error: 'Failed to fetch vocabulary' };
        }
    }

    async addVocabularyWord(
        userId: string,
        word: string,
        translation?: string,
        partOfSpeech?: string,
        exampleSentence?: string
    ): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase.rpc('update_vocabulary_usage', {
                user_id_param: userId,
                word_param: word.toLowerCase().trim(),
            });

            if (error) {
                return { error: error.message };
            }

            // Update additional information if provided
            if (translation || partOfSpeech || exampleSentence) {
                const { error: updateError } = await supabase
                    .from('vocabulary')
                    .update({
                        translation: translation || null,
                        part_of_speech: partOfSpeech || null,
                        example_sentence: exampleSentence || null,
                    })
                    .eq('user_id', userId)
                    .eq('word', word.toLowerCase().trim());

                if (updateError) {
                    console.error('Failed to update vocabulary details:', updateError);
                }
            }

            return { error: null };
        } catch (error) {
            return { error: 'Failed to add vocabulary word' };
        }
    }

    async updateVocabularyWord(
        wordId: string,
        updates: Partial<Omit<VocabularyWord, 'id' | 'user_id' | 'created_at'>>
    ): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from('vocabulary')
                .update(updates)
                .eq('id', wordId);

            if (error) {
                return { error: error.message };
            }

            return { error: null };
        } catch (error) {
            return { error: 'Failed to update vocabulary word' };
        }
    }

    async deleteVocabularyWord(wordId: string): Promise<{ error: string | null }> {
        try {
            const { error } = await supabase
                .from('vocabulary')
                .delete()
                .eq('id', wordId);

            if (error) {
                return { error: error.message };
            }

            return { error: null };
        } catch (error) {
            return { error: 'Failed to delete vocabulary word' };
        }
    }

    generateSystemPrompt(settings: UserSettings): string {
        let prompt = `You are LanGPT, an AI language learning assistant specialized in teaching ${settings.target_language}. Your role is to help users learn ${settings.target_language} effectively.`;

        // Add specific instructions based on user preferences
        if (settings.always_correct_sentences) {
            prompt += '\n\n1. Always correct any grammatical errors in the user\'s sentences and explain why the correction is needed.';
        }

        if (settings.suggest_natural_alternatives) {
            prompt += '\n\n2. Suggest more natural or colloquial ways to express the same idea when appropriate.';
        }

        if (settings.show_verb_conjugations) {
            prompt += '\n\n3. If the user makes a verb conjugation error, provide all the conjugations for that verb in the relevant tense.';
        }

        if (settings.explain_tense_usage) {
            prompt += '\n\n4. When the user uses the wrong tense, explain which tense should be used and why, with examples.';
        }

        // Add custom instructions if provided
        if (settings.custom_instructions) {
            prompt += `\n\n5. Additional instructions: ${settings.custom_instructions}`;
        }

        prompt += '\n\nAlways be encouraging and patient. Adapt to the user\'s skill level and provide clear explanations.';

        return prompt;
    }
}

export const settingsService = new SettingsService(); 