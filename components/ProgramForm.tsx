import React, { useState, useEffect } from 'react';
import { BookingRange } from '../types';
import { PROGRAM_COLORS, PROGRAM_ICONS, DIAS_SEMANA, DURACOES_SESSAO, ALCANCE_AGENDA } from '../constants';
import { addProgram, updateProgram, getProgramById } from '../storageService';
import { useAuth } from '../AuthContext';

interface ProgramFormProps {
    onBack: () => void;
    onSave: () => void;
    editProgramId?: string | null;
}

const ProgramForm: React.FC<ProgramFormProps> = ({ onBack, onSave, editProgramId }) => {
    const { user } = useAuth();
    const [nome, setNome] = useState('');
    const [descricao, setDescricao] = useState('');
    const [categoria, setCategoria] = useState('');
    const [cor, setCor] = useState(PROGRAM_COLORS[0].value);
    const [icone, setIcone] = useState(PROGRAM_ICONS[0].value);
    const [imagemUrl, setImagemUrl] = useState<string | null>(null);
    const [tipo, setTipo] = useState<'recorrente' | 'periodo'>('recorrente');
    const [diasSemana, setDiasSemana] = useState<number[]>([1, 2, 3, 4, 5]);
    const [dataInicio, setDataInicio] = useState('');
    const [dataFim, setDataFim] = useState('');
    const [horarios, setHorarios] = useState<string[]>(['09:00', '10:00', '14:00', '15:00']);
    const [novoHorario, setNovoHorario] = useState('');
    const [duracaoMinutos, setDuracaoMinutos] = useState(60);
    const [vagasPorHorario, setVagasPorHorario] = useState(1);
    const [alcanceAgenda, setAlcanceAgenda] = useState<BookingRange>(30);
    const [limitePorUsuario, setLimitePorUsuario] = useState<number | null>(null);
    const [limitePorDiaUsuario, setLimitePorDiaUsuario] = useState<number | null>(null);
    const [ativo, setAtivo] = useState(true);

    // Estados para gerador de horários
    const [geradorInicio, setGeradorInicio] = useState('09:00');
    const [geradorFim, setGeradorFim] = useState('12:00');
    const [geradorIntervalo, setGeradorIntervalo] = useState(15);
    const [mostrarGerador, setMostrarGerador] = useState(false);
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);

    // Reset form to default values
    const resetForm = () => {
        setNome('');
        setDescricao('');
        setCategoria('');
        setCor(PROGRAM_COLORS[0].value);
        setIcone(PROGRAM_ICONS[0].value);
        setImagemUrl(null);
        setTipo('recorrente');
        setDiasSemana([1, 2, 3, 4, 5]);
        setDataInicio('');
        setDataFim('');
        setHorarios(['09:00', '10:00', '14:00', '15:00']);
        setNovoHorario('');
        setDuracaoMinutos(60);
        setVagasPorHorario(1);
        setAlcanceAgenda(30);
        setLimitePorUsuario(null);
        setLimitePorDiaUsuario(null);
        setAtivo(true);
    };

    useEffect(() => {
        const loadProgram = async () => {
            if (editProgramId) {
                setLoading(true);
                try {
                    const program = await getProgramById(editProgramId);
                    if (program) {
                        setNome(program.nome);
                        setDescricao(program.descricao);
                        setCategoria(program.categoria);
                        setCor(program.cor);
                        setIcone(program.icone);
                        setImagemUrl(program.imagemUrl || null);
                        setTipo(program.tipo);
                        setDiasSemana(program.diasSemana);
                        setDataInicio(program.dataInicio || '');
                        setDataFim(program.dataFim || '');
                        setHorarios(program.horarios.filter(h => h.ativo).map(h => h.hora));
                        setDuracaoMinutos(program.duracaoMinutos);
                        setVagasPorHorario(program.vagasPorHorario);
                        setAlcanceAgenda(program.alcanceAgenda || 30);
                        setLimitePorUsuario(program.limitePorUsuario);
                        setLimitePorDiaUsuario(program.limitePorDiaUsuario);
                        setAtivo(program.ativo);
                    }
                } catch (error) {
                    console.error('Error loading program:', error);
                } finally {
                    setLoading(false);
                }
            } else {
                // Reset form when creating new program
                resetForm();
            }
        };
        loadProgram();
    }, [editProgramId]);

    const toggleDia = (dia: number) => {
        setDiasSemana(prev =>
            prev.includes(dia) ? prev.filter(d => d !== dia) : [...prev, dia].sort()
        );
    };

    const addHorario = () => {
        if (novoHorario && !horarios.includes(novoHorario)) {
            setHorarios(prev => [...prev, novoHorario].sort());
            setNovoHorario('');
        }
    };

    const removeHorario = (hora: string) => {
        setHorarios(prev => prev.filter(h => h !== hora));
    };

    const addHorarioSugerido = (hora: string) => {
        if (!horarios.includes(hora)) {
            setHorarios(prev => [...prev, hora].sort());
        }
    };

    // Gerar horários automaticamente baseado em intervalo
    const gerarHorarios = () => {
        const [inicioHora, inicioMin] = geradorInicio.split(':').map(Number);
        const [fimHora, fimMin] = geradorFim.split(':').map(Number);

        const inicioMinutos = inicioHora * 60 + inicioMin;
        const fimMinutos = fimHora * 60 + fimMin;

        const novosHorarios: string[] = [];

        for (let minutos = inicioMinutos; minutos < fimMinutos; minutos += geradorIntervalo) {
            const hora = Math.floor(minutos / 60);
            const min = minutos % 60;
            const horarioStr = `${hora.toString().padStart(2, '0')}:${min.toString().padStart(2, '0')}`;
            if (!horarios.includes(horarioStr)) {
                novosHorarios.push(horarioStr);
            }
        }

        if (novosHorarios.length > 0) {
            setHorarios(prev => [...prev, ...novosHorarios].sort());
        }
    };

    const limparHorarios = () => {
        setHorarios([]);
    };

    const handleSubmit = async () => {
        if (!nome.trim()) {
            alert('Por favor, informe o nome do programa');
            return;
        }
        if (horarios.length === 0) {
            alert('Por favor, adicione pelo menos um horário');
            return;
        }
        if (tipo === 'periodo' && (!dataInicio || !dataFim)) {
            alert('Por favor, informe as datas de início e fim');
            return;
        }

        const programData = {
            nome,
            descricao,
            categoria,
            cor,
            icone: imagemUrl ? 'custom' : icone,
            imagemUrl,
            tipo,
            diasSemana: tipo === 'recorrente' ? diasSemana : [],
            dataInicio: tipo === 'periodo' ? dataInicio : null,
            dataFim: tipo === 'periodo' ? dataFim : null,
            horarios: horarios.map(h => ({ hora: h, ativo: true })),
            duracaoMinutos,
            vagasPorHorario,
            alcanceAgenda,
            limitePorUsuario,
            limitePorDiaUsuario,
            ativo,
        };

        setSaving(true);
        try {
            if (editProgramId) {
                await updateProgram(editProgramId, programData);
            } else {
                if (!user?.companyId) {
                    alert('Erro: empresa não identificada');
                    setSaving(false);
                    return;
                }
                await addProgram(programData, user.companyId);
            }
            onSave();
        } catch (error) {
            console.error('Error saving program:', error);
            alert('Erro ao salvar programa. Tente novamente.');
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
                <h1 className="text-xl font-bold text-[#131616] dark:text-white flex-1">
                    {editProgramId ? 'Editar Programa' : 'Novo Programa'}
                </h1>
            </header>

            {/* Form */}
            <div className="flex-1 overflow-auto px-5 pb-8">
                {/* Nome */}
                <div className="mt-6">
                    <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                        Nome do Programa *
                    </label>
                    <input
                        type="text"
                        value={nome}
                        onChange={e => setNome(e.target.value)}
                        placeholder="Ex: Sessão de Massagem"
                        className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                </div>

                {/* Descrição */}
                <div className="mt-4">
                    <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                        Descrição
                    </label>
                    <textarea
                        value={descricao}
                        onChange={e => setDescricao(e.target.value)}
                        placeholder="Descreva o programa..."
                        rows={3}
                        className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none resize-none"
                    />
                </div>

                {/* Categoria */}
                <div className="mt-4">
                    <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                        Categoria
                    </label>
                    <input
                        type="text"
                        value={categoria}
                        onChange={e => setCategoria(e.target.value)}
                        placeholder="Ex: Bem-estar, Saúde Mental"
                        className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                    />
                </div>

                {/* Cor e Ícone */}
                <div className="mt-4 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                            Cor
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {PROGRAM_COLORS.map(c => (
                                <button
                                    key={c.value}
                                    onClick={() => setCor(c.value)}
                                    className={`size-8 rounded-full transition-all ${cor === c.value ? 'ring-2 ring-offset-2 ring-gray-400 scale-110' : ''}`}
                                    style={{ backgroundColor: c.value }}
                                />
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                            Ícone
                        </label>

                        {/* Custom Image Preview */}
                        {imagemUrl && (
                            <div className="mb-3 flex items-center gap-3">
                                <div
                                    className="size-12 rounded-xl bg-cover bg-center border-2 border-primary"
                                    style={{ backgroundImage: `url(${imagemUrl})` }}
                                />
                                <button
                                    onClick={() => {
                                        setImagemUrl(null);
                                        setIcone(PROGRAM_ICONS[0].value);
                                    }}
                                    className="text-sm text-red-500 font-medium"
                                >
                                    Remover imagem
                                </button>
                            </div>
                        )}

                        {/* Icon Selection */}
                        {!imagemUrl && (
                            <div className="flex flex-wrap gap-2 mb-3">
                                {PROGRAM_ICONS.map(i => (
                                    <button
                                        key={i.value}
                                        onClick={() => setIcone(i.value)}
                                        className={`size-9 rounded-lg flex items-center justify-center transition-all ${icone === i.value && !imagemUrl ? 'text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}
                                        style={{ backgroundColor: icone === i.value && !imagemUrl ? cor : undefined }}
                                    >
                                        <span className="material-symbols-outlined text-[20px]">{i.value}</span>
                                    </button>
                                ))}
                            </div>
                        )}

                        {/* Upload Image Button */}
                        <label className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300 cursor-pointer hover:bg-gray-200 dark:hover:bg-white/20 transition-colors text-sm w-fit">
                            <span className="material-symbols-outlined text-[18px]">upload</span>
                            <span>{imagemUrl ? 'Trocar imagem' : 'Enviar imagem'}</span>
                            <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                        const reader = new FileReader();
                                        reader.onloadend = () => {
                                            setImagemUrl(reader.result as string);
                                        };
                                        reader.readAsDataURL(file);
                                    }
                                }}
                            />
                        </label>
                    </div>
                </div>

                {/* Tipo de Agenda */}
                <div className="mt-6">
                    <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                        Tipo de Agenda
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => setTipo('recorrente')}
                            className={`p-4 rounded-xl border-2 transition-all ${tipo === 'recorrente' ? 'border-primary bg-primary/10' : 'border-card-border dark:border-white/10'}`}
                        >
                            <span className="material-symbols-outlined text-2xl mb-1" style={{ color: tipo === 'recorrente' ? cor : undefined }}>
                                event_repeat
                            </span>
                            <p className="text-sm font-semibold text-[#131616] dark:text-white">Recorrente</p>
                            <p className="text-xs text-text-muted mt-1">Dias fixos da semana</p>
                        </button>
                        <button
                            onClick={() => setTipo('periodo')}
                            className={`p-4 rounded-xl border-2 transition-all ${tipo === 'periodo' ? 'border-primary bg-primary/10' : 'border-card-border dark:border-white/10'}`}
                        >
                            <span className="material-symbols-outlined text-2xl mb-1" style={{ color: tipo === 'periodo' ? cor : undefined }}>
                                date_range
                            </span>
                            <p className="text-sm font-semibold text-[#131616] dark:text-white">Período</p>
                            <p className="text-xs text-text-muted mt-1">Range de datas</p>
                        </button>
                    </div>
                </div>

                {/* Dias da Semana (se recorrente) */}
                {tipo === 'recorrente' && (
                    <div className="mt-4">
                        <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                            Dias da Semana
                        </label>
                        <div className="flex gap-2">
                            {DIAS_SEMANA.map(dia => (
                                <button
                                    key={dia.value}
                                    onClick={() => toggleDia(dia.value)}
                                    className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${diasSemana.includes(dia.value) ? 'text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}
                                    style={{ backgroundColor: diasSemana.includes(dia.value) ? cor : undefined }}
                                >
                                    {dia.label}
                                </button>
                            ))}
                        </div>
                    </div>
                )}

                {/* Período (se período) */}
                {tipo === 'periodo' && (
                    <div className="mt-4 grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                                Data Início
                            </label>
                            <input
                                type="date"
                                value={dataInicio}
                                onChange={e => setDataInicio(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                                Data Fim
                            </label>
                            <input
                                type="date"
                                value={dataFim}
                                onChange={e => setDataFim(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                        </div>
                    </div>
                )}

                {/* Horários */}
                <div className="mt-6">
                    <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                        Horários Disponíveis
                    </label>

                    {/* Horários selecionados */}
                    <div className="flex flex-wrap gap-2 mb-3">
                        {horarios.map(hora => (
                            <span
                                key={hora}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-sm font-medium text-white"
                                style={{ backgroundColor: cor }}
                            >
                                {hora}
                                <button onClick={() => removeHorario(hora)} className="ml-1 hover:bg-white/20 rounded-full p-0.5">
                                    <span className="material-symbols-outlined text-[14px]">close</span>
                                </button>
                            </span>
                        ))}
                    </div>

                    {/* Adicionar horário */}
                    <div className="flex gap-2 mb-3">
                        <input
                            type="time"
                            value={novoHorario}
                            onChange={e => setNovoHorario(e.target.value)}
                            className="flex-1 px-4 py-2 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                        <button
                            onClick={addHorario}
                            className="px-4 py-2 rounded-xl text-white font-medium"
                            style={{ backgroundColor: cor }}
                        >
                            Adicionar
                        </button>
                    </div>

                    {/* Gerador de Horários */}
                    <div className="mt-4 p-4 rounded-xl bg-gray-50 dark:bg-white/5 border border-card-border dark:border-white/10">
                        <button
                            onClick={() => setMostrarGerador(!mostrarGerador)}
                            className="w-full flex items-center justify-between text-left"
                        >
                            <div className="flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary">auto_awesome</span>
                                <span className="font-semibold text-[#131616] dark:text-white">Gerar Horários Automáticos</span>
                            </div>
                            <span className={`material-symbols-outlined transition-transform ${mostrarGerador ? 'rotate-180' : ''}`}>
                                expand_more
                            </span>
                        </button>

                        {mostrarGerador && (
                            <div className="mt-4 space-y-4">
                                <p className="text-xs text-text-muted">
                                    Defina o período e o intervalo para gerar horários automaticamente
                                </p>

                                {/* Período 1 */}
                                <div className="grid grid-cols-3 gap-2">
                                    <div>
                                        <label className="block text-xs text-text-muted mb-1">Início</label>
                                        <input
                                            type="time"
                                            value={geradorInicio}
                                            onChange={e => setGeradorInicio(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-text-muted mb-1">Fim</label>
                                        <input
                                            type="time"
                                            value={geradorFim}
                                            onChange={e => setGeradorFim(e.target.value)}
                                            className="w-full px-3 py-2 rounded-lg border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white text-sm"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs text-text-muted mb-1">Intervalo (min)</label>
                                        <input
                                            type="number"
                                            min="5"
                                            max="120"
                                            step="5"
                                            value={geradorIntervalo}
                                            onChange={e => setGeradorIntervalo(Number(e.target.value) || 15)}
                                            className="w-full px-3 py-2 rounded-lg border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white text-sm"
                                            placeholder="15"
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={gerarHorarios}
                                        className="flex-1 py-2 rounded-lg text-white font-medium text-sm flex items-center justify-center gap-1"
                                        style={{ backgroundColor: cor }}
                                    >
                                        <span className="material-symbols-outlined text-[18px]">add</span>
                                        Gerar Horários
                                    </button>
                                    {horarios.length > 0 && (
                                        <button
                                            onClick={limparHorarios}
                                            className="py-2 px-4 rounded-lg bg-red-500/10 text-red-500 font-medium text-sm"
                                        >
                                            Limpar Todos
                                        </button>
                                    )}
                                </div>

                                <p className="text-xs text-text-muted">
                                    <strong>Dica:</strong> Você pode gerar múltiplos períodos. Ex: 9h-12h e depois 13h-17h
                                </p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Duração e Vagas */}
                <div className="mt-6 grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                            Duração da Sessão
                        </label>
                        <select
                            value={duracaoMinutos}
                            onChange={e => setDuracaoMinutos(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        >
                            {DURACOES_SESSAO.map(d => (
                                <option key={d.value} value={d.value}>{d.label}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                            Vagas por Horário
                        </label>
                        <input
                            type="number"
                            min={1}
                            max={100}
                            value={vagasPorHorario}
                            onChange={e => setVagasPorHorario(Number(e.target.value))}
                            className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                        />
                    </div>
                </div>

                {/* Alcance da Agenda */}
                <div className="mt-6">
                    <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                        Alcance da Agenda
                    </label>
                    <p className="text-xs text-text-muted mb-3">
                        Até quando os colaboradores podem agendar
                    </p>
                    <div className="grid grid-cols-2 gap-2">
                        {ALCANCE_AGENDA.map(opt => (
                            <button
                                key={opt.value}
                                onClick={() => setAlcanceAgenda(opt.value as BookingRange)}
                                className={`p-3 rounded-xl border-2 transition-all text-left ${alcanceAgenda === opt.value
                                    ? 'border-primary'
                                    : 'border-card-border dark:border-white/10'
                                    }`}
                                style={{
                                    borderColor: alcanceAgenda === opt.value ? cor : undefined,
                                    backgroundColor: alcanceAgenda === opt.value ? `${cor}10` : undefined
                                }}
                            >
                                <p className="font-semibold text-sm text-[#131616] dark:text-white">{opt.label}</p>
                                <p className="text-xs text-text-muted">{opt.description}</p>
                            </button>
                        ))}
                    </div>
                </div>

                {/* Limites por Usuário */}
                <div className="mt-6">
                    <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                        Limites por Colaborador
                    </label>
                    <p className="text-xs text-text-muted mb-3">
                        Defina quantos agendamentos cada colaborador pode ter (deixe vazio para ilimitado)
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs text-text-muted mb-1">
                                Máximo de Agendamentos Ativos
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={50}
                                value={limitePorUsuario ?? ''}
                                onChange={e => setLimitePorUsuario(e.target.value ? Number(e.target.value) : null)}
                                placeholder="Sem limite"
                                className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            <p className="text-xs text-text-muted mt-1">
                                Limite total de agendamentos futuros
                            </p>
                        </div>
                        <div>
                            <label className="block text-xs text-text-muted mb-1">
                                Máximo por Dia
                            </label>
                            <input
                                type="number"
                                min={1}
                                max={10}
                                value={limitePorDiaUsuario ?? ''}
                                onChange={e => setLimitePorDiaUsuario(e.target.value ? Number(e.target.value) : null)}
                                placeholder="Sem limite"
                                className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                            />
                            <p className="text-xs text-text-muted mt-1">
                                Limite de agendamentos no mesmo dia
                            </p>
                        </div>
                    </div>
                </div>

                {/* Ativo */}
                <div className="mt-6 flex items-center justify-between p-4 rounded-xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10">
                    <div>
                        <p className="font-semibold text-[#131616] dark:text-white">Programa Ativo</p>
                        <p className="text-xs text-text-muted">Colaboradores podem visualizar e agendar</p>
                    </div>
                    <button
                        onClick={() => setAtivo(!ativo)}
                        className={`w-12 h-7 rounded-full transition-all ${ativo ? 'bg-primary' : 'bg-gray-300 dark:bg-gray-600'}`}
                    >
                        <div className={`size-5 bg-white rounded-full shadow transition-transform ${ativo ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>

                {/* Botão Salvar */}
                <button
                    onClick={handleSubmit}
                    className="w-full mt-8 py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all hover:opacity-90 active:scale-[0.98]"
                    style={{ backgroundColor: cor }}
                >
                    {editProgramId ? 'Salvar Alterações' : 'Criar Programa'}
                </button>
            </div>
        </div>
    );
};

export default ProgramForm;
