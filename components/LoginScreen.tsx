import React, { useState } from 'react';
import { Screen } from '../types';
import { useAuth } from '../AuthContext';
import { resetPasswordForEmail } from '../authService';

interface LoginScreenProps {
    onNavigate: (screen: Screen) => void;
    onSelectCompany?: () => void;
}

const LoginScreen: React.FC<LoginScreenProps> = ({ onNavigate, onSelectCompany }) => {
    const { login, loginWithMicrosoft } = useAuth();
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);
    const [showForgotPassword, setShowForgotPassword] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [forgotLoading, setForgotLoading] = useState(false);
    const [forgotSuccess, setForgotSuccess] = useState(false);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');

        const cleanEmail = email.trim().toLowerCase();
        const cleanSenha = senha.trim();

        if (!cleanEmail || !cleanSenha) {
            setErro('Por favor, preencha todos os campos');
            return;
        }

        setLoading(true);

        // Safety timeout - force loading to false after 15 seconds
        const timeoutId = setTimeout(() => {
            setLoading(false);
            setErro('O login está demorando mais que o esperado. Por favor, verifique sua conexão ou tente novamente.');
        }, 15000);

        try {
            const result = await login(cleanEmail, cleanSenha);

            // Clear timeout if request finishes
            clearTimeout(timeoutId);

            if (!result.success) {
                setErro(result.error || 'Erro ao fazer login');
            } else {
                onNavigate(Screen.HOME);
            }
        } catch (err) {
            clearTimeout(timeoutId);
            setErro('Erro ao fazer login');
        } finally {
            setLoading(false);
        }
    };

    const handleMicrosoftLogin = async () => {
        setLoading(true);
        try {
            const result = await loginWithMicrosoft();
            if (!result.success) {
                setErro(result.error || 'Erro ao fazer login com Microsoft');
            }
            // OAuth redirects, so success will be handled on return
        } catch (err) {
            setErro('Erro ao fazer login com Microsoft');
        } finally {
            setLoading(false);
        }
    };

    const handleForgotPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        const cleanEmail = forgotEmail.trim().toLowerCase();
        if (!cleanEmail) {
            return;
        }

        setForgotLoading(true);
        try {
            const result = await resetPasswordForEmail(cleanEmail);
            if (result.success) {
                setForgotSuccess(true);
            } else {
                setErro(result.error || 'Erro ao enviar email');
            }
        } catch (err) {
            setErro('Erro ao processar solicitação');
        } finally {
            setForgotLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/20 via-background-light to-blue-100 dark:from-primary/10 dark:via-background-dark dark:to-blue-900/20">
            {/* Logo Area */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pt-12 pb-8">
                <div className="size-20 rounded-2xl bg-primary flex items-center justify-center text-white shadow-xl mb-4">
                    <span className="material-symbols-outlined text-4xl">spa</span>
                </div>
                <h1 className="text-3xl font-bold text-[#131616] dark:text-white">BemEstar+</h1>
                <p className="text-text-muted mt-2">Bem-estar corporativo</p>
            </div>

            {/* Login Form */}
            <div className="bg-white dark:bg-background-dark rounded-t-[2rem] px-6 py-8 shadow-2xl">
                <h2 className="text-xl font-bold text-[#131616] dark:text-white mb-6 text-center">
                    Entrar na sua conta
                </h2>

                {erro && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                        {erro}
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#131616] dark:text-white mb-2">
                            Email
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            placeholder="seu.email@empresa.com"
                            className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#131616] dark:text-white mb-2">
                            Senha
                        </label>
                        <input
                            type="password"
                            value={senha}
                            onChange={e => setSenha(e.target.value)}
                            placeholder="••••••••"
                            className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                        <button
                            type="button"
                            onClick={() => {
                                setForgotEmail(email);
                                setShowForgotPassword(true);
                                setForgotSuccess(false);
                            }}
                            className="mt-2 text-sm text-primary hover:underline"
                        >
                            Esqueci minha senha
                        </button>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Entrando...' : 'Entrar'}
                    </button>
                </form>

                {/* Info about corporate login */}
                <div className="mt-6 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">info</span>
                        <div>
                            <p className="text-sm font-semibold text-blue-700 dark:text-blue-400 mb-1">
                                Primeiro acesso?
                            </p>
                            <p className="text-xs text-blue-600 dark:text-blue-400/80">
                                Clique em "Criar conta" e use seu email corporativo para se cadastrar automaticamente.
                            </p>
                        </div>
                    </div>
                </div>

                {/* Create Account Button */}
                <button
                    onClick={() => onNavigate(Screen.EMAIL_VERIFY)}
                    className="w-full mt-4 py-3 rounded-xl border-2 border-primary text-primary font-bold text-lg hover:bg-primary/5 transition-all"
                >
                    Criar conta
                </button>


            </div>

            {/* Forgot Password Modal */}
            {showForgotPassword && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-6 z-50">
                    <div className="bg-white dark:bg-background-dark rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-lg font-bold text-[#131616] dark:text-white">
                                Recuperar Senha
                            </h3>
                            <button
                                onClick={() => setShowForgotPassword(false)}
                                className="size-8 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10"
                            >
                                <span className="material-symbols-outlined text-text-muted">close</span>
                            </button>
                        </div>

                        {forgotSuccess ? (
                            <div className="text-center py-4">
                                <div className="size-16 rounded-full bg-green-500 flex items-center justify-center text-white mx-auto mb-4">
                                    <span className="material-symbols-outlined text-3xl">mark_email_read</span>
                                </div>
                                <p className="text-[#131616] dark:text-white font-medium mb-2">
                                    Email enviado!
                                </p>
                                <p className="text-sm text-text-muted mb-4">
                                    Verifique sua caixa de entrada e clique no link para redefinir sua senha.
                                </p>
                                <button
                                    onClick={() => setShowForgotPassword(false)}
                                    className="w-full py-3 rounded-xl bg-primary text-white font-bold"
                                >
                                    Fechar
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleForgotPassword}>
                                <p className="text-sm text-text-muted mb-4">
                                    Informe seu email e enviaremos um link para redefinir sua senha.
                                </p>
                                <input
                                    type="email"
                                    value={forgotEmail}
                                    onChange={e => setForgotEmail(e.target.value)}
                                    placeholder="seu.email@empresa.com"
                                    className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none mb-4"
                                />
                                <div className="flex gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setShowForgotPassword(false)}
                                        className="flex-1 py-3 rounded-xl border border-card-border dark:border-white/10 font-medium text-[#131616] dark:text-white"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={forgotLoading}
                                        className="flex-1 py-3 rounded-xl bg-primary text-white font-bold disabled:opacity-50"
                                    >
                                        {forgotLoading ? 'Enviando...' : 'Enviar'}
                                    </button>
                                </div>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default LoginScreen;
