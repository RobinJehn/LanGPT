import { supabase, UserProfile } from './supabase';

export interface AuthState {
    user: UserProfile | null;
    loading: boolean;
    error: string | null;
}

export class AuthService {
    async signUp(email: string, password: string): Promise<{ user: UserProfile | null; error: string | null }> {
        try {
            console.log('Starting sign up process for:', email);

            // Check if Supabase is properly configured
            if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
                console.error('Missing Supabase environment variables');
                return { user: null, error: 'Supabase configuration is missing. Please check your environment variables.' };
            }

            const { data, error } = await supabase.auth.signUp({
                email,
                password,
            });

            console.log('Sign up response:', { data, error });

            if (error) {
                console.error('Supabase auth error:', error);
                return { user: null, error: error.message };
            }

            if (data.user) {
                console.log('User created successfully:', data.user.id);

                // Check if user needs email confirmation
                if (!data.user.email_confirmed_at) {
                    console.log('Email confirmation required');
                    return { user: null, error: null }; // No error, but no user either
                }

                // Create user profile if email is confirmed
                const { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .insert([
                        {
                            user_id: data.user.id,
                            email: data.user.email!,
                            total_input_tokens: 0,
                            total_output_tokens: 0,
                            total_cost_usd: 0,
                        },
                    ])
                    .select()
                    .single();

                console.log('Profile creation response:', { profile, profileError });

                if (profileError) {
                    console.error('Profile creation error:', profileError);
                    return { user: null, error: `Profile creation failed: ${profileError.message}` };
                }

                console.log('Sign up completed successfully');
                return { user: profile, error: null };
            }

            console.log('No user data returned from sign up');
            return { user: null, error: 'Failed to create user - no user data returned' };
        } catch (error) {
            console.error('Unexpected error during sign up:', error);
            return { user: null, error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }

    async resendConfirmationEmail(email: string): Promise<{ error: string | null }> {
        try {
            console.log('Resending confirmation email to:', email);

            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
            });

            if (error) {
                console.error('Resend confirmation error:', error);
                return { error: error.message };
            }

            console.log('Confirmation email resent successfully');
            return { error: null };
        } catch (error) {
            console.error('Unexpected error during resend:', error);
            return { error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }

    async signIn(email: string, password: string): Promise<{ user: UserProfile | null; error: string | null }> {
        try {
            console.log('Starting sign in process for:', email);

            // Check if Supabase is properly configured
            if (!process.env.EXPO_PUBLIC_SUPABASE_URL || !process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY) {
                console.error('Missing Supabase environment variables');
                return { user: null, error: 'Supabase configuration is missing. Please check your environment variables.' };
            }

            const { data, error } = await supabase.auth.signInWithPassword({
                email,
                password,
            });

            console.log('Sign in response:', { data, error });

            if (error) {
                console.error('Supabase auth error:', error);
                return { user: null, error: error.message };
            }

            if (data.user) {
                console.log('User signed in successfully:', data.user.id);

                // Get user profile
                let { data: profile, error: profileError } = await supabase
                    .from('user_profiles')
                    .select('*')
                    .eq('user_id', data.user.id)
                    .single();

                console.log('Profile fetch response:', { profile, profileError });

                // If profile doesn't exist, create it (user confirmed email but profile wasn't created)
                if (profileError && profileError.code === 'PGRST116') {
                    console.log('Profile not found, creating new profile');
                    const { data: newProfile, error: createError } = await supabase
                        .from('user_profiles')
                        .insert([
                            {
                                user_id: data.user.id,
                                email: data.user.email!,
                                total_input_tokens: 0,
                                total_output_tokens: 0,
                                total_cost_usd: 0,
                            },
                        ])
                        .select()
                        .single();

                    if (createError) {
                        console.error('Profile creation error:', createError);
                        return { user: null, error: `Failed to create user profile: ${createError.message}` };
                    }

                    profile = newProfile;
                    profileError = null;
                } else if (profileError) {
                    console.error('Profile fetch error:', profileError);
                    return { user: null, error: `Failed to fetch user profile: ${profileError.message}` };
                }

                console.log('Sign in completed successfully');
                return { user: profile, error: null };
            }

            console.log('No user data returned from sign in');
            return { user: null, error: 'Failed to sign in - no user data returned' };
        } catch (error) {
            console.error('Unexpected error during sign in:', error);
            return { user: null, error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }

    async signOut(): Promise<{ error: string | null }> {
        try {
            console.log('Starting sign out process');
            const { error } = await supabase.auth.signOut();

            if (error) {
                console.error('Sign out error:', error);
                return { error: error.message };
            }

            console.log('Sign out completed successfully');
            return { error: null };
        } catch (error) {
            console.error('Unexpected error during sign out:', error);
            return { error: `An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'}` };
        }
    }

    async getCurrentUser(): Promise<UserProfile | null> {
        try {
            console.log('Getting current user');
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                console.log('No current user found');
                return null;
            }

            console.log('Current user found:', user.id);
            const { data: profile } = await supabase
                .from('user_profiles')
                .select('*')
                .eq('user_id', user.id)
                .single();

            console.log('Current user profile:', profile);
            return profile;
        } catch (error) {
            console.error('Error getting current user:', error);
            return null;
        }
    }

    async getSession() {
        return await supabase.auth.getSession();
    }
}

export const authService = new AuthService(); 