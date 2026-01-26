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

// ==================== SESSION HELPERS ====================

// Clear all local session data to resolve corrupted states
export const clearLocalSession = () => {
    console.log('Action: nuclear session cleanup triggered');

    try {
        localStorage.clear();
        sessionStorage.clear();

        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key?.startsWith('sb-')) keysToRemove.push(key);
        }
        keysToRemove.forEach(k => localStorage.removeItem(k));

        try {
            supabase.auth.signOut({ scope: 'local' }).catch(() => { });
        } catch (e) { }

        setTimeout(() => {
            window.location.href = window.location.origin;
        }, 50);
    } catch (err) {
        console.error('Critical error in cleanup:', err);
        window.location.reload();
    }
};

// Generic timeout wrapper for promises
const withTimeout = <T>(promise: Promise<T>, timeoutMs: number, errorMessage: string): Promise<T> => {
    return Promise.race([
        promise,
        new Promise<T>((_, reject) =>
            setTimeout(() => reject(new Error(errorMessage)), timeoutMs)
        )
    ]);
};

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
        const cleanEmail = email.toLowerCase().trim();
        const domain = '@' + cleanEmail.split('@')[1];
        if (!domain || domain === '@' || domain === '@undefined') return null;

        const { data, error } = await supabase
            .from('companies')
            .select('*')
            .eq('ativo', true);

        if (error || !data) return null;

        const company = data.find((c: DbCompany) =>
            c.dominios_email?.some((d: string) => d.toLowerCase().trim() === domain)
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
        const company = await getCompanyByEmailDomain(email);

        if (!company) {
            return {
                success: false,
                error: 'Sua empresa não está cadastrada no sistema. Entre em contato com o RH.'
            };
        }

        const { data: emailExists } = await supabase
            .rpc('check_email_exists', { check_email: email.toLowerCase().trim() });

        if (emailExists) {
            return {
                success: false,
                error: 'Este email já está cadastrado. Use a opção de login ou "Esqueci minha senha".'
            };
        }

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
            return { success: false, error: `Erro ao enviar email: ${error.message}` };
        }

        return { success: true, company };
    } catch (err) {
        console.error('Send registration link exception:', err);
        return { success: false, error: 'Erro inesperado ao processar cadastro.' };
    }
};

// ==================== PASSWORD FUNCTIONS ====================

