import React, { useState, useEffect } from 'react';
import { AuthUser, Company, UserRole } from '../types';
import { getUsersByCompany, setUserRole, getAllCompanies } from '../authService';
import { supabase } from '../supabaseClient';

interface UserManagementProps {
    onBack: () => void;
    onCreateUser?: () => void;
    companyId?: string | null; // Se null, mostra seleção de empresa (super_admin)
}

const UserManagement: React.FC<UserManagementProps> = ({ onBack, onCreateUser, companyId: initialCompanyId }) => {
    const [users, setUsers] = useState<AuthUser[]>([]);
    const [companies, setCompanies] = useState<Company[]>([]);
    const [selectedCompanyId, setSelectedCompanyId] = useState<string | null>(initialCompanyId || null);
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState<string | null>(null);

    useEffect(() => {
        loadCompanies();
    }, []);

    useEffect(() => {
        if (selectedCompanyId) {
            loadUsers(selectedCompanyId);
        }
    }, [selectedCompanyId]);

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

    const loadUsers = async (companyId: string) => {
        setLoading(true);
        try {
            const data = await getUsersByCompany(companyId);
            setUsers(data);
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId: string, newRole: UserRole) => {
        setUpdating(userId);
        try {
            const success = await setUserRole(userId, newRole);
            if (success) {
                setUsers(prev =>
                    prev.map(u => u.id === userId ? { ...u, role: newRole } : u)
                );
            }
        } catch (error) {
            console.error('Error updating role:', error);
            alert('Erro ao atualizar permissão');
        } finally {
            setUpdating(null);
        }
    };

    const handleToggleActive = async (userId: string, currentActive: boolean) => {
        setUpdating(userId);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ ativo: !currentActive })
                .eq('id', userId);

            if (!error) {
                setUsers(prev =>
                    prev.map(u => u.id === userId ? { ...u, ativo: !currentActive } as any : u)
                );
            }
        } catch (error) {
            console.error('Error toggling user status:', error);
            alert('Erro ao atualizar status');
        } finally {
            setUpdating(null);
        }
    };

    const getRoleBadgeColor = (role: UserRole) => {
        switch (role) {
            case 'super_admin':
                return 'bg-purple-100 text-purple-700 dark:bg-purple-500/20 dark:text-purple-400';
            case 'admin':
                return 'bg-blue-100 text-blue-700 dark:bg-blue-500/20 dark:text-blue-400';
            default:
                return 'bg-gray-100 text-gray-700 dark:bg-gray-500/20 dark:text-gray-400';
        }
    };

    const getRoleLabel = (role: UserRole) => {
        switch (role) {
            case 'super_admin': return 'Super Admin';
            case 'admin': return 'Admin';
            default: return 'Usuário';
        }
    };

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
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-[#131616] dark:text-white">Gestão de Usuários</h1>
                    <p className="text-sm text-text-muted">Gerenciar permissões e status</p>
                </div>
                {onCreateUser && (
                    <button
                        onClick={onCreateUser}
                        className="size-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg"
                    >
                        <span className="material-symbols-outlined">person_add</span>
                    </button>
                )}
            </header>

            {/* Company Selector */}
            {companies.length > 1 && (
                <div className="px-5 py-3">
                    <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                        Empresa
                    </label>
                    <select
                        value={selectedCompanyId || ''}
                        onChange={(e) => setSelectedCompanyId(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    >
                        {companies.map(company => (
                            <option key={company.id} value={company.id}>
                                {company.nome}
                            </option>
                        ))}
                    </select>
                </div>
            )}

            {/* Stats */}
            <div className="px-5 py-3">
                <div className="grid grid-cols-3 gap-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10 text-center">
                        <p className="text-2xl font-bold text-[#131616] dark:text-white">{users.length}</p>
                        <p className="text-xs text-text-muted">Total</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10 text-center">
                        <p className="text-2xl font-bold text-blue-500">{users.filter(u => u.role === 'admin').length}</p>
                        <p className="text-xs text-text-muted">Admins</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10 text-center">
                        <p className="text-2xl font-bold text-green-500">{users.filter(u => (u as any).ativo !== false).length}</p>
                        <p className="text-xs text-text-muted">Ativos</p>
                    </div>
                </div>
            </div>

            {/* Users List */}
            <div className="flex-1 overflow-auto px-5 pb-24">
                {loading ? (
                    <div className="flex items-center justify-center py-12">
                        <span className="material-symbols-outlined animate-spin text-primary">progress_activity</span>
                    </div>
                ) : users.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">group</span>
                        <p className="text-text-muted mt-4">Nenhum usuário encontrado</p>
                    </div>
                ) : (
                    <div className="space-y-3 mt-3">
                        {users.map(user => {
                            const isActive = (user as any).ativo !== false;
                            return (
                                <div
                                    key={user.id}
                                    className={`p-4 rounded-2xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10 ${!isActive ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="size-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <span className="material-symbols-outlined text-primary">person</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[#131616] dark:text-white truncate">{user.nome}</h3>
                                            <p className="text-sm text-text-muted truncate">{user.email}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getRoleBadgeColor(user.role)}`}>
                                            {getRoleLabel(user.role)}
                                        </span>
                                    </div>

                                    {/* Actions */}
                                    <div className="flex gap-2 mt-4">
                                        {user.role !== 'super_admin' && (
                                            <>
                                                <button
                                                    onClick={() => handleRoleChange(user.id, user.role === 'admin' ? 'user' : 'admin')}
                                                    disabled={updating === user.id}
                                                    className="flex-1 py-2 rounded-xl bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 font-medium text-sm hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors flex items-center justify-center gap-1 disabled:opacity-50"
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {user.role === 'admin' ? 'person' : 'admin_panel_settings'}
                                                    </span>
                                                    {user.role === 'admin' ? 'Rebaixar' : 'Promover'}
                                                </button>
                                                <button
                                                    onClick={() => handleToggleActive(user.id, isActive)}
                                                    disabled={updating === user.id}
                                                    className={`flex-1 py-2 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-1 disabled:opacity-50 ${isActive
                                                        ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20'
                                                        : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20'
                                                        }`}
                                                >
                                                    <span className="material-symbols-outlined text-[18px]">
                                                        {isActive ? 'block' : 'check_circle'}
                                                    </span>
                                                    {isActive ? 'Desativar' : 'Ativar'}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
};

export default UserManagement;
