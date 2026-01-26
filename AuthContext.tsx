import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { AuthUser, Company } from './types';
import { supabase } from './supabaseClient';
import { getCurrentUser, login, logout, register, loginWithMicrosoft, checkNeedsProfileCompletion } from './authService';

interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAdmin: boolean;
    isSuperAdmin: boolean;
    company: Company | null;
    needsProfileCompletion: boolean;
    isPasswordRecovery: boolean;
    login: (email: string, senha: string) => Promise<{ success: boolean; error?: string }>;
    register: (nome: string, email: string, senha: string, companyId?: string) => Promise<{ success: boolean; error?: string }>;
    loginWithMicrosoft: () => Promise<{ success: boolean; error?: string }>;
    logout: () => Promise<void>;
    markProfileComplete: () => void;
    clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

    useEffect(() => {
        // Safety timeout - force isLoading to false after 8 seconds if init hangs
        const timeoutId = setTimeout(() => {
            if (isLoading) {
                console.warn('Auth initialization timed out, forcing loading to false');
                setIsLoading(false);
            }
        }, 8000);

        // Check for existing session on mount
        const initAuth = async () => {
            console.log('initAuth started');
            try {
                // Get session once and reuse for both functions
                const { data: { session } } = await supabase.auth.getSession();
                console.log('Session obtained:', session ? 'exists' : 'null');

                if (session?.user) {
                    console.log('Getting current user...');
                    // Pass session to avoid redundant getUser calls
                    const currentUser = await getCurrentUser(session);
                    console.log('Current user obtained:', currentUser ? currentUser.email : 'null');
                    setUser(currentUser);

                    // Check if existing user needs profile completion (passing user data)
                    console.log('Checking profile completion...');
                    const needsCompletion = await checkNeedsProfileCompletion(session.user);
                    console.log('Needs completion:', needsCompletion);
                    setNeedsProfileCompletion(needsCompletion);
                } else {
                    console.log('No session, checking URL for recovery flag');
                    // Check if we're coming from a reset password link even without a session yet
                    const params = new URLSearchParams(window.location.search);
                    if (params.get('reset_password') === 'true' || window.location.hash.includes('type=recovery')) {
                        console.log('Recovery flag detected in URL');
                        setIsPasswordRecovery(true);
                    }
                    setUser(null);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
            } finally {
                console.log('initAuth finished, setting isLoading to false');
                setIsLoading(false);
                clearTimeout(timeoutId);
            }
        };

        initAuth();

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('Auth state change:', event);

            // Handle password recovery event
            if (event === 'PASSWORD_RECOVERY') {
                console.log('Password recovery event detected');
                setIsPasswordRecovery(true);
                if (session?.user) {
                    // Pass session to avoid redundant getUser call
                    const currentUser = await getCurrentUser(session);
                    setUser(currentUser);
                }
                return;
            }

            // Skip INITIAL_SESSION if we already handled it in initAuth
            if (event === 'INITIAL_SESSION' && session?.user) {
                return;
            }

            if (event === 'SIGNED_IN' && session?.user) {
                // Pass session to avoid redundant getUser call
                const currentUser = await getCurrentUser(session);
                setUser(currentUser);

                // Check if this user needs to complete profile (magic link users)
                // But not if we're in password recovery mode
                if (!isPasswordRecovery) {
                    const needsCompletion = await checkNeedsProfileCompletion(session.user);
                    console.log('Needs profile completion:', needsCompletion);
                    setNeedsProfileCompletion(needsCompletion);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setNeedsProfileCompletion(false);
                setIsPasswordRecovery(false);
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                // On token refresh, update user with new session data
                const currentUser = await getCurrentUser(session);
                setUser(currentUser);
            }
        });

        return () => {
            subscription.unsubscribe();
            clearTimeout(timeoutId);
        };
    }, []);

    const handleLogin = async (email: string, senha: string) => {
        const result = await login(email, senha);
        if (result.success && result.user) {
            setUser(result.user);
        }
        return { success: result.success, error: result.error };
    };

    const handleRegister = async (nome: string, email: string, senha: string, companyId?: string) => {
        const result = await register(nome, email, senha, companyId);
        if (result.success && result.user) {
            setUser(result.user);
        }
        return { success: result.success, error: result.error };
    };

    const handleLoginWithMicrosoft = async () => {
        const result = await loginWithMicrosoft();
        // OAuth redirects, so user will be set on return via onAuthStateChange
        return { success: result.success, error: result.error };
    };

    const handleLogout = async () => {
        console.log('handleLogout called');
        try {
            await logout();
            console.log('logout completed');
        } catch (err) {
            console.error('handleLogout error:', err);
        }
        setUser(null);
        setNeedsProfileCompletion(false);
        console.log('state cleared');
    };

    const markProfileComplete = () => {
        setNeedsProfileCompletion(false);
    };

    const clearPasswordRecovery = () => {
        setIsPasswordRecovery(false);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                isLoading,
                isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
                isSuperAdmin: user?.role === 'super_admin',
                company: user?.company || null,
                needsProfileCompletion,
                isPasswordRecovery,
                login: handleLogin,
                register: handleRegister,
                loginWithMicrosoft: handleLoginWithMicrosoft,
                logout: handleLogout,
                markProfileComplete,
                clearPasswordRecovery,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
