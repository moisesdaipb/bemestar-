import React, { useState } from 'react';
import { Screen } from '../types';
import { completeUserProfile } from '../authService';

interface CompleteProfileScreenProps {
    onComplete: () => void;
    userEmail?: string;
}

const CompleteProfileScreen: React.FC<CompleteProfileScreenProps> = ({ onComplete, userEmail }) => {
    const [nome, setNome] = useState('');
    const [senha, setSenha] = useState('');
    const [confirmarSenha, setConfirmarSenha] = useState('');
    const [erro, setErro] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');

        if (!nome.trim()) {
            setErro('Por favor, informe seu nome');
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

        setLoading(true);
        try {
            const result = await completeUserProfile(nome, senha);
            if (!result.success) {
                setErro(result.error || 'Erro ao completar cadastro');
            } else {
                onComplete();
            }
        } catch (err) {
            setErro('Erro ao processar solicitação');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/20 via-background-light to-green-100 dark:from-primary/10 dark:via-background-dark dark:to-green-900/20">
            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
                <div className="size-20 rounded-full bg-primary flex items-center justify-center text-white mb-6">
                    <span className="material-symbols-outlined text-4xl">person_add</span>
                </div>

                <h1 className="text-2xl font-bold text-[#131616] dark:text-white mb-2 text-center">
                    Complete seu Cadastro
                </h1>

                <p className="text-text-muted text-center mb-2">
                    Falta pouco! Defina seu nome e crie uma senha.
                </p>

                {userEmail && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-700 dark:text-green-400 text-sm mb-6">
                        <span className="material-symbols-outlined text-lg">verified</span>
                        <span>{userEmail}</span>
                    </div>
                )}

                {erro && (
                    <div className="w-full max-w-sm mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                        {erro}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="w-full max-w-sm space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-[#131616] dark:text-white mb-2">
                            Seu Nome
                        </label>
                        <input
                            type="text"
                            value={nome}
                            onChange={e => setNome(e.target.value)}
                            placeholder="Como gostaria de ser chamado?"
                            className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            autoFocus
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-[#131616] dark:text-white mb-2">
                            Criar Senha
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
                        {loading ? 'Finalizando...' : 'Finalizar Cadastro'}
                    </button>
                </form>

                {/* Info */}
                <div className="mt-8 p-4 rounded-xl bg-blue-500/10 border border-blue-500/20 max-w-sm">
                    <div className="flex items-start gap-3">
                        <span className="material-symbols-outlined text-blue-500 text-lg mt-0.5">info</span>
                        <p className="text-xs text-blue-600 dark:text-blue-400/80">
                            Sua senha será usada para acessar o app futuramente.
                            Escolha uma senha segura e fácil de lembrar.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default CompleteProfileScreen;
