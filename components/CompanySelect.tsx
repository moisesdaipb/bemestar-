import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { getAllCompanies, getCompanyBySlug } from '../authService';

interface CompanySelectProps {
    onSelectCompany: (company: Company) => void;
    onBack: () => void;
}

const CompanySelect: React.FC<CompanySelectProps> = ({ onSelectCompany, onBack }) => {
    const [companies, setCompanies] = useState<Company[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchMode, setSearchMode] = useState<'list' | 'slug'>('list');
    const [slugInput, setSlugInput] = useState('');
    const [slugError, setSlugError] = useState('');
    const [searching, setSearching] = useState(false);

    useEffect(() => {
        loadCompanies();
    }, []);

    const loadCompanies = async () => {
        try {
            const data = await getAllCompanies();
            // Filtrar apenas empresas ativas
            setCompanies(data.filter(c => c.ativo));
        } catch (error) {
            console.error('Error loading companies:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSlugSearch = async () => {
        if (!slugInput.trim()) {
            setSlugError('Digite o código da empresa');
            return;
        }

        setSearching(true);
        setSlugError('');

        try {
            const company = await getCompanyBySlug(slugInput.trim());
            if (company) {
                onSelectCompany(company);
            } else {
                setSlugError('Empresa não encontrada ou inativa');
            }
        } catch (error) {
            console.error('Error searching company:', error);
            setSlugError('Erro ao buscar empresa');
        } finally {
            setSearching(false);
        }
    };

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="text-center">
                    <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-white mx-auto mb-4">
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    </div>
                    <p className="text-text-muted">Carregando empresas...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark">
            {/* Header */}
            <header className="flex items-center gap-3 p-4 pt-6">
                <button
                    onClick={onBack}
                    className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-[#131616] dark:text-white">Selecionar Empresa</h1>
                    <p className="text-sm text-text-muted">Escolha sua empresa para continuar</p>
                </div>
            </header>

            {/* Toggle Mode */}
            <div className="px-5 py-3">
                <div className="flex rounded-xl bg-gray-100 dark:bg-white/10 p-1">
                    <button
                        onClick={() => setSearchMode('list')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${searchMode === 'list'
                            ? 'bg-white dark:bg-white/20 text-[#131616] dark:text-white shadow-sm'
                            : 'text-text-muted'
                            }`}
                    >
                        Lista de Empresas
                    </button>
                    <button
                        onClick={() => setSearchMode('slug')}
                        className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${searchMode === 'slug'
                            ? 'bg-white dark:bg-white/20 text-[#131616] dark:text-white shadow-sm'
                            : 'text-text-muted'
                            }`}
                    >
                        Código da Empresa
                    </button>
                </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto px-5 pb-8">
                {searchMode === 'slug' ? (
                    <div className="mt-4">
                        <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                            Código da Empresa
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="text"
                                value={slugInput}
                                onChange={(e) => {
                                    setSlugInput(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
                                    setSlugError('');
                                }}
                                onKeyDown={(e) => e.key === 'Enter' && handleSlugSearch()}
                                placeholder="Ex: petrobras"
                                className="flex-1 px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            <button
                                onClick={handleSlugSearch}
                                disabled={searching}
                                className="px-6 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                            >
                                {searching ? (
                                    <span className="material-symbols-outlined animate-spin">progress_activity</span>
                                ) : (
                                    'Buscar'
                                )}
                            </button>
                        </div>
                        {slugError && (
                            <p className="text-red-500 text-sm mt-2">{slugError}</p>
                        )}
                        <p className="text-xs text-text-muted mt-3">
                            Digite o código fornecido pela sua empresa para acessar.
                        </p>
                    </div>
                ) : (
                    <>
                        {companies.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">apartment</span>
                                <p className="text-text-muted mt-4">Nenhuma empresa disponível</p>
                            </div>
                        ) : (
                            <div className="space-y-3 mt-4">
                                {companies.map(company => (
                                    <button
                                        key={company.id}
                                        onClick={() => onSelectCompany(company)}
                                        className="w-full p-4 rounded-2xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10 hover:border-primary dark:hover:border-primary transition-all text-left flex items-center gap-4"
                                    >
                                        <div
                                            className="size-14 rounded-xl flex items-center justify-center text-white shrink-0"
                                            style={{ backgroundColor: company.corPrimaria }}
                                        >
                                            {company.logoUrl ? (
                                                <img src={company.logoUrl} alt="" className="size-10 object-contain" />
                                            ) : (
                                                <span className="material-symbols-outlined text-2xl">apartment</span>
                                            )}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-bold text-[#131616] dark:text-white truncate">{company.nome}</h3>
                                            <p className="text-sm text-text-muted">/{company.slug}</p>
                                        </div>
                                        <span className="material-symbols-outlined text-text-muted">chevron_right</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default CompanySelect;
