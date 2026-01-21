import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { updateCompany } from '../authService';
import { supabase } from '../supabaseClient';

interface CompanySettingsProps {
    onBack: () => void;
    onSave: () => void;
}

const PRESET_COLORS = [
    '#22c55e', // Green
    '#3b82f6', // Blue
    '#8b5cf6', // Purple
    '#ec4899', // Pink
    '#f97316', // Orange
    '#eab308', // Yellow
    '#ef4444', // Red
    '#06b6d4', // Cyan
    '#10b981', // Emerald
    '#6366f1', // Indigo
];

// Default BemEstar+ colors
const DEFAULT_PRIMARY = '#22c55e';
const DEFAULT_SECONDARY = '#0d9488'; // Teal - harmonizes with green

const CompanySettings: React.FC<CompanySettingsProps> = ({ onBack, onSave }) => {
    const { user } = useAuth();
    const [corPrimaria, setCorPrimaria] = useState('#22c55e');
    const [corSecundaria, setCorSecundaria] = useState('#0d9488');
    const [bannerUrl, setBannerUrl] = useState<string | null>(null);
    const [nomeBanner, setNomeBanner] = useState('');
    const [dominiosEmail, setDominiosEmail] = useState<string[]>([]);
    const [novoDominio, setNovoDominio] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);

    useEffect(() => {
        if (user?.company) {
            setCorPrimaria(user.company.corPrimaria);
            setCorSecundaria(user.company.corSecundaria || '#0d9488');
            setBannerUrl(user.company.bannerUrl);
            setNomeBanner(user.company.nomeBanner || user.company.nome || '');
            setDominiosEmail(user.company.dominiosEmail || []);
        }
    }, [user]);

    const handleAddDomain = () => {
        const domain = novoDominio.trim().toLowerCase();
        if (!domain) return;

        // Ensure it starts with @
        const formattedDomain = domain.startsWith('@') ? domain : '@' + domain;

        if (!dominiosEmail.includes(formattedDomain)) {
            setDominiosEmail([...dominiosEmail, formattedDomain]);
        }
        setNovoDominio('');
    };

    const handleRemoveDomain = (domain: string) => {
        setDominiosEmail(dominiosEmail.filter(d => d !== domain));
    };

    const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user?.companyId) return;

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.companyId}-banner-${Date.now()}.${fileExt}`;
            const filePath = `banners/${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('company-assets')
                .upload(filePath, file, { upsert: true });

            if (uploadError) throw uploadError;

            const { data } = supabase.storage
                .from('company-assets')
                .getPublicUrl(filePath);

            setBannerUrl(data.publicUrl);
        } catch (error) {
            console.error('Error uploading banner:', error);
            alert('Erro ao fazer upload do banner');
        } finally {
            setUploading(false);
        }
    };

    const handleRemoveBanner = () => {
        setBannerUrl(null);
    };

    const handleRestoreDefaults = () => {
        setCorPrimaria(DEFAULT_PRIMARY);
        setCorSecundaria(DEFAULT_SECONDARY);
        setBannerUrl(null);
    };

    const handleSave = async () => {
        if (!user?.companyId) return;

        setSaving(true);
        try {
            const success = await updateCompany(user.companyId, {
                corPrimaria,
                corSecundaria,
                bannerUrl,
                nomeBanner: nomeBanner.trim() || null,
                dominiosEmail,
            });

            if (success) {
                alert('Configurações salvas com sucesso! Faça login novamente para ver as mudanças.');
                onSave();
            } else {
                alert('Erro ao salvar configurações');
            }
        } catch (error) {
            console.error('Error saving settings:', error);
            alert('Erro ao salvar configurações');
        } finally {
            setSaving(false);
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
                    <h1 className="text-xl font-bold text-[#131616] dark:text-white">Identidade Visual</h1>
                    <p className="text-sm text-text-muted">Personalize as cores da empresa</p>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-auto px-5 pb-8">
                {/* Preview */}
                <div className="mt-4 mb-6">
                    <p className="text-sm font-semibold text-[#131616] dark:text-white mb-3">Pré-visualização</p>
                    <div className="rounded-2xl overflow-hidden shadow-lg">
                        {bannerUrl ? (
                            <div className="relative h-32">
                                <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                                <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70"></div>
                                <div className="absolute bottom-3 left-4 text-white">
                                    <p className="text-xs text-white/60">Bem-vindo ao</p>
                                    <p className="font-bold">{nomeBanner || user?.company?.nome || 'Sua Empresa'}</p>
                                </div>
                            </div>
                        ) : (
                            <div
                                className="h-32 relative"
                                style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` }}
                            >
                                <div className="absolute inset-0 opacity-20">
                                    <div className="absolute top-0 right-0 size-20 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                                </div>
                                <div className="absolute bottom-3 left-4 text-white">
                                    <p className="text-xs text-white/60">Bem-vindo ao</p>
                                    <p className="font-bold">{nomeBanner || user?.company?.nome || 'Sua Empresa'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Banner Upload */}
                <div className="mb-6">
                    <p className="text-sm font-semibold text-[#131616] dark:text-white mb-3">Banner (opcional)</p>
                    <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10">
                        {bannerUrl ? (
                            <div className="flex items-center gap-3">
                                <img src={bannerUrl} alt="Banner atual" className="size-16 rounded-lg object-cover" />
                                <div className="flex-1">
                                    <p className="font-medium text-[#131616] dark:text-white">Banner definido</p>
                                    <p className="text-xs text-text-muted">Clique para alterar</p>
                                </div>
                                <button
                                    onClick={handleRemoveBanner}
                                    className="size-10 rounded-full bg-red-100 dark:bg-red-500/20 flex items-center justify-center text-red-500"
                                >
                                    <span className="material-symbols-outlined text-lg">delete</span>
                                </button>
                            </div>
                        ) : (
                            <label className="flex flex-col items-center py-6 cursor-pointer">
                                <div className="size-14 rounded-2xl bg-gray-100 dark:bg-white/10 flex items-center justify-center mb-3">
                                    <span className="material-symbols-outlined text-2xl text-text-muted">add_photo_alternate</span>
                                </div>
                                <p className="font-medium text-[#131616] dark:text-white">
                                    {uploading ? 'Enviando...' : 'Adicionar Banner'}
                                </p>
                                <p className="text-xs text-text-muted mt-1">Recomendado: 800x300px</p>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleBannerUpload}
                                    disabled={uploading}
                                    className="hidden"
                                />
                            </label>
                        )}
                    </div>
                </div>

                {/* Nome no Banner */}
                <div className="mb-6">
                    <p className="text-sm font-semibold text-[#131616] dark:text-white mb-3">Nome no Banner</p>
                    <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10">
                        <input
                            type="text"
                            value={nomeBanner}
                            onChange={e => setNomeBanner(e.target.value)}
                            placeholder="Ex: Grupo Marista"
                            className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-gray-50 dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                        <p className="text-xs text-text-muted mt-2">
                            Este texto aparece após "Bem-vindo ao" na tela inicial
                        </p>
                    </div>
                </div>

                {/* Primary Color */}
                <div className="mb-6">
                    <p className="text-sm font-semibold text-[#131616] dark:text-white mb-3">Cor Primária</p>
                    <div className="grid grid-cols-5 gap-3">
                        {PRESET_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setCorPrimaria(color)}
                                className={`aspect-square rounded-xl transition-all ${corPrimaria === color ? 'ring-4 ring-offset-2 ring-offset-background-light dark:ring-offset-background-dark' : ''}`}
                                style={{
                                    backgroundColor: color,
                                    ringColor: color,
                                }}
                            >
                                {corPrimaria === color && (
                                    <span className="material-symbols-outlined text-white text-lg">check</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                        <label className="text-sm text-text-muted">Ou escolha:</label>
                        <input
                            type="color"
                            value={corPrimaria}
                            onChange={e => setCorPrimaria(e.target.value)}
                            className="size-10 rounded-lg cursor-pointer"
                        />
                        <span className="text-sm font-mono text-text-muted">{corPrimaria}</span>
                    </div>
                </div>

                {/* Secondary Color */}
                <div className="mb-6">
                    <p className="text-sm font-semibold text-[#131616] dark:text-white mb-3">Cor Secundária (para gradiente)</p>
                    <div className="grid grid-cols-5 gap-3">
                        {PRESET_COLORS.map(color => (
                            <button
                                key={color}
                                onClick={() => setCorSecundaria(color)}
                                className={`aspect-square rounded-xl transition-all ${corSecundaria === color ? 'ring-4 ring-offset-2 ring-offset-background-light dark:ring-offset-background-dark' : ''}`}
                                style={{
                                    backgroundColor: color,
                                    ringColor: color,
                                }}
                            >
                                {corSecundaria === color && (
                                    <span className="material-symbols-outlined text-white text-lg">check</span>
                                )}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                        <label className="text-sm text-text-muted">Ou escolha:</label>
                        <input
                            type="color"
                            value={corSecundaria}
                            onChange={e => setCorSecundaria(e.target.value)}
                            className="size-10 rounded-lg cursor-pointer"
                        />
                        <span className="text-sm font-mono text-text-muted">{corSecundaria}</span>
                    </div>
                </div>

                {/* Gradient Preview */}
                <div className="mb-8">
                    <p className="text-sm font-semibold text-[#131616] dark:text-white mb-3">Gradiente resultante</p>
                    <div
                        className="h-16 rounded-xl"
                        style={{ background: `linear-gradient(135deg, ${corPrimaria}, ${corSecundaria})` }}
                    ></div>
                </div>

                {/* Email Domains Section */}
                <div className="mb-8 p-5 rounded-2xl bg-blue-500/10 border border-blue-500/20">
                    <div className="flex items-center gap-2 mb-4">
                        <span className="material-symbols-outlined text-blue-500">domain</span>
                        <h3 className="text-lg font-bold text-[#131616] dark:text-white">Domínios de Email</h3>
                    </div>
                    <p className="text-sm text-text-muted mb-4">
                        Colaboradores com emails destes domínios podem fazer login automaticamente via Microsoft.
                    </p>

                    {/* Add Domain Input */}
                    <div className="flex gap-2 mb-4">
                        <input
                            type="text"
                            value={novoDominio}
                            onChange={e => setNovoDominio(e.target.value)}
                            placeholder="@empresa.com.br"
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddDomain())}
                            className="flex-1 px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none text-sm"
                        />
                        <button
                            onClick={handleAddDomain}
                            className="px-4 py-3 rounded-xl bg-blue-500 text-white font-semibold hover:bg-blue-600 transition-colors flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined text-lg">add</span>
                            Adicionar
                        </button>
                    </div>

                    {/* Domain List */}
                    {dominiosEmail.length > 0 ? (
                        <div className="space-y-2">
                            {dominiosEmail.map(domain => (
                                <div
                                    key={domain}
                                    className="flex items-center justify-between p-3 rounded-xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="material-symbols-outlined text-blue-500 text-lg">mail</span>
                                        <span className="font-mono text-sm text-[#131616] dark:text-white">{domain}</span>
                                    </div>
                                    <button
                                        onClick={() => handleRemoveDomain(domain)}
                                        className="size-8 rounded-lg hover:bg-red-500/10 flex items-center justify-center transition-colors"
                                    >
                                        <span className="material-symbols-outlined text-red-500 text-lg">delete</span>
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-4 text-text-muted text-sm">
                            <span className="material-symbols-outlined text-2xl mb-2 block">domain_add</span>
                            Nenhum domínio configurado
                        </div>
                    )}
                </div>

                {/* Restore Default Button */}
                <button
                    onClick={handleRestoreDefaults}
                    className="w-full py-3 rounded-xl font-semibold text-text-muted bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-all flex items-center justify-center gap-2 mb-3"
                >
                    <span className="material-symbols-outlined text-lg">restart_alt</span>
                    Restaurar Padrão
                </button>

                {/* Save Button */}
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: corPrimaria }}
                >
                    {saving ? 'Salvando...' : 'Salvar Configurações'}
                </button>
            </div>
        </div>
    );
};

export default CompanySettings;
