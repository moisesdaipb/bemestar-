import React, { useState } from 'react';
import { Screen } from '../types';
import { updateUserPassword } from '../authService';

interface ResetPasswordScreenProps {
    onComplete: () => void;
    onCancel: () => void;
}

const ResetPasswordScreen: React.FC<ResetPasswordScreenProps> = ({ onComplete, onCancel }) => {
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');

        if (senha.length < 6) {
            setErro('A senha deve ter pelo menos 6 caracteres');
            return;
        }

        if (senha !== confirmarSenha) {
            setErro('As senhas não conferem');
            return;
        }

        setLoading(true);
        try {
            const result = await updateUserPassword(senha);
            if (!result.success) {
                setErro(result.error || 'Erro ao redefinir senha');
            } else {
                setSuccess(true);
                // Redirect after showing success
                setTimeout(() => {
                    onComplete();
                }, 2000);
            }
        } catch (err) {
            setErro('Erro ao processar solicitação');
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="min-h-screen flex flex-col bg-gradient-to-br from-green-500/20 via-background-light to-green-100 dark:from-green-500/10 dark:via-background-dark dark:to-green-900/20">
                <div className="flex-1 flex flex-col items-center justify-center px-6">
                    <div className="size-24 rounded-full bg-green-500 flex items-center justify-center text-white mb-6 shadow-xl">
                        <span className="material-symbols-outlined text-5xl">check_circle</span>
                    </div>
                    <h1 className="text-2xl font-bold text-[#131616] dark:text-white mb-2 text-center">
                        Senha Redefinida!
                    </h1>
                    <p className="text-text-muted text-center">
                        Sua senha foi atualizada com sucesso.
                    </p>
                    <p className="text-text-muted text-center text-sm mt-2">
                        Redirecionando...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/20 via-background-light to-orange-100 dark:from-primary/10 dark:via-background-dark dark:to-orange-900/20">
            {/* Header */}
            <div className="flex items-center gap-3 p-4">
                <button
                    onClick={onCancel}
                    className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/10"
                >
                    <span className="material-symbols-outlined text-[#131616] dark:text-white">close</span>
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
                <div className="size-20 rounded-full bg-primary flex items-center justify-center text-white mb-6">
                    <span className="material-symbols-outlined text-4xl">lock_reset</span>
                </div>

                <h1 className="text-2xl font-bold text-[#131616] dark:text-white mb-2 text-center">
                    Redefinir Senha
                </h1>

                <p className="text-text-muted text-center mb-6">
                    Digite sua nova senha abaixo.
                </p>

                {erro && (
                    <div className="w-full max-w-sm mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                        {erro}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#131616] dark:text-white mb-2">
                            Nova Senha
                        </label>
                        <input
                            type="password"
                            value={senha}
                            onChange={e => setSenha(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#131616] dark:text-white mb-2">
                            Confirmar Nova Senha
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
                        {loading ? 'Salvando...' : 'Salvar Nova Senha'}
                    </button>
                </form>

                {/* Info */}
                <div className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 max-w-sm">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">info</span>
                        <p className="text-xs text-blue-600 dark:text-blue-400/80">
                            Escolha uma senha segura com pelo menos 6 caracteres.
                            Evite usar informações pessoais como nome ou data de nascimento.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ResetPasswordScreen;
