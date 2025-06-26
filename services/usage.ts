import { supabase } from './supabase';

// OpenAI pricing per 1K tokens (as of 2024)
const PRICING = {
    'gpt-4': { input: 0.03, output: 0.06 }, // per 1K tokens
    'gpt-4-turbo': { input: 0.01, output: 0.03 },
    'gpt-3.5-turbo': { input: 0.0015, output: 0.002 },
    'gpt-4o': { input: 0.005, output: 0.015 },
    'gpt-4o-mini': { input: 0.00015, output: 0.0006 },
    'gpt-4.1-nano': { input: 0.0001, output: 0.0002 }, // estimated pricing
};

export interface DetailedUsageStats {
    id: string;
    user_id: string;
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
    input_cost_usd: number;
    output_cost_usd: number;
    total_cost_usd: number;
    model: string;
    created_at: string;
}

export interface UserStats {
    total_input_tokens: number;
    total_output_tokens: number;
    total_cost_usd: number;
    usage_by_model: { [model: string]: { input_tokens: number; output_tokens: number; cost_usd: number } };
}

export class UsageService {
    calculateCost(model: string, inputTokens: number, outputTokens: number): { inputCost: number; outputCost: number; totalCost: number } {
        const pricing = PRICING[model as keyof typeof PRICING];
        if (!pricing) {
            console.warn(`Unknown model: ${model}, using gpt-3.5-turbo pricing`);
            return this.calculateCost('gpt-3.5-turbo', inputTokens, outputTokens);
        }

        const inputCost = (inputTokens / 1000) * pricing.input;
        const outputCost = (outputTokens / 1000) * pricing.output;
        const totalCost = inputCost + outputCost;

        return { inputCost, outputCost, totalCost };
    }

    async recordUsage(
        userId: string,
        model: string,
        inputTokens: number,
        outputTokens: number
    ): Promise<{ error: string | null }> {
        try {
            const totalTokens = inputTokens + outputTokens;
            const { inputCost, outputCost, totalCost } = this.calculateCost(model, inputTokens, outputTokens);

            // Record detailed usage
            const { error: usageError } = await supabase
                .from('usage_stats')
                .insert([
                    {
                        user_id: userId,
                        input_tokens: inputTokens,
                        output_tokens: outputTokens,
                        total_tokens: totalTokens,
                        input_cost_usd: inputCost,
                        output_cost_usd: outputCost,
                        total_cost_usd: totalCost,
                        model,
                    },
                ]);

            if (usageError) {
                return { error: usageError.message };
            }

            // Update user profile totals using raw SQL for atomic updates
            const { error: profileError } = await supabase.rpc('update_user_profile_totals', {
                user_id_param: userId,
                input_tokens_param: inputTokens,
                output_tokens_param: outputTokens,
                cost_param: totalCost,
            });

            if (profileError) {
                return { error: profileError.message };
            }

            return { error: null };
        } catch (error) {
            return { error: 'Failed to record usage' };
        }
    }

    async getUserUsage(userId: string): Promise<{ usage: DetailedUsageStats[]; error: string | null }> {
        try {
            const { data, error } = await supabase
                .from('usage_stats')
                .select('*')
                .eq('user_id', userId)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) {
                return { usage: [], error: error.message };
            }

            return { usage: data || [], error: null };
        } catch (error) {
            return { usage: [], error: 'Failed to fetch usage data' };
        }
    }

    async getUserStats(userId: string): Promise<{ stats: UserStats | null; error: string | null }> {
        try {
            // Get all usage data for the user
            const { data, error } = await supabase
                .from('usage_stats')
                .select('*')
                .eq('user_id', userId);

            if (error) {
                return { stats: null, error: error.message };
            }

            if (!data || data.length === 0) {
                return {
                    stats: {
                        total_input_tokens: 0,
                        total_output_tokens: 0,
                        total_cost_usd: 0,
                        usage_by_model: {},
                    },
                    error: null,
                };
            }

            // Calculate totals and breakdown by model
            let totalInputTokens = 0;
            let totalOutputTokens = 0;
            let totalCost = 0;
            const usageByModel: { [model: string]: { input_tokens: number; output_tokens: number; cost_usd: number } } = {};

            data.forEach((item: any) => {
                totalInputTokens += item.input_tokens || 0;
                totalOutputTokens += item.output_tokens || 0;
                totalCost += item.total_cost_usd || 0;

                if (!usageByModel[item.model]) {
                    usageByModel[item.model] = { input_tokens: 0, output_tokens: 0, cost_usd: 0 };
                }
                usageByModel[item.model].input_tokens += item.input_tokens || 0;
                usageByModel[item.model].output_tokens += item.output_tokens || 0;
                usageByModel[item.model].cost_usd += item.total_cost_usd || 0;
            });

            return {
                stats: {
                    total_input_tokens: totalInputTokens,
                    total_output_tokens: totalOutputTokens,
                    total_cost_usd: totalCost,
                    usage_by_model: usageByModel,
                },
                error: null,
            };
        } catch (error) {
            return { stats: null, error: 'Failed to fetch user stats' };
        }
    }

    getAvailableModels() {
        return Object.keys(PRICING).map(model => ({
            name: model,
            input_price: PRICING[model as keyof typeof PRICING].input,
            output_price: PRICING[model as keyof typeof PRICING].output,
        }));
    }

    estimateCost(model: string, estimatedInputTokens: number, estimatedOutputTokens: number): number {
        const { totalCost } = this.calculateCost(model, estimatedInputTokens, estimatedOutputTokens);
        return totalCost;
    }
}

export const usageService = new UsageService(); 