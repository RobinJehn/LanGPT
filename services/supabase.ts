import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';
import { Platform } from 'react-native';

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Create storage adapter that works on both web and native
const createStorageAdapter = () => {
    if (Platform.OS === 'web') {
        // Use localStorage for web
        return {
            getItem: (key: string) => {
                try {
                    return Promise.resolve(localStorage.getItem(key));
                } catch {
                    return Promise.resolve(null);
                }
            },
            setItem: (key: string, value: string) => {
                try {
                    localStorage.setItem(key, value);
                    return Promise.resolve();
                } catch {
                    return Promise.resolve();
                }
            },
            removeItem: (key: string) => {
                try {
                    localStorage.removeItem(key);
                    return Promise.resolve();
                } catch {
                    return Promise.resolve();
                }
            },
        };
    } else {
        // Use AsyncStorage for native platforms
        return AsyncStorage;
    }
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
        storage: createStorageAdapter(),
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: false,
    },
});

// Database types
export interface User {
    id: string;
    email: string;
    created_at: string;
    updated_at: string;
}

export interface UsageStats {
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

export interface UserProfile {
    id: string;
    user_id: string;
    email: string;
    total_input_tokens: number;
    total_output_tokens: number;
    total_cost_usd: number;
    created_at: string;
    updated_at: string;
} 