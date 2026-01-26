import React, { useState } from 'react';
import { Screen, Company } from '../types';
import { sendRegistrationLink } from '../authService';

interface EmailVerificationScreenProps {
    onNavigate: (screen: Screen) => void;
    onEmailVerified: (email: string, company: Company) => void;
}

const EmailVerificationScreen: React.FC<EmailVerificationScreenProps> = ({ onNavigate, onEmailVerified }) => {
    const [email, setEmail] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);
    const [sucesso, setSucesso] = useState(false);
    const [empresa, setEmpresa] = useState<Company | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');

        const cleanEmail = email.trim().toLowerCase();

        if (!cleanEmail) {
            setErro('Por favor, informe seu email corporativo');
            return;
        }

        if (!cleanEmail.includes('@')) {
            setErro('Por favor, informe um email válido');
            return;
        }

        setLoading(true);

        // Safety timeout - force loading to false after 15 seconds
        const timeoutId = setTimeout(() => {
            setLoading(false);
            setErro('A solicitação está demorando mais que o esperado. Por favor, verifique sua conexão ou tente novamente.');
        }, 60000);

        try {
            const result = await sendRegistrationLink(cleanEmail);

            // Clear timeout if request finishes
            clearTimeout(timeoutId);

            if (!result.success) {
                setErro(result.error || 'Erro ao enviar email');
            } else {
                setSucesso(true);
                setEmpresa(result.company || null);
            }
        } catch (err) {
            clearTimeout(timeoutId);
            setErro('Erro ao processar solicitação');
        } finally {
            setLoading(false);
        }
    };

    if (sucesso) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/20 via-background-light to-green-100 dark:from-primary/10 dark:via-background-dark dark:to-green-900/20">
                {/* Header */}
                <div className="p-4 pt-6">
                    <button
                        onClick={() => onNavigate(Screen.LOGIN)}
                        className="size-10 rounded-full flex items-center justify-center bg-white/80 dark:bg-white/10 hover:bg-white dark:hover:bg-white/20 transition-colors"
                    >
                        <span className="material-symbols-outlined">arrow_back</span>
                    </button>
                </div>

                {/* Success Content */}
                <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
                    <div className="size-20 rounded-full bg-green-500 flex items-center justify-center text-white mb-6">
                        <span className="material-symbols-outlined text-4xl">mark_email_read</span>
                    </div>

                    <h1 className="text-2xl font-bold text-[#131616] dark:text-white mb-2 text-center">
                        Email Enviado!
                    </h1>

                    <p className="text-text-muted text-center mb-6">
                        Enviamos um link para <strong className="text-[#131616] dark:text-white">{email}</strong>
                    </p>

                    {empresa && (
                        <div className="w-full max-w-sm mb-6 p-4 rounded-xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10">
                            <div className="flex items-center gap-3">
                                <div
                                    className="size-12 rounded-xl flex items-center justify-center text-white shrink-0"
                                    style={{ backgroundColor: empresa.corPrimaria }}
                                >
                                    {empresa.logoUrl ? (
                                        <img src={empresa.logoUrl} alt="" className="size-8 object-contain" />
                                    ) : (
                                        <span className="material-symbols-outlined">apartment</span>
                                    )}
                                </div>
                                <div>
                                    <p className="text-xs text-text-muted">Você será vinculado a</p>
                                    <p className="font-bold text-[#131616] dark:text-white">{empresa.nome}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    <div className="w-full max-w-sm p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                        <div className="flex items-start gap-3">
                            <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">info</span>
                            <div>
                                <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">
                                    Próximos passos
                                </p>
                                <ol className="text-xs text-blue-600 dark:text-blue-400/80 list-decimal list-inside space-y-1">
                                    <li>Acesse seu email corporativo</li>
                                    <li>Clique no link que enviamos</li>
                                    <li>Complete seu cadastro</li>
                                </ol>
                            </div>
                        </div>
                    </div>

                    <button
                        onClick={() => onNavigate(Screen.LOGIN)}
                        className="mt-8 text-primary font-semibold hover:underline"
                    >
                        Voltar para o login
                    </button>
                </div>
            </div>
        );
    }

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
                <div className="size-16 rounded-2xl bg-primary flex items-center justify-center text-white mb-4">
                    <span className="material-symbols-outlined text-3xl">mail</span>
                </div>

                <h1 className="text-2xl font-bold text-[#131616] dark:text-white mb-2">Criar Conta</h1>
                <p className="text-text-muted text-center mb-6">
                    Informe seu email corporativo para receber o link de cadastro
                </p>

                {erro && (
                    <div className="w-full max-w-sm mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                        {erro}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#131616] dark:text-white mb-2">
                            Email Corporativo
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="seu.nome@empresa.com.br"
                            className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            autoFocus
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Verificando...' : 'Enviar Link de Cadastro'}
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
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">info</span>
                        <div>
                            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">
                                Como funciona?
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400/80">
                                Usamos seu email corporativo para identificar automaticamente sua empresa.
                                Você receberá um link seguro para completar o cadastro.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EmailVerificationScreen;
