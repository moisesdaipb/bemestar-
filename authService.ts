import { supabase, DbProfile, DbCompany } from './supabaseClient';
import { AuthUser, UserRole, Company } from './types';

// Helper to convert DbCompany to Company
const dbToCompany = (db: DbCompany): Company => ({
    id: db.id,
    nome: db.nome,
    nomeBanner: db.nome_banner,
    slug: db.slug,
    logoUrl: db.logo_url,
    bannerUrl: db.banner_url,
    corPrimaria: db.cor_primaria,
    corSecundaria: db.cor_secundaria || '#0d9488',
    dominiosEmail: db.dominios_email || [],
    ativo: db.ativo,
    criadoEm: db.criado_em,
});

// ==================== COMPANY FUNCTIONS ====================

export const getCompanyBySlug = async (slug: string): Promise<Company | null> => {
    try {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('slug', slug.toLowerCase().trim())
            .eq('ativo', true)
            .single();

        if (error || !data) return null;
        return dbToCompany(data);
    } catch (err) {
        console.error('Get company by slug error:', err);
        return null;
    }
};

export const getAllCompanies = async (): Promise<Company[]> => {
    try {
        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .order('nome');

        if (error || !data) return [];
        return data.map(dbToCompany);
    } catch (err) {
        console.error('Get all companies error:', err);
        return [];
    }
};

// Find company by email domain
export const getCompanyByEmailDomain = async (email: string): Promise<Company | null> => {
    try {
        const domain = '@' + email.split('@')[1]?.toLowerCase();
        if (!domain || domain === '@undefined') return null;

        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('ativo', true);

        if (error || !data) return null;

        // Find company that has this domain in their dominios_email array
        const company = data.find((c: DbCompany) =>
            c.dominios_email?.some((d: string) => d.toLowerCase() === domain)
        );

        return company ? dbToCompany(company) : null;
    } catch (err) {
        console.error('Get company by email domain error:', err);
        return null;
    }
};

// Send registration link via magic link
export const sendRegistrationLink = async (email: string): Promise<{
    success: boolean;
    error?: string;
    company?: Company;
}> => {
    try {
        // First, check if domain is registered to a company
        const company = await getCompanyByEmailDomain(email);

        if (!company) {
            return {
                success: false,
                error: 'Sua empresa não está cadastrada no sistema. Entre em contato com o RH.'
            };
        }

        // Check if user already exists (using RPC to bypass RLS)
        const { data: emailExists, error: checkError } = await supabase
            .rpc('check_email_exists', { check_email: email.toLowerCase().trim() });

        if (checkError) {
            console.error('Check email exists error:', checkError);
            // Continue anyway, the error might be temporary
        } else if (emailExists) {
            return {
                success: false,
                error: 'Este email já está cadastrado. Use a opção de login ou "Esqueci minha senha".'
            };
        }

        // Send magic link for signup
        const { error } = await supabase.auth.signInWithOtp({
            email: email.toLowerCase().trim(),
            options: {
                emailRedirectTo: `${window.location.origin}?register=true&email=${encodeURIComponent(email)}&companyId=${company.id}`,
                data: {
                    company_id: company.id,
                    company_name: company.nome,
                }
            }
        });

        if (error) {
            console.error('Send registration link error:', error);
            return { success: false, error: 'Erro ao enviar email. Tente novamente.' };
        }

        return { success: true, company };
    } catch (err) {
        console.error('Send registration link error:', err);
        return { success: false, error: 'Erro ao enviar email de cadastro.' };
    }
};

// ==================== PASSWORD FUNCTIONS ====================