export const resetPasswordForEmail = async (email: string): Promise<{
    success: boolean;
    error?: string;
}> => {
    try {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}?reset_password=true`,
        });

        if (error) return { success: false, error: 'Erro ao enviar email de recuperação.' };
        return { success: true };
    } catch (err) {
        return { success: false, error: 'Erro ao processar solicitação.' };
    }
};

export const updateUserPassword = async (password: string): Promise<{
    success: boolean;
    error?: string;
}> => {
    try {
        const { error } = await supabase.auth.updateUser({ password });
        if (error) return { success: false, error: 'Erro ao definir senha.' };
        return { success: true };
    } catch (err) {
        return { success: false, error: 'Erro ao processar solicitação.' };
    }
};

export const completeUserProfile = async (nome: string, password: string): Promise<{
    success: boolean;
    error?: string;
}> => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return { success: false, error: 'Usuário não autenticado.' };

        await supabase.auth.updateUser({
            password: password,
            data: { full_name: nome }
        });

        await supabase
            .from('profiles')
            .update({ nome: nome })
            .eq('id', user.id);

        return { success: true };
    } catch (err) {
        return { success: false, error: 'Erro ao completar cadastro.' };
    }
};

export const checkNeedsProfileCompletion = async (existingUser?: any | null): Promise<boolean> => {
    try {
        let user = existingUser;
        if (!user) {
            const { data: { user: fetchedUser } } = await supabase.auth.getUser();
            user = fetchedUser;
        }
        if (!user) return false;

        const hasPasswordIdentity = user.identities?.some((identity: any) => identity.provider === 'email');
        const confirmedViaOtp = !!user.email_confirmed_at && !hasPasswordIdentity;

        const { data: profile } = await supabase
            .from('profiles')
            .select('nome')
            .eq('id', user.id)
            .single();

        const emailPrefix = user.email?.split('@')[0];
        const hasPlaceholderName = !profile?.nome ||
            profile.nome === 'Usuário' ||
            profile.nome.toLowerCase().trim() === emailPrefix?.toLowerCase().trim();

        return confirmedViaOtp || (hasPlaceholderName && confirmedViaOtp);
    } catch (err) {
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
        return null;
    }
};

// IMPROVED: Returns the updated company directly from RPC
export const updateCompany = async (id: string, updates: Partial<Omit<Company, 'id' | 'criadoEm'>>): Promise<Company | null> => {
    try {
        console.log('Action: updating company via secure RPC', id);

        // Wrap in 30s timeout for stability
        const { data, error } = await withTimeout(
            supabase.rpc('rpc_update_company', {
                target_id: id,
                new_nome: updates.nome,
                new_nome_banner: updates.nomeBanner,
                new_slug: updates.slug,
                new_logo_url: updates.logoUrl,
                new_banner_url: updates.bannerUrl,
                new_cor_primaria: updates.corPrimaria,
                new_cor_secundaria: updates.corSecundaria,
                new_dominios_email: updates.dominiosEmail,
                new_ativo: updates.ativo
            }),
            30000,
            'O servidor demorou para responder.'
        );

        if (error) {
            console.error('Supabase RPC update error:', error.message);
            return null;
        }

        // RPC returns SETOF companies (array)
        const updatedDbCompany = Array.isArray(data) ? data[0] : data;
        if (!updatedDbCompany) return null;

        console.log('Update successful, returned record:', updatedDbCompany.id);
        return dbToCompany(updatedDbCompany);
    } catch (err) {
        console.error('Update company RPC exception:', err);
        return null;
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

        if (!data.user) return { success: false, error: 'Erro ao criar usuário' };

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
        return { success: false, error: 'Erro ao registrar usuário' };
    }
};

export const login = async (
    email: string,
    senha: string
): Promise<{ success: boolean; error?: string; user?: AuthUser }> => {
    try {
        const { data, error } = await withTimeout(
            supabase.auth.signInWithPassword({
                email: email.toLowerCase().trim(),
                password: senha,
            }),
            20000,
            'Tempo esgotado ao conectar com o servidor.'
        );

        if (error) {
            if (error.message.includes('Invalid login credentials')) {
                return { success: false, error: 'Email ou senha incorretos' };
            }
            return { success: false, error: error.message };
        }

        if (!data.user) return { success: false, error: 'Erro ao fazer login' };

        const { data: profile } = await withTimeout(
            supabase
                .from('profiles')
                .select('*, companies(*)')
                .eq('id', data.user.id)
                .single() as any,
            15000,
            'Conectado, mas houve demora ao carregar seu perfil.'
        );

        if (profile?.role !== 'super_admin' && profile?.companies && !profile.companies.ativo) {
            await supabase.auth.signOut();
            return { success: false, error: 'Sua empresa está desativada.' };
        }

        if (profile?.ativo === false) {
            await supabase.auth.signOut();
            return { success: false, error: 'Seu acesso foi desativado.' };
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
    } catch (err: any) {
        return { success: false, error: err.message || 'Erro ao fazer login' };
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
        if (error) return { success: false, error: error.message };
        return { success: true };
    } catch (err) {
        return { success: false, error: 'Erro ao fazer login com Microsoft' };
    }
};

export const logout = async (): Promise<void> => {
    try {
        await supabase.auth.signOut();
    } catch (err) { }
};

export const getCurrentUser = async (existingSession?: any): Promise<AuthUser | null> => {
    try {
        let user = existingSession?.user;
        if (!user) {
            const { data: { user: fetchedUser } } = await supabase.auth.getUser();
            user = fetchedUser;
        }

        if (!user) return null;

        let { data: profile } = await supabase
            .from('profiles')
            .select('*, companies(*)')
            .eq('id', user.id)
            .single();

        if (!profile && user.email) {
            const company = await getCompanyByEmailDomain(user.email);
            if (!company) return null;

            const userName = user.user_metadata?.full_name || user.user_metadata?.name || user.email.split('@')[0] || 'Usuário';

            const { data: newProfile } = await supabase
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

            profile = newProfile;
        }

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

export const updateProfile = async (
    userId: string,
    updates: Partial<Pick<DbProfile, 'nome'>>
): Promise<boolean> => {
    try {
        const { error } = await supabase.from('profiles').update(updates).eq('id', userId);
        return !error;
    } catch (err) {
        return false;
    }
};

export const setUserRole = async (userId: string, role: UserRole): Promise<boolean> => {
    try {
        const { error } = await supabase.from('profiles').update({ role }).eq('id', userId);
        return !error;
    } catch (err) {
        return false;
    }
};

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
        return [];
    }
};

export const createUserForCompany = async (
    nome: string,
    email: string,
    senha: string,
    companyId: string,
    role: UserRole = 'user'
): Promise<{ success: boolean; error?: string }> => {
    try {
        const { data: currentSession } = await supabase.auth.getSession();
        const { error: signUpError } = await supabase.auth.signUp({
            email: email.toLowerCase().trim(),
            password: senha,
            options: { data: { nome: nome.trim(), company_id: companyId, role: role } },
        });

        if (signUpError) return { success: false, error: signUpError.message };
        await supabase.auth.signOut();

        if (currentSession?.session?.refresh_token) {
            await supabase.auth.setSession({
                access_token: currentSession.session.access_token,
                refresh_token: currentSession.session.refresh_token,
            });
        }
        return { success: true };
    } catch (err) {
        return { success: false, error: 'Erro ao criar usuário' };
    }
};
