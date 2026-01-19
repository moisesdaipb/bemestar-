import React, { useState, useEffect } from 'react';
import { Screen, Company } from '../types';
import { useAuth } from '../AuthContext';
import { getCompanyByEmailDomain } from '../authService';

interface RegisterScreenProps {
    onNavigate: (screen: Screen) => void;
    selectedCompany?: Company | null;
    prefilledEmail?: string | null;
}

const RegisterScreen: React.FC<RegisterScreenProps> = ({ onNavigate, selectedCompany, prefilledEmail }) => {
    const { register } = useAuth();
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState(prefilledEmail || '');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);
    const [detectedCompany, setDetectedCompany] = useState<Company | null>(selectedCompany || null);
    const [isEmailLocked, setIsEmailLocked] = useState(!!prefilledEmail);

    // Detect company from email domain when email changes
    useEffect(() => {
        const detectCompany = async () => {
            if (prefilledEmail && !selectedCompany) {
                const company = await getCompanyByEmailDomain(prefilledEmail);
                if (company) {
                    setDetectedCompany(company);
                }
            }
        };
        detectCompany();
    }, [prefilledEmail, selectedCompany]);

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');

        if (!nome.trim() || !email.trim() || !senha.trim()) {
            setErro('Por favor, preencha todos os campos');
            return;
        }

        if (senha.length < 6) {
            setErro('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (senha !== confirmarSenha) {
            setErro('As senhas não conferem');
            return;
        }

        if (!email.includes('@')) {
            setErro('Por favor, informe um email válido');
            return;
        }

        const companyId = detectedCompany?.id || selectedCompany?.id;

        setLoading(true);
        try {
            const result = await register(nome, email, senha, companyId);
            if (!result.success) {
                setErro(result.error || 'Erro ao cadastrar');
            } else {
                onNavigate(Screen.HOME);
            }
        } catch (err) {
            setErro('Erro ao cadastrar usuário');
        } finally {
            setLoading(false);
        }
    };

    const displayCompany = detectedCompany || selectedCompany;

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/20 via-background-light to-blue-100 dark:from-primary/10 dark:via-background-dark dark:to-blue-900/20">
            {/* Header */}
            <div className="p-4 pt-6">
                <button
                    onClick={() => onNavigate(Screen.LOGIN)}
                    className="size-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
                <h1 className="text-2xl font-bold text-[#131616] dark:text-white mb-2">Criar Conta</h1>
                <p className="text-text-muted mb-4">Junte-se ao BemEstar+</p>

                {/* Selected Company Badge */}
                {displayCompany && (
                    <div className="w-full max-w-sm mb-4 p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                        <div
                            className="size-10 rounded-lg flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: displayCompany.corPrimaria }}
                        >
                            {displayCompany.logoUrl ? (
                                <img src={displayCompany.logoUrl} alt="" className="size-6 object-contain" />
                            ) : (
                                <span className="material-symbols-outlined text-lg">apartment</span>
                            )}
                        </div>
                        <div className="flex-1 min-w-0">
                            <p className="text-xs text-text-muted">Cadastrando em</p>
                            <p className="font-semibold text-[#131616] dark:text-white truncate">{displayCompany.nome}</p>
                        </div>
                    </div>
                )}

                {erro && (
                    <div className="w-full max-w-sm mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                        {erro}
                    </div>
                )}

                <form onSubmit={handleRegister} className="w-full max-w-sm space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#131616] dark:text-white mb-2">
                            Nome Completo
                        </label>
                        <input
                            type="text"
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            placeholder="Seu nome"
                            className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#131616] dark:text-white mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => !isEmailLocked && setEmail(e.target.value)}
                            placeholder="seu.email@empresa.com"
                            readOnly={isEmailLocked}
                            className={`w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none ${isEmailLocked ? 'bg-gray-100 dark:bg-white/10 cursor-not-allowed' : 'bg-white dark:bg-white/5'}`}
                        />
                        {isEmailLocked && (
                            <p className="text-xs text-text-muted mt-1 flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">lock</span>
                                Email verificado
                            </p>
                        )}
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#131616] dark:text-white mb-2">
                            Senha
                        </label>
                        <input
                            type="password"
                            value={senha}
                            onChange={e => setSenha(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#131616] dark:text-white mb-2">
                            Confirmar Senha
                        </label>
                        <input
                            type="password"
                            value={confirmarSenha}
                            onChange={e => setConfirmarSenha(e.target.value)}
                            placeholder="Digite a senha novamente"
                            className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-lg hover:opacity-90 transition-all disabled:opacity-50 mt-6"
                    >
                        {loading ? 'Cadastrando...' : 'Cadastrar'}
                    </button>
                </form>

                {/* Login Link */}
                <div className="mt-6 text-center">
                    <p className="text-text-muted">
                        Já tem conta?{' '}
                        <button
                            onClick={() => onNavigate(Screen.LOGIN)}
                            className="text-primary font-semibold hover:underline"
                        >
                            Entrar
                        </button>
                    </p>
                </div>

                {/* Info */}
                <div className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 max-w-sm">
                    <p className="text-xs text-center text-blue-700 dark:text-blue-400">
                        <span className="material-symbols-outlined text-[14px] align-middle mr-1">info</span>
                        Ao se cadastrar, você terá acesso às funcionalidades de colaborador.
                        Para acesso administrativo, entre em contato com o RH.
                    </p>
                </div>
            </div>
        </div>
    );
};

export default RegisterScreen;