// Reset password - send email with reset link
export const resetPasswordForEmail = async (email: string): Promise<{
    success: boolean;
    error?: string;
}> => {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}?reset_password=true`,
        });

        if (error) {
            console.error('Reset password error:', error);
            return { success: false, error: 'Erro ao enviar email de recuperação.' };
        }

        return { success: true };
    } catch (err) {
        console.error('Reset password error:', err);
        return { success: false, error: 'Erro ao processar solicitação.' };
    }
};

// Update user password (used after magic link login or password reset)
export const updateUserPassword = async (password: string): Promise<{
    success: boolean;
    error?: string;
}> => {
    try {
        const { error } = await supabase.auth.updateUser({
            password: password
        });

        if (error) {
            console.error('Update password error:', error);
            return { success: false, error: 'Erro ao definir senha.' };
        }

        return { success: true };
    } catch (err) {
        console.error('Update password error:', err);
        return { success: false, error: 'Erro ao processar solicitação.' };
    }
};

// Complete user profile (name + password) for new magic link users
export const completeUserProfile = async (nome: string, password: string): Promise<{
    success: boolean;
    error?: string;
}> => {
    try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            return { success: false, error: 'Usuário não autenticado.' };
        }

        // Update auth user with password and name
        const { error: authError } = await supabase.auth.updateUser({
            password: password,
            data: { full_name: nome }
        });

        if (authError) {
            console.error('Update auth user error:', authError);
            return { success: false, error: 'Erro ao definir senha.' };
        }

        // Update profile name
        const { error: profileError } = await supabase
            .from('profiles')
            .update({ nome: nome })
            .eq('id', user.id);

        if (profileError) {
            console.error('Update profile error:', profileError);
            // Non-fatal, password was set
        }

        return { success: true };
    } catch (err) {
        console.error('Complete profile error:', err);
        return { success: false, error: 'Erro ao completar cadastro.' };
    }
};

// Check if user needs to complete profile (new magic link user without password)
export const checkNeedsProfileCompletion = async (existingUser?: { id: string; email?: string; email_confirmed_at?: string | null; identities?: Array<{ provider: string }> } | null): Promise<boolean> => {
    try {
        // Use existing user if provided, otherwise fetch from Supabase
        let user;
        if (existingUser) {
            user = existingUser;
        } else {
            const { data: { user: fetchedUser } } = await supabase.auth.getUser();
            user = fetchedUser;
        }
        if (!user) return false;

        // Check if user came from magic link (has confirmation but no password set)
        // Supabase sets confirmed_at when email is confirmed
        // Users who signed up via magic link and haven't set password will have 
        // email_confirmed_at set but no password in identities

        const hasPasswordIdentity = user.identities?.some(
            identity => identity.provider === 'email'
        );

        // If user confirmed email but doesn't have a traditional email identity,
        // they came from magic link and need to set password
        const confirmedViaOtp = user.email_confirmed_at && !hasPasswordIdentity;

        // Also check if user's profile has a name
        const { data: profile } = await supabase
            .from('profiles')
            .select('nome')
            .eq('id', user.id)
            .single();

        // Needs completion if: came from magic link OR profile name is empty/generic
        const needsName = !profile?.nome || profile.nome === 'Usuário' || profile.nome === user.email?.split('@')[0];

        return confirmedViaOtp || needsName;
    } catch (err) {
        console.error('Check profile completion error:', err);
        return false;
    }
};

export const createCompany = async (company: Omit<Company, 'id' | 'criadoEm'>): Promise<Company | null> => {
    try {
        const { data, error } = await supabase
            .from('companies')
            .insert({
                nome: company.nome,
                nome_banner: company.nomeBanner,
                slug: company.slug.toLowerCase().trim(),
                logo_url: company.logoUrl,
                banner_url: company.bannerUrl,
                cor_primaria: company.corPrimaria,
                cor_secundaria: company.corSecundaria || '#0d9488',
                dominios_email: company.dominiosEmail || [],
                ativo: company.ativo,
            })
            .select()
            .single();

        if (error || !data) return null;
        return dbToCompany(data);
    } catch (err) {
        console.error('Create company error:', err);
        return null;
    }
};

export const updateCompany = async (id: string, updates: Partial<Omit<Company, 'id' | 'criadoEm'>>): Promise<boolean> => {
    try {
        const dbUpdates: Partial<DbCompany> = {};
        if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
        if (updates.nomeBanner !== undefined) dbUpdates.nome_banner = updates.nomeBanner;
        if (updates.slug !== undefined) dbUpdates.slug = updates.slug.toLowerCase().trim();
        if (updates.logoUrl !== undefined) dbUpdates.logo_url = updates.logoUrl;
        if (updates.bannerUrl !== undefined) dbUpdates.banner_url = updates.bannerUrl;
        if (updates.corPrimaria !== undefined) dbUpdates.cor_primaria = updates.corPrimaria;
        if (updates.corSecundaria !== undefined) dbUpdates.cor_secundaria = updates.corSecundaria;
        if (updates.dominiosEmail !== undefined) dbUpdates.dominios_email = updates.dominiosEmail;
        if (updates.ativo !== undefined) dbUpdates.ativo = updates.ativo;

        const { error } = await supabase
            .from('companies')
            .update(dbUpdates)
            .eq('id', id);

        return !error;
    } catch (err) {
        console.error('Update company error:', err);
        return false;
    }
};

// ==================== AUTH FUNCTIONS ====================

export const register = async (
    nome: string,
    email: string,
    senha: string,
    companyId?: string
): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    try {
        const { data, error } = await supabase.auth.signUp({
            email: email.toLowerCase().trim(),
            password: senha,
            options: {
                data: {
                    nome: nome.trim(),
                    company_id: companyId || null,
                },
            },
        });

        if (error) {
            if (error.message.includes('already registered')) {
                return { success: false, error: 'Este email já está cadastrado' };
            }
            return { success: false, error: error.message };
        }

        if (!data.user) {
            return { success: false, error: 'Erro ao criar usuário' };
        }

        // Get the profile that was auto-created by the trigger
        const { data: profile } = await supabase
            .from('profiles')
            .select('*, companies(*)')
            .eq('id', data.user.id)
            .single();

        const authUser: AuthUser = {
            id: data.user.id,
            nome: profile?.nome || nome.trim(),
            email: data.user.email || email,
            role: (profile?.role as UserRole) || 'user',
            companyId: profile?.company_id || null,
            company: profile?.companies ? dbToCompany(profile.companies) : null,
        };

        return { success: true, user: authUser };
    } catch (err) {
        console.error('Register error:', err);
        return { success: false, error: 'Erro ao registrar usuário' };
    }
};

export const login = async (
    email: string,
    senha: string
): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    try {
        const { data, error } = await supabase.auth.signInWithPassword({
            email: email.toLowerCase().trim(),
            password: senha,
        });

        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                return { success: false, error: 'Email ou senha incorretos' };
            }
            return { success: false, error: error.message };
        }

        if (!data.user) {
            return { success: false, error: 'Erro ao fazer login' };
        }

        // Get user profile with company
        const { data: profile } = await supabase
            .from('profiles')
            .select('*, companies(*)')
            .eq('id', data.user.id)
            .single();

        // Check if user's company is active (only for non-super_admin)
        if (profile?.role !== 'super_admin' && profile?.companies && !profile.companies.ativo) {
            await supabase.auth.signOut();
            return { success: false, error: 'Sua empresa está desativada. Entre em contato com o suporte.' };
        }

        // Check if user profile is active
        if (profile?.ativo === false) {
            await supabase.auth.signOut();
            return { success: false, error: 'Seu acesso foi desativado. Entre em contato com o administrador.' };
        }

        const authUser: AuthUser = {
            id: data.user.id,
            nome: profile?.nome || data.user.email?.split('@')[0] || 'Usuário',
            email: data.user.email || email,
            role: (profile?.role as UserRole) || 'user',
            companyId: profile?.company_id || null,
            company: profile?.companies ? dbToCompany(profile.companies) : null,
        };

        return { success: true, user: authUser };
    } catch (err) {
        console.error('Login error:', err);
        return { success: false, error: 'Erro ao fazer login' };
    }
};

export const loginWithMicrosoft = async (): Promise<{
    success: boolean;
    error?: string;
    user?: AuthUser;
}> => {
    try {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'azure',
            options: {
                scopes: 'email profile',
                redirectTo: window.location.origin,
            },
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Microsoft login error:', err);
        return { success: false, error: 'Erro ao fazer login com Microsoft' };
    }
};

export const logout = async (): Promise<void> => {
    try {
        const { error } = await supabase.auth.signOut();
        if (error) {
            console.error('Logout error:', error);
        }
    } catch (err) {
        console.error('Logout exception:', err);
    }
};

export const getCurrentUser = async (existingSession?: { user: { id: string; email?: string; user_metadata?: Record<string, unknown>; email_confirmed_at?: string; identities?: Array<{ provider: string }> } } | null): Promise<AuthUser | null> => {
    try {
        // Use existing session user if provided, otherwise fetch from Supabase
        let user;
        if (existingSession?.user) {
            user = existingSession.user;
        } else {
            const { data: { user: fetchedUser } } = await supabase.auth.getUser();
            user = fetchedUser;
        }

        if (!user) return null;

        // Get user profile with company
        let { data: profile } = await supabase
            .from('profiles')
            .select('*, companies(*)')
            .eq('id', user.id)
            .single();

        // If no profile exists (new OAuth user), create one
        if (!profile && user.email) {
            // Find company by email domain
            const company = await getCompanyByEmailDomain(user.email);

            if (!company) {
                // User's email domain is not registered to any company
                // Sign them out and return null
                console.error('Email domain not registered to any company:', user.email);
                await supabase.auth.signOut();
                return null;
            }

            // Create profile for this user
            const userName = user.user_metadata?.full_name ||
                user.user_metadata?.name ||
                user.email.split('@')[0] ||
                'Usuário';

            const { data: newProfile, error: createError } = await supabase
                .from('profiles')
                .insert({
                    id: user.id,
                    nome: userName,
                    email: user.email,
                    role: 'user',
                    company_id: company.id,
                })
                .select('*, companies(*)')
                .single();

            if (createError) {
                console.error('Error creating profile:', createError);
                return null;
            }

            profile = newProfile;
        }

        // If still no profile (shouldn't happen), return null
        if (!profile) return null;

        return {
            id: user.id,
            nome: profile.nome || user.email?.split('@')[0] || 'Usuário',
            email: user.email || '',
            role: (profile.role as UserRole) || 'user',
            companyId: profile.company_id || null,
            company: profile.companies ? dbToCompany(profile.companies) : null,
        };
    } catch (err) {
        console.error('Get current user error:', err);
        return null;
    }
};

export const isLoggedIn = async (): Promise<boolean> => {
    const { data: { session } } = await supabase.auth.getSession();
    return session !== null;
};

export const isAdmin = async (): Promise<boolean> => {
    const user = await getCurrentUser();
    return user?.role === 'admin' || user?.role === 'super_admin';
};

export const isSuperAdmin = async (): Promise<boolean> => {
    const user = await getCurrentUser();
    return user?.role === 'super_admin';
};

// Function to update user profile
export const updateProfile = async (
    userId: string,
    updates: Partial<Pick<DbProfile, 'nome'>>
): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update(updates)
            .eq('id', userId);

        return !error;
    } catch (err) {
        console.error('Update profile error:', err);
        return false;
    }
};

// Function to set user role (admin only)
export const setUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
    try {
        const { error } = await supabase
            .from('profiles')
            .update({ role })
            .eq('id', userId);

        return !error;
    } catch (err) {
        console.error('Set role error:', err);
        return false;
    }
};

// Function to get users by company (for admin management)
export const getUsersByCompany = async (companyId: string): Promise<AuthUser[]> => {
    try {
        const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('company_id', companyId)
            .order('nome');

        if (error || !data) return [];

        return data.map(p => ({
            id: p.id,
            nome: p.nome,
            email: p.email,
            role: p.role as UserRole,
            companyId: p.company_id,
        }));
    } catch (err) {
        console.error('Get users by company error:', err);
        return [];
    }
};

// Function to create user for a company (super_admin or admin)
// NOTE: This uses signUp which may trigger email confirmation depending on Supabase settings
// The current super admin session is preserved by re-authenticating after creation
export const createUserForCompany = async (
    nome: string,
    email: string,
    senha: string,
    companyId: string,
    role: UserRole = 'user'
): Promise<{ success: boolean; error?: string }> => {
    try {
        // Store current session to restore later
        const { data: currentSession } = await supabase.auth.getSession();

        // Create user with signUp - this will create auth user and trigger the handle_new_user function
        const { error: signUpError } = await supabase.auth.signUp({
            email: email.toLowerCase().trim(),
            password: senha,
            options: {
                data: {
                    nome: nome.trim(),
                    company_id: companyId,
                    role: role,
                },
            },
        });

        if (signUpError) {
            if (signUpError.message.includes('already registered')) {
                return { success: false, error: 'Este email já está cadastrado' };
            }
            return { success: false, error: signUpError.message };
        }

        // Sign out the newly created user and restore the super admin session
        await supabase.auth.signOut();

        // Restore original session if it existed
        if (currentSession?.session?.refresh_token) {
            await supabase.auth.setSession({
                access_token: currentSession.session.access_token,
                refresh_token: currentSession.session.refresh_token,
            });
        }

        return { success: true };
    } catch (err) {
        console.error('Create user for company error:', err);
        return { success: false, error: 'Erro ao criar usuário' };
    }
};
