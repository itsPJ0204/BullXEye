'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { User, Session } from '@supabase/supabase-js';

type UserRole = 'coach' | 'archer' | null;

type Academy = {
    id: string;
    name: string;
    location: string;
    code: string;
    coach_id: string;
};

type AuthContextType = {
    user: User | null;
    session: Session | null;
    isLoading: boolean;
    role: UserRole;
    profile: any | null; // typing 'any' for now to be flexible with schema
    academy: Academy | null;
    joinedAcademies: Academy[];
    switchAcademy: (academyId: string) => void;
    signIn: (email: string, password?: string) => Promise<{ error: any }>;
    signUp: (email: string, password: string, metadata: any) => Promise<{ error: any }>;
    signOut: () => Promise<void>;
    updateRole: (role: UserRole) => Promise<void>;
    createAcademy: (name: string, location: string) => Promise<string | null>;
    joinAcademy: (code: string) => Promise<{ success: boolean, error?: string }>;
    refreshUserData: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<any | null>(null);
    const [session, setSession] = useState<Session | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [role, setRole] = useState<UserRole>(null);
    const [academy, setAcademy] = useState<Academy | null>(null);
    const [joinedAcademies, setJoinedAcademies] = useState<Academy[]>([]);

    // Helper to fetch profile and academy data
    const fetchProfileData = async (userId: string) => {
        if (!supabase) return;
        try {
            // 1. Fetch Profile
            const { data: profileData, error: profileError } = await supabase
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .single();

            if (profileError && profileError.code !== 'PGRST116') {
                console.error('Error fetching profile:', profileError);
            }

            if (profileData) {
                setProfile(profileData);
                setRole(profileData.role as UserRole);


                // 2. Fetch Joined Academies
                const { data: membersData, error: membersError } = await supabase
                    .from('academy_members')
                    .select(`
                        academy_id,
                        academies (
                            id,
                            name,
                            location,
                            code,
                            coach_id
                        )
                    `)
                    .eq('user_id', userId);

                if (membersError) {
                    console.error('Error fetching academy memberships:', membersError);
                }

                const academiesList: Academy[] = [];
                if (membersData) {
                    membersData.forEach((item: any) => {
                        if (item.academies) {
                            academiesList.push(item.academies as Academy);
                        }
                    });
                }
                setJoinedAcademies(academiesList);

                // 3. Determine Current Academy (Default to profile.academy_id or first in list)
                let selectedAcademy: Academy | null = null;

                if (profileData.academy_id) {
                    // Only select if the user is actually a member (exists in the fetched list)
                    const found = academiesList.find(a => a.id === profileData.academy_id);
                    if (found) {
                        selectedAcademy = found;
                    }
                }

                // If no valid preference found, or preference invalid, fallback to first available
                if (!selectedAcademy && academiesList.length > 0) {
                    selectedAcademy = academiesList[0];
                }

                setAcademy(selectedAcademy);
            }
        } catch (error) {
            console.error('Unexpected error fetching profile:', error);
        }
    };

    useEffect(() => {
        let mounted = true;

        // Check for existing session
        if (supabase) {
            supabase?.auth.getSession().then(({ data: { session }, error }) => {
                if (error) {
                    console.error('Error restoring session:', error);
                    // If refresh token is invalid, force sign out to clear storage
                    if (error.message.includes('Refresh Token Not Found') || error.message.includes('Invalid Refresh Token')) {
                        supabase?.auth.signOut();
                    }
                }

                if (mounted) {
                    console.log('AuthContext: Session restored', { session });
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        console.log('AuthContext: Fetching profile for', session.user.id);
                        fetchProfileData(session.user.id).finally(() => {
                            console.log('AuthContext: Profile fetch done');
                            if (mounted) setIsLoading(false);
                        });
                    } else {
                        console.log('AuthContext: No user in session');
                        setIsLoading(false);
                    }
                }
            });

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                const eventName = event as string; // Cast to string to avoid type error if USER_DELETED is not in types
                if (eventName === 'SIGNED_OUT' || eventName === 'USER_DELETED') {
                    // clear state
                    setUser(null);
                    setSession(null);
                    setRole(null);
                    setAcademy(null);
                    setJoinedAcademies([]);
                    setIsLoading(false);
                    return;
                }

                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);
                    if (session?.user) {
                        // Clear old state before fetching new to avoid flashes if switching users (rare)
                        await fetchProfileData(session.user.id);
                        setIsLoading(false);
                    } else {
                        // Should be handled by SIGNED_OUT but just in case
                        setRole(null);
                        setAcademy(null);
                        setJoinedAcademies([]);
                        setIsLoading(false);
                    }
                }
            });

            return () => {
                mounted = false;
                subscription.unsubscribe();
            };
        } else {
            setIsLoading(false);
        }

        // Safety timeout: If auth takes longer than 5 seconds, stop loading
        const timer = setTimeout(() => {
            if (mounted) {
                console.warn('AuthContext: Loading timed out, forcing completion');
                setIsLoading(false);
            }
        }, 5000);

        return () => clearTimeout(timer);
    }, []);

    const updateRole = async (newRole: UserRole) => {
        if (!user || !supabase) return;

        // Update local state
        setRole(newRole);

        try {
            const { error } = await supabase
                .from('profiles')
                .update({ role: newRole })
                .eq('id', user.id);

            if (error) throw error;
        } catch (e) {
            console.error('Error updating role:', e);
            // revert local state if needed, or handle error
        }
    };

    const switchAcademy = async (academyId: string) => {
        const selected = joinedAcademies.find(a => a.id === academyId);
        if (selected) {
            setAcademy(selected);
            if (user && supabase) {
                // Persist selection to profile
                await supabase
                    .from('profiles')
                    .update({ academy_id: academyId })
                    .eq('id', user.id);
            }
        }
    };

    const createAcademy = async (name: string, location: string) => {
        if (!user || !supabase) return null;

        try {
            // 1. Check for duplicates (same coach + same name) is handled by unique constraint or check here
            // (Simplified for now)

            // Generate specific 6-char alphanumeric code
            const code = Math.random().toString(36).substring(2, 8).toUpperCase();

            // 2. Insert Academy
            const { data: newAcademy, error: createError } = await supabase
                .from('academies')
                .insert([
                    {
                        name,
                        location,
                        code,
                        coach_id: user.id
                    }
                ])
                .select()
                .single();

            if (createError) throw createError;

            // 3. Add to academy_members (Automatic via trigger? Or manual here)
            // Manual for safety/explicitness
            const { error: memberError } = await supabase
                .from('academy_members')
                .insert([{
                    academy_id: newAcademy.id,
                    user_id: user.id,
                    role: 'coach'
                }]);

            if (memberError) console.error("Error adding to members:", memberError);


            // 4. Update Profile to link to this academy as current
            const { error: profileError } = await supabase
                .from('profiles')
                .update({ academy_id: newAcademy.id, role: 'coach' })
                .eq('id', user.id);

            if (profileError) throw profileError;

            // 5. Update local state
            setAcademy(newAcademy);
            setRole('coach');
            setJoinedAcademies(prev => [...prev, newAcademy]);

            return code;
        } catch (e) {
            console.error('Error creating academy:', e);
            return null;
        }
    };

    const joinAcademy = async (code: string) => {
        if (!user || !supabase) return { success: false, error: 'Not authenticated' };

        try {
            // 1. Find Academy
            const { data: foundAcademy, error: searchError } = await supabase
                .from('academies')
                .select('*')
                .eq('code', code)
                .single();

            if (searchError || !foundAcademy) {
                console.error('Academy not found or error:', searchError);
                return { success: false, error: 'Invalid academy code.' };
            }

            // check if already joined
            if (joinedAcademies.some(a => a.id === foundAcademy.id)) {
                return { success: false, error: 'You are already a member of this academy.' };
            }

            // 2. Add to Members
            const { error: memberError } = await supabase
                .from('academy_members')
                .insert([{
                    academy_id: foundAcademy.id,
                    user_id: user.id,
                    role: 'archer'
                }]);

            if (memberError) throw memberError;

            // 3. Update Profile to set as current
            const { error: updateError } = await supabase
                .from('profiles')
                .update({ academy_id: foundAcademy.id, role: 'archer' })
                .eq('id', user.id);

            if (updateError) throw updateError;

            setAcademy(foundAcademy);
            setJoinedAcademies(prev => [...prev, foundAcademy]);
            return { success: true };
        } catch (e) {
            console.error('Error joining academy:', e);
            return { success: false, error: 'An unexpected error occurred.' };
        }
    };

    const signIn = async (email: string, password?: string) => {
        if (!supabase) return { error: { message: 'Supabase not initialized' } };

        // For this app we assume password login.
        // If we want OTP, we can add logic.
        if (password) {
            const { error } = await supabase.auth.signInWithPassword({ email, password });
            return { error };
        }
        return { error: 'Password required' };
    };

    const signUp = async (email: string, password: string, metadata: any) => {
        if (!supabase) return { error: { message: 'Supabase not initialized' } };

        // 1. Sign Up User
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: metadata, // Stores in auth.users metadata
            },
        });

        if (error) return { error };

        // Profile creation is handled by Triggers (supabase/triggers_v2.sql)
        // But if that fails or is delayed, we might want to ensure it here?
        // Relying on trigger for now as per previous setup.

        return { error: null };
    };

    const signOut = async () => {
        if (supabase) await supabase.auth.signOut();
        setUser(null);
        setRole(null);
        setAcademy(null);
        setJoinedAcademies([]);
    };

    const refreshUserData = async () => {
        if (user) {
            await fetchProfileData(user.id);
        }
    };

    const value = {
        user,
        profile,
        session,
        isLoading,
        role,
        academy,
        joinedAcademies,
        switchAcademy,
        signIn,
        signUp,
        signOut,
        updateRole,
        createAcademy,
        joinAcademy,
        refreshUserData
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
