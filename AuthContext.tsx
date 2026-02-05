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
    refreshUser: () => Promise<void>;
    updateUserCompany: (newCompany: Company) => void;
    markProfileComplete: () => void;
    clearPasswordRecovery: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [needsProfileCompletion, setNeedsProfileCompletion] = useState(false);
    const [isPasswordRecovery, setIsPasswordRecovery] = useState(false);

    const handleRefreshUser = async () => {
        try {
            console.log('Refreshing user data...');
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const currentUser = await getCurrentUser(session);
                setUser(currentUser);
            }
        } catch (error) {
            console.error('Error refreshing user data:', error);
        }
    };

    const handleUpdateUserCompany = (newCompany: Company) => {
        console.log('Updating local user company state...');
        setUser(prev => prev ? { ...prev, company: newCompany } : null);
    };

    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (isLoading) {
                console.warn('Auth initialization timed out, forcing loading to false');
                setIsLoading(false);
            }
        }, 8000);

        const initAuth = async () => {
            try {
                // Captura parâmetros iniciais antes que o Supabase limpe a URL
                const params = new URLSearchParams(window.location.search);
                const isRegisteringUrl = params.get('register') === 'true' || params.get('type') === 'signup';
                const isResetUrl = params.get('reset_password') === 'true' || window.location.hash.includes('type=recovery');

                if (isResetUrl) setIsPasswordRecovery(true);

                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    const currentUser = await getCurrentUser(session);
                    setUser(currentUser);
                    const needsCompletion = await checkNeedsProfileCompletion(session.user);
                    setNeedsProfileCompletion(needsCompletion || isRegisteringUrl);
                } else {
                    setUser(null);
                }
            } catch (error) {
                console.error('Error initializing auth:', error);
            } finally {
                setIsLoading(false);
                clearTimeout(timeoutId);
            }
        };

        initAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log('DEBUG: onAuthStateChange event:', event, 'User present:', !!session?.user);

            if (event === 'PASSWORD_RECOVERY') {
                setIsPasswordRecovery(true);
                if (session?.user) {
                    const currentUser = await getCurrentUser(session);
                    setUser(currentUser);
                }
                return;
            }

            if (event === 'INITIAL_SESSION' && session?.user) {
                console.log('DEBUG: Initial session detected');
                return;
            }

            if (event === 'SIGNED_IN' && session?.user) {
                console.log('DEBUG: User SIGNED_IN');
                const currentUser = await getCurrentUser(session);
                setUser(currentUser);

                const params = new URLSearchParams(window.location.search);
                const isRegistering = params.get('register') === 'true';

                const needsCompletion = await checkNeedsProfileCompletion(session.user);
                setNeedsProfileCompletion(needsCompletion || isRegistering);
            } else if (event === 'SIGNED_OUT') {
                console.log('DEBUG: User SIGNED_OUT');
                setUser(null);
                setNeedsProfileCompletion(false);
                setIsPasswordRecovery(false);
            } else if (event === 'TOKEN_REFRESHED' && session?.user) {
                console.log('DEBUG: Token refreshed');
                const currentUser = await getCurrentUser(session);
                setUser(currentUser);
            } else if (event === 'USER_UPDATED' && session?.user) {
                console.log('DEBUG: User updated');
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
        return { success: result.success, error: result.error };
    };

    const handleLogout = async () => {
        try {
            await logout();
        } catch (err) { }
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
                refreshUser: handleRefreshUser,
                updateUserCompany: handleUpdateUserCompany,
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
