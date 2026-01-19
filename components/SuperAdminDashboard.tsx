import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { getAllCompanies, updateCompany } from '../authService';
import { supabase } from '../supabaseClient';

interface CompanyStats {
    companyId: string;
    userCount: number;
    programCount: number;
    bookingCount: number;
}

interface SuperAdminDashboardProps {
    onBack: () => void;
    onManageCompany: (companyId: string) => void;
    onCreateCompany: () => void;
    onManageUsers: () => void;
    onLogout: () => void;
}

const SuperAdminDashboard: React.FC<SuperAdminDashboardProps> = ({ onBack, onManageCompany, onCreateCompany, onManageUsers, onLogout }) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [stats, setStats] = useState<CompanyStats[]>([]);
    const [totalStats, setTotalStats] = useState({ users: 0, programs: 0, bookings: 0 });
    const [loading, setLoading] = useState(true);

    const loadData = async () => {
        try {
            // Load companies
            const companiesData = await getAllCompanies();
            setCompanies(companiesData);

            // Load stats for each company
            const statsPromises = companiesData.map(async (company) => {
                const [usersRes, programsRes, bookingsRes] = await Promise.all([
                    supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
                    supabase.from('programs').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
                    supabase.from('bookings').select('id', { count: 'exact', head: true }).eq('company_id', company.id),
                ]);

                return {
                    companyId: company.id,
                    userCount: usersRes.count || 0,
                    programCount: programsRes.count || 0,
                    bookingCount: bookingsRes.count || 0,
                };
            });

            const statsData = await Promise.all(statsPromises);
            setStats(statsData);

            // Calculate totals
            const totals = statsData.reduce(
                (acc, s) => ({
                    users: acc.users + s.userCount,
                    programs: acc.programs + s.programCount,
                    bookings: acc.bookings + s.bookingCount,
                }),
                { users: 0, programs: 0, bookings: 0 }
            );
            setTotalStats(totals);
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadData();
    }, []);

    const getCompanyStats = (companyId: string): CompanyStats | undefined => {
        return stats.find(s => s.companyId === companyId);
    };

    const toggleCompanyStatus = async (company: Company) => {
        const success = await updateCompany(company.id, { ativo: !company.ativo });
        if (success) {
            setCompanies(prev =>
                prev.map(c => c.id === company.id ? { ...c, ativo: !c.ativo } : c)
            );
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="text-center">
                    <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-white mx-auto mb-4">
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    </div>
                    <p className="text-text-muted">Carregando dados...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark">
            {/* Header */}
            <header className="flex items-center gap-3 p-4 pt-6 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-40">
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-[#131616] dark:text-white">Super Admin</h1>
                    <p className="text-sm text-text-muted">Painel de Controle</p>
                </div>
                <button
                    onClick={onCreateCompany}
                    className="size-10 rounded-full bg-primary flex items-center justify-center text-white shadow-lg"
                >
                    <span className="material-symbols-outlined">add</span>
                </button>
                <button
                    onClick={onLogout}
                    className="size-10 rounded-full bg-red-500 flex items-center justify-center text-white shadow-lg"
                >
                    <span className="material-symbols-outlined">logout</span>
                </button>
            </header>

            {/* Global Stats */}
            <div className="px-5 py-4">
                <div className="grid grid-cols-4 gap-3">
                    <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10 text-center">
                        <span className="material-symbols-outlined text-primary mb-1">apartment</span>
                        <p className="text-xl font-bold text-[#131616] dark:text-white">{companies.length}</p>
                        <p className="text-[10px] text-text-muted">Empresas</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10 text-center">
                        <span className="material-symbols-outlined text-blue-500 mb-1">group</span>
                        <p className="text-xl font-bold text-[#131616] dark:text-white">{totalStats.users}</p>
                        <p className="text-[10px] text-text-muted">Usuários</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10 text-center">
                        <span className="material-symbols-outlined text-purple-500 mb-1">event</span>
                        <p className="text-xl font-bold text-[#131616] dark:text-white">{totalStats.programs}</p>
                        <p className="text-[10px] text-text-muted">Programas</p>
                    </div>
                    <div className="p-3 rounded-xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10 text-center">
                        <span className="material-symbols-outlined text-green-500 mb-1">calendar_month</span>
                        <p className="text-xl font-bold text-[#131616] dark:text-white">{totalStats.bookings}</p>
                        <p className="text-[10px] text-text-muted">Agendamentos</p>
                    </div>
                </div>
            </div>

            {/* Quick Actions */}
            <div className="px-5 pb-3">
                <button
                    onClick={onManageUsers}
                    className="w-full p-4 rounded-xl bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 flex items-center gap-3 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                >
                    <span className="material-symbols-outlined text-blue-500">group</span>
                    <div className="flex-1 text-left">
                        <p className="font-semibold text-blue-700 dark:text-blue-400">Gestão de Usuários</p>
                        <p className="text-xs text-blue-600/70 dark:text-blue-400/70">Gerenciar permissões e status</p>
                    </div>
                    <span className="material-symbols-outlined text-blue-400">chevron_right</span>
                </button>
            </div>

            {/* Companies List */}
            <div className="flex-1 overflow-auto px-5 pb-24">
                <h2 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                    Empresas ({companies.length})
                </h2>

                {companies.length === 0 ? (
                    <div className="text-center py-12">
                        <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">apartment</span>
                        <p className="text-text-muted mt-4">Nenhuma empresa cadastrada</p>
                        <button
                            onClick={onCreateCompany}
                            className="mt-4 px-6 py-2 rounded-xl bg-primary text-white font-medium"
                        >
                            Criar Primeira Empresa
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {companies.map(company => {
                            const companyStats = getCompanyStats(company.id);
                            return (
                                <div
                                    key={company.id}
                                    className={`p-4 rounded-2xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10 ${!company.ativo ? 'opacity-50' : ''}`}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="size-12 rounded-xl flex items-center justify-center text-white shrink-0"
                                            style={{ backgroundColor: company.corPrimaria }}
                                        >
                                            {company.logoUrl ? (
                                                <img src={company.logoUrl} alt="" className="size-8 object-contain" />
                                            ) : (
                                                <span className="material-symbols-outlined">apartment</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[#131616] dark:text-white truncate">{company.nome}</h3>
                                            <p className="text-sm text-text-muted">/{company.slug}</p>
                                        </div>
                                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${company.ativo ? 'bg-green-100 text-green-700 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400'}`}>
                                            {company.ativo ? 'Ativa' : 'Inativa'}
                                        </span>
                                    </div>

                                    {/* Company Stats */}
                                    {companyStats && (
                                        <div className="grid grid-cols-3 gap-2 mt-3">
                                            <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                                                <p className="text-sm font-bold text-[#131616] dark:text-white">{companyStats.userCount}</p>
                                                <p className="text-[10px] text-text-muted">Usuários</p>
                                            </div>
                                            <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                                                <p className="text-sm font-bold text-[#131616] dark:text-white">{companyStats.programCount}</p>
                                                <p className="text-[10px] text-text-muted">Programas</p>
                                            </div>
                                            <div className="text-center p-2 rounded-lg bg-gray-50 dark:bg-white/5">
                                                <p className="text-sm font-bold text-[#131616] dark:text-white">{companyStats.bookingCount}</p>
                                                <p className="text-[10px] text-text-muted">Agendamentos</p>
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={() => onManageCompany(company.id)}
                                            className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-200 font-medium text-sm hover:bg-gray-200 dark:hover:bg-white/20 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-[18px]">edit</span>
                                            Editar
                                        </button>
                                        <button
                                            onClick={() => toggleCompanyStatus(company)}
                                            className={`flex-1 py-2 rounded-xl font-medium text-sm transition-colors flex items-center justify-center gap-1 ${company.ativo
                                                ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-500/20'
                                                : 'bg-green-50 dark:bg-green-500/10 text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-500/20'
                                                }`}
                                        >
                                            <span className="material-symbols-outlined text-[18px]">
                                                {company.ativo ? 'block' : 'check_circle'}
                                            </span>
                                            {company.ativo ? 'Desativar' : 'Ativar'}
                                        </button>
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

export default SuperAdminDashboard;
