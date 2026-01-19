import React, { useState, useEffect } from 'react';
import { Company } from '../types';
import { createCompany, updateCompany, getAllCompanies } from '../authService';

interface CompanyFormProps {
    onBack: () => void;
    onSave: () => void;
    editCompanyId?: string | null;
}

const COMPANY_COLORS = [
    '#2DD4BF', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B',
    '#10B981', '#6366F1', '#EF4444', '#14B8A6', '#F97316'
];

const CompanyForm: React.FC<CompanyFormProps> = ({ onBack, onSave, editCompanyId }) => {
    const [nome, setNome] = useState('');
    const [slug, setSlug] = useState('');
    const [logoUrl, setLogoUrl] = useState<string | null>(null);
    const [corPrimaria, setCorPrimaria] = useState(COMPANY_COLORS[0]);
    const [ativo, setAtivo] = useState(true);
    const [saving, setSaving] = useState(false);
    const [loading, setLoading] = useState(false);
    const [dominiosEmail, setDominiosEmail] = useState<string[]>([]);
    const [novoDominio, setNovoDominio] = useState('');

    useEffect(() => {
        const loadCompany = async () => {
            if (editCompanyId) {
                setLoading(true);
                try {
                    const companies = await getAllCompanies();
                    const company = companies.find(c => c.id === editCompanyId);
                    if (company) {
                        setNome(company.nome);
                        setSlug(company.slug);
                        setLogoUrl(company.logoUrl);
                        setCorPrimaria(company.corPrimaria);
                        setAtivo(company.ativo);
                        setDominiosEmail(company.dominiosEmail || []);
                    }
                } catch (error) {
                    console.error('Error loading company:', error);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadCompany();
    }, [editCompanyId]);

    const generateSlug = (text: string): string => {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9\s-]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .trim();
    };

    const handleNomeChange = (value: string) => {
        setNome(value);
        if (!editCompanyId) {
            setSlug(generateSlug(value));
        }
    };

    const handleSubmit = async () => {
        if (!nome.trim()) {
            alert('Por favor, informe o nome da empresa');
            return;
        }
        if (!slug.trim()) {
            alert('Por favor, informe o identificador (slug) da empresa');
            return;
        }

        setSaving(true);
        try {
            if (editCompanyId) {
                await updateCompany(editCompanyId, {
                    nome,
                    slug,
                    logoUrl,
                    corPrimaria,
                    ativo,
                    dominiosEmail,
                });
            } else {
                await createCompany({
                    nome,
                    slug,
                    logoUrl,
                    bannerUrl: null,
                    corPrimaria,
                    corSecundaria: '#0d9488',
                    dominiosEmail,
                    ativo,
                });
            }
            onSave();
        } catch (error) {
            console.error('Error saving company:', error);
            alert('Erro ao salvar empresa. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

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
                    {editCompanyId ? 'Editar Empresa' : 'Nova Empresa'}
                </h1>
            </header>

            {/* Form */}
            <div className="flex-1 overflow-auto px-5 pb-8">
                {/* Preview Card */}
                <div className="mt-4 p-4 rounded-2xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10">
                    <div className="flex items-center gap-3">
                        <div
                            className="size-14 rounded-xl flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: corPrimaria }}
                        >
                            {logoUrl ? (
                                <img src={logoUrl} alt="" className="size-10 object-contain" />
                            ) : (
                                <span className="material-symbols-outlined text-2xl">apartment</span>
                            )}
                        </div>
                        <div>
                            <p className="font-bold text-[#131616] dark:text-white">{nome || 'Nome da Empresa'}</p>
                            <p className="text-sm text-text-muted">/{slug || 'slug'}</p>
                        </div>
                    </div>
                </div>

                {/* Nome */}
                <div className="mt-6">
                    <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                        Nome da Empresa *
                    </label>
                    <input
                        type="text"
                        value={nome}
                        onChange={e => handleNomeChange(e.target.value)}
                        placeholder="Ex: Petrobras"
                        className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                </div>

                {/* Slug */}
                <div className="mt-4">
                    <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                        Identificador (Slug) *
                    </label>
                    <input
                        type="text"
                        value={slug}
                        onChange={e => setSlug(generateSlug(e.target.value))}
                        placeholder="Ex: petrobras"
                        className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                    <p className="text-xs text-text-muted mt-1">
                        Usado para identificar a empresa no sistema. Apenas letras, números e hífens.
                    </p>
                </div>

                {/* Cor */}
                <div className="mt-6">
                    <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                        Cor Principal
                    </label>
                    <div className="flex flex-wrap gap-2">
                        {COMPANY_COLORS.map(c => (
                            <button
                                key={c}
                                onClick={() => setCorPrimaria(c)}
                                className={`size-10 rounded-full transition-all ${corPrimaria === c ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                                style={{ backgroundColor: c }}
                            />
                        ))}
                    </div>
                </div>

                {/* Logo */}
                <div className="mt-6">
                    <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                        Logo da Empresa
                    </label>
                    {logoUrl && (
                        <div className="mb-3 flex items-center gap-3">
                            <div
                                className="size-12 rounded-xl bg-cover bg-center border-2"
                                style={{
                                    backgroundImage: `url(${logoUrl})`,
                                    borderColor: corPrimaria
                                }}
                            />
                            <button
                                onClick={() => setLogoUrl(null)}
                                className="text-sm text-red-500 font-medium"
                            >
                                Remover logo
                            </button>
                        </div>
                    )}
                    <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-sm w-fit">
                        <span className="material-symbols-outlined text-[18px]">upload</span>
                        <span>{logoUrl ? 'Trocar logo' : 'Enviar logo'}</span>
                        <input
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => {
                                const file = e.target.files?.[0];
                                if (file) {
                                    const reader = new FileReader();
                                    reader.onloadend = () => {
                                        setLogoUrl(reader.result as string);
                                    };
                                    reader.readAsDataURL(file);
                                }
                            }}
                        />
                    </label>
                </div>

                {/* Domínios de Email para Login Microsoft */}
                <div className="mt-6">
                    <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                        Domínios de Email para Login Microsoft
                    </label>
                    <p className="text-xs text-text-muted mb-3">
                        Usuários com e-mail corporativo desses domínios poderão fazer login automático via Microsoft e serão associados a esta empresa.
                    </p>

                    {/* Lista de domínios */}
                    {dominiosEmail.length > 0 && (
                        <div className="flex flex-wrap gap-2 mb-3">
                            {dominiosEmail.map((dominio, index) => (
                                <div
                                    key={index}
                                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium"
                                >
                                    <span>{dominio}</span>
                                    <button
                                        onClick={() => setDominiosEmail(prev => prev.filter((_, i) => i !== index))}
                                        className="size-4 rounded-full bg-primary/20 hover:bg-primary/30 flex items-center justify-center transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-[12px]">close</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Adicionar novo domínio */}
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={novoDominio}
                            onChange={e => setNovoDominio(e.target.value)}
                            placeholder="@empresa.com.br"
                            className="flex-1 px-4 py-2.5 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none text-sm"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    e.preventDefault();
                                    if (novoDominio.trim()) {
                                        let dominio = novoDominio.trim().toLowerCase();
                                        if (!dominio.startsWith('@')) {
                                            dominio = '@' + dominio;
                                        }
                                        if (!dominiosEmail.includes(dominio)) {
                                            setDominiosEmail(prev => [...prev, dominio]);
                                            setNovoDominio('');
                                        }
                                    }
                                }
                            }}
                        />
                        <button
                            onClick={() => {
                                if (novoDominio.trim()) {
                                    let dominio = novoDominio.trim().toLowerCase();
                                    if (!dominio.startsWith('@')) {
                                        dominio = '@' + dominio;
                                    }
                                    if (!dominiosEmail.includes(dominio)) {
                                        setDominiosEmail(prev => [...prev, dominio]);
                                        setNovoDominio('');
                                    }
                                }
                            }}
                            className="px-4 py-2.5 rounded-xl bg-primary text-white font-medium text-sm hover:opacity-90 transition-opacity"
                        >
                            Adicionar
                        </button>
                    </div>
                </div>

                {/* Ativo */}
                <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10">
                    <div>
                        <p className="font-semibold text-[#131616] dark:text-white">Empresa Ativa</p>
                        <p className="text-xs text-text-muted">Usuários podem fazer login e agendamentos</p>
                    </div>
                    <button
                        onClick={() => setAtivo(!ativo)}
                        className={`w-12 h-7 rounded-full transition-all ${ativo ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <div className={`size-5 bg-white rounded-full shadow transition-transform ${ativo ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {/* Submit */}
                <button
                    onClick={handleSubmit}
                    disabled={saving}
                    className="w-full mt-8 py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                    style={{ backgroundColor: corPrimaria }}
                >
                    {saving ? 'Salvando...' : editCompanyId ? 'Salvar Alterações' : 'Criar Empresa'}
                </button>
            </div>
        </div>
    );
};

export default CompanyForm;
