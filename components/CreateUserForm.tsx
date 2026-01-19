import React, { useState, useEffect } from 'react';
import { Company, UserRole } from '../types';
import { getAllCompanies, createUserForCompany } from '../authService';

interface CreateUserFormProps {
    onBack: () => void;
    onSave: () => void;
    preselectedCompanyId?: string | null;
}

const CreateUserForm: React.FC<CreateUserFormProps> = ({ onBack, onSave, preselectedCompanyId }) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string>(preselectedCompanyId || '');
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [senha, setSenha] = useState('');
    const [role, setRole] = useState<UserRole>('admin');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [erro, setErro] = useState('');

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            const data = await getAllCompanies();
            setCompanies(data);
            if (data.length > 0 && !selectedCompanyId) {
                setSelectedCompanyId(data[0].id);
            }
        } catch (error) {
            console.error('Error loading companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setErro('');

        if (!nome.trim()) {
            setErro('Por favor, informe o nome');
            return;
        }
        if (!email.trim() || !email.includes('@')) {
            setErro('Por favor, informe um email válido');
            return;
        }
        if (senha.length < 6) {
            setErro('A senha deve ter pelo menos 6 caracteres');
            return;
        }
        if (!selectedCompanyId) {
            setErro('Por favor, selecione uma empresa');
            return;
        }

        setSaving(true);
        try {
            const result = await createUserForCompany(nome, email, senha, selectedCompanyId, role);
            if (result.success) {
                alert('Usuário criado com sucesso!');
                onSave();
            } else {
                setErro(result.error || 'Erro ao criar usuário');
            }
        } catch (error) {
            console.error('Error creating user:', error);
            setErro('Erro ao criar usuário');
        } finally {
            setSaving(false);
        }
    };

    const selectedCompany = companies.find(c => c.id === selectedCompanyId);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="text-center">
                    <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-white mx-auto mb-4">
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    </div>
                    <p className="text-text-muted">Carregando...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark">
            {/* Header */}
            <header className="flex items-center gap-3 p-4 pt-6 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-40">
                <button
                    onClick={onBack}
                    className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <h1 className="text-xl font-bold text-[#131616] dark:text-white flex-1">
                    Criar Usuário
                </h1>
            </header>

            {/* Form */}
            <div className="flex-1 overflow-auto px-5 pb-8">
                <form onSubmit={handleSubmit} className="space-y-5 mt-4">
                    {/* Company Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                            Empresa *
                        </label>
                        <select
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        >
                            <option value="">Selecione uma empresa</option>
                            {companies.map(company => (
                                <option key={company.id} value={company.id}>
                                    {company.nome}
                                </option>
                            ))}
                        </select>
                    </div>

                    {/* Selected Company Preview */}
                    {selectedCompany && (
                        <div className="p-3 rounded-xl bg-primary/10 border border-primary/20 flex items-center gap-3">
                            <div
                                className="size-10 rounded-lg flex items-center justify-center text-white shrink-0"
                                style={{ backgroundColor: selectedCompany.corPrimaria }}
                            >
                                <span className="material-symbols-outlined text-lg">apartment</span>
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-[#131616] dark:text-white truncate">{selectedCompany.nome}</p>
                                <p className="text-xs text-text-muted">/{selectedCompany.slug}</p>
                            </div>
                        </div>
                    )}

                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                            Permissão *
                        </label>
                        <div className="grid grid-cols-2 gap-3">
                            <button
                                type="button"
                                onClick={() => setRole('admin')}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${role === 'admin'
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-500/10'
                                    : 'border-card-border dark:border-white/10 bg-white dark:bg-white/5'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-2xl ${role === 'admin' ? 'text-blue-500' : 'text-text-muted'}`}>
                                    admin_panel_settings
                                </span>
                                <p className={`font-semibold mt-2 ${role === 'admin' ? 'text-blue-700 dark:text-blue-400' : 'text-[#131616] dark:text-white'}`}>
                                    Admin
                                </p>
                                <p className="text-xs text-text-muted mt-1">
                                    Gerencia programas e agendamentos
                                </p>
                            </button>
                            <button
                                type="button"
                                onClick={() => setRole('user')}
                                className={`p-4 rounded-xl border-2 transition-all text-left ${role === 'user'
                                    ? 'border-green-500 bg-green-50 dark:bg-green-500/10'
                                    : 'border-card-border dark:border-white/10 bg-white dark:bg-white/5'
                                    }`}
                            >
                                <span className={`material-symbols-outlined text-2xl ${role === 'user' ? 'text-green-500' : 'text-text-muted'}`}>
                                    person
                                </span>
                                <p className={`font-semibold mt-2 ${role === 'user' ? 'text-green-700 dark:text-green-400' : 'text-[#131616] dark:text-white'}`}>
                                    Usuário
                                </p>
                                <p className="text-xs text-text-muted mt-1">
                                    Faz agendamentos
                                </p>
                            </button>
                        </div>
                    </div>

                    {/* Name */}
                    <div>
                        <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                            Nome Completo *
                        </label>
                        <input
                            type="text"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            placeholder="Ex: João Silva"
                            className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                            Email *
                        </label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="usuario@empresa.com"
                            className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                            Senha *
                        </label>
                        <input
                            type="password"
                            value={senha}
                            onChange={(e) => setSenha(e.target.value)}
                            placeholder="Mínimo 6 caracteres"
                            className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                        <p className="text-xs text-text-muted mt-1">
                            O usuário poderá alterar a senha depois
                        </p>
                    </div>

                    {/* Error */}
                    {erro && (
                        <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm text-center">
                            {erro}
                        </div>
                    )}

                    {/* Submit */}
                    <button
                        type="submit"
                        disabled={saving}
                        className="w-full py-4 rounded-xl bg-primary text-white font-bold text-lg shadow-lg hover:opacity-90 transition-all disabled:opacity-50"
                    >
                        {saving ? 'Criando...' : 'Criar Usuário'}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default CreateUserForm;
