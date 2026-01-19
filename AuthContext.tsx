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
        // Check for existing session on mount
        const initAuth = async () => {
            try {
                const currentUser = await getCurrentUser();
                setUser(currentUser);

                // Check if existing user needs profile completion
                if (currentUser) {
                    const needsCompletion = await checkNeedsProfileCompletion();
                    setNeedsProfileCompletion(needsCompletion);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
            } finally {
                setIsLoading(false);
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
                    const currentUser = await getCurrentUser();
                    setUser(currentUser);
                }
                return;
            }

            if (event === 'SIGNED_IN' && session?.user) {
                const currentUser = await getCurrentUser();
                setUser(currentUser);

                // Check if this user needs to complete profile (magic link users)
                // But not if we're in password recovery mode
                if (!isPasswordRecovery) {
                    const needsCompletion = await checkNeedsProfileCompletion();
                    console.log('Needs profile completion:', needsCompletion);
                    setNeedsProfileCompletion(needsCompletion);
                }
            } else if (event === 'SIGNED_OUT') {
                setUser(null);
                setNeedsProfileCompletion(false);
                setIsPasswordRecovery(false);
            }
        });

        return () => {
            subscription.unsubscribe();
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
        await logout();
        setUser(null);
        setNeedsProfileCompletion(false);
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
