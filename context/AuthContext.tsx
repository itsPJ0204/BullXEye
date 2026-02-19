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

    // Ref to track the latest auth request to prevent race conditions
    const latestAuthRequestId = React.useRef<number>(0);

    // Helper to fetch profile and academy data with strict timeout and error handling
    // Helper to fetch profile and academy data with strict timeout and error handling
    const fetchProfileData = async (userId: string, requestId: number) => {
        if (!supabase) return;
        const client = supabase; // Capture for TS safety

        console.log(`AuthContext: Fetching profile for ${userId} (Req: ${requestId})`);

        // Timeout promise: ONLY for UI loading state toggle
        const timeoutPromise = new Promise((_, reject) =>
            setTimeout(() => reject(new Error('UI_TIMEOUT')), 5000)
        );

        // Actual Data Fetch logic (runs until completion)
        const fetchDataPromise = async () => {
            console.log('AuthContext: Starting DB query for profile...');
            const { data: profileData, error } = await client
                .from('profiles')
                .select('*')
                .eq('id', userId)
                .maybeSingle();

            console.log('AuthContext: DB query finished.', { profileData, error });

            if (error) throw error;

            // If we get data, update state immediately (even if late!)
            if (requestId === latestAuthRequestId.current && profileData) {
                setProfile(profileData);
                setRole(profileData.role as UserRole);
                console.log('AuthContext: Profile (Role) loaded.');

                // If we were still loading (or if we timed out and stopped loading), 
                // this update will fix the UI.
                setIsLoading(false);

                // Now fetch Academies (Background)
                try {
                    const { data: membersData } = await client
                        .from('academy_members')
                        .select(`
                            academy_id,
                            academies (id, name, location, code, coach_id)
                        `)
                        .eq('user_id', userId);

                    if (requestId !== latestAuthRequestId.current) return;

                    let academiesList: Academy[] = [];
                    let selectedAcademy: Academy | null = null;
                    if (membersData) {
                        membersData.forEach((item: any) => {
                            if (item.academies) academiesList.push(item.academies as Academy);
                        });
                    }
                    setJoinedAcademies(academiesList);

                    if (profileData.academy_id) {
                        selectedAcademy = academiesList.find(a => a.id === profileData.academy_id) || null;
                    }
                    if (!selectedAcademy && academiesList.length > 0) {
                        selectedAcademy = academiesList[0];
                    }
                    setAcademy(selectedAcademy);
                    console.log('AuthContext: Academies loaded.');

                } catch (err) {
                    console.warn('AuthContext: Academies fetch failed', err);
                }

                return profileData;
            }
            return null;
        };

        try {
            // Race the LOADING INDICATION, not the data fetch itself
            // We want data fetch to continue even if UI shows "taking a while"
            await Promise.race([
                fetchDataPromise(),
                timeoutPromise
            ]);

        } catch (error: any) {
            if (error.message === 'UI_TIMEOUT') {
                console.warn('AuthContext: Profile fetch taking long (UI released).');
                // Allow UI to show "Finalizing setup" or dashboard structure
                if (requestId === latestAuthRequestId.current) {
                    setIsLoading(false);
                }
            } else {
                console.error('AuthContext: Profile fetch failed:', error);
                if (requestId === latestAuthRequestId.current) {
                    setIsLoading(false);
                }
            }
        }
    };

    useEffect(() => {
        let mounted = true;

        const initAuth = async () => {
            if (!supabase) return;

            const requestId = ++latestAuthRequestId.current;
            console.log(`AuthContext: Initializing (Req: ${requestId})`);

            try {
                // Get Session
                const { data: { session }, error } = await supabase.auth.getSession();

                if (error) {
                    console.error('AuthContext: Session error', error);
                    if (mounted) setIsLoading(false);
                    return;
                }

                if (mounted) {
                    setSession(session);
                    setUser(session?.user ?? null);

                    if (session?.user) {
                        await fetchProfileData(session.user.id, requestId);
                    } else {
                        setIsLoading(false);
                    }
                }
            } catch (err) {
                console.error('AuthContext: initAuth critical failure', err);
                if (mounted) setIsLoading(false);
            }
        };

        if (supabase) {
            initAuth();

            const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
                const eventName = event as string;
                console.log(`AuthContext: Auth event ${eventName}`);

                if (eventName === 'SIGNED_OUT' || eventName === 'USER_DELETED') {
                    latestAuthRequestId.current++; // Invalidate pending requests
                    setUser(null);
                    setSession(null);
                    setRole(null);
                    setAcademy(null);
                    setJoinedAcademies([]);
                    setIsLoading(false);
                    return;
                }

                if (eventName === 'SIGNED_IN' || eventName === 'TOKEN_REFRESHED' || eventName === 'INITIAL_SESSION') {
                    const requestId = ++latestAuthRequestId.current;

                    if (session?.user) {
                        // Crucial: Set loading true immediately if switching users or signing in
                        // But be careful not to flash loading on simple token refreshes if we already have data?
                        // For safety against glitches, let's keep loading=true until data checks out.
                        setIsLoading(true);

                        setSession(session);
                        setUser(session.user);

                        await fetchProfileData(session.user.id, requestId);
                    } else {
                        setSession(null);
                        setUser(null);
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
        console.log('AuthContext: Attempting sign in for', email);

        try {
            if (password) {
                const { data, error } = await supabase.auth.signInWithPassword({ email, password });

                if (error) {
                    console.error('AuthContext: Sign in error', error);
                    return { error };
                }

                console.log('AuthContext: Sign in successful', data);
                // State update handled by onAuthStateChange
                return { error: null };
            }
            return { error: { message: 'Password required' } };
        } catch (err: any) {
            console.error('AuthContext: Sign in exception', err);
            return { error: { message: err.message || 'An unexpected error occurred during sign in.' } };
        }
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
        // State update handled by onAuthStateChange
    };

    const refreshUserData = async () => {
        if (user) {
            const requestId = ++latestAuthRequestId.current;
            await fetchProfileData(user.id, requestId);
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
