import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Program, AvailableSlot } from '../types';
import { getProgramById, getAvailableSlots, isDateAvailableForProgram, addBooking } from '../storageService';
import { useAuth } from '../AuthContext';
import ProgramIcon from './ProgramIcon';

interface BookingScreenProps {
    programId: string;
    onBack: () => void;
    onConfirm: () => void;
}

const BookingScreen: React.FC<BookingScreenProps> = ({ programId, onBack, onConfirm }) => {
    const { user } = useAuth();
    const [program, setProgram] = useState<Program | null>(null);
    const [selectedDate, setSelectedDate] = useState<string>('');
    const [selectedSlot, setSelectedSlot] = useState<string>('');
    const [availableSlots, setAvailableSlots] = useState<AvailableSlot[]>([]);
    const [nome, setNome] = useState('');
    const [email, setEmail] = useState('');
    const [step, setStep] = useState<'calendar' | 'slot' | 'confirm'>('calendar');
    const [currentMonth, setCurrentMonth] = useState(new Date());
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [availableDatesMap, setAvailableDatesMap] = useState<Map<string, number>>(new Map());

    useEffect(() => {
        const loadProgram = async () => {
            try {
                const p = await getProgramById(programId);
                setProgram(p || null);
            } catch (error) {
                console.error('Error loading program:', error);
            } finally {
                setLoading(false);
            }
        };
        loadProgram();
    }, [programId]);

    // Load available dates when program or month changes
    useEffect(() => {
        const loadAvailableDates = async () => {
            if (!program) return;

            const today = new Date();
            today.setHours(0, 0, 0, 0);
            const datesMap = new Map<string, number>();
            const maxDays = program.alcanceAgenda || 30;

            for (let i = 0; i < maxDays; i++) {
                const date = new Date(today);
                date.setDate(today.getDate() + i);
                if (isDateAvailableForProgram(program, date)) {
                    const dateStr = date.toISOString().split('T')[0];
                    const slots = await getAvailableSlots(programId, dateStr);
                    const totalSlots = slots.reduce((sum, s) => sum + s.vagasDisponiveis, 0);
                    if (totalSlots > 0) {
                        datesMap.set(dateStr, totalSlots);
                    }
                }
            }

            setAvailableDatesMap(datesMap);
        };

        loadAvailableDates();
    }, [program, programId]);

    useEffect(() => {
        const loadSlots = async () => {
            if (selectedDate && programId) {
                const slots = await getAvailableSlots(programId, selectedDate);
                setAvailableSlots(slots);
                setSelectedSlot('');
            }
        };
        loadSlots();
    }, [selectedDate, programId]);

    // Generate calendar data
    const calendarData = useMemo(() => {
        const year = currentMonth.getFullYear();
        const month = currentMonth.getMonth();

        // First day of the month
        const firstDay = new Date(year, month, 1);

        // Start from Sunday of the first week
        const startDate = new Date(firstDay);
        startDate.setDate(startDate.getDate() - startDate.getDay());

        const weeks: Date[][] = [];
        let currentWeek: Date[] = [];
        const current = new Date(startDate);

        // Generate 6 weeks to cover all possible month layouts
        for (let i = 0; i < 42; i++) {
            currentWeek.push(new Date(current));
            if (currentWeek.length === 7) {
                weeks.push(currentWeek);
                currentWeek = [];
            }
            current.setDate(current.getDate() + 1);
        }

        return { weeks };
    }, [currentMonth]);

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <div className="size-12 rounded-xl bg-primary flex items-center justify-center text-white mx-auto mb-4">
                        <span className="material-symbols-outlined animate-spin">progress_activity</span>
                    </div>
                    <p className="text-text-muted">Carregando programa...</p>
                </div>
            </div>
        );
    }

    if (!program) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <p className="text-text-muted">Programa não encontrado</p>
            </div>
        );
    }

    const handleDateSelect = (date: Date) => {
        const dateStr = date.toISOString().split('T')[0];
        if (availableDatesMap.has(dateStr)) {
            setSelectedDate(dateStr);
            setStep('slot');
        }
    };

    const handleSlotSelect = (slot: string) => {
        setSelectedSlot(slot);
        setStep('confirm');
    };

    const handleSubmit = async () => {
        if (!user) {
            alert('Você precisa estar logado para fazer um agendamento');
            return;
        }
        if (!user.companyId) {
            alert('Erro: empresa não identificada');
            return;
        }

        setSubmitting(true);
        try {
            const result = await addBooking({
                programaId: programId,
                usuarioNome: user.nome,
                usuarioEmail: user.email.toLowerCase().trim(),
                data: selectedDate,
                horario: selectedSlot,
            }, user.id, user.companyId);

            if (result.success) {
                onConfirm();
            } else {
                alert(result.error || 'Erro ao criar agendamento. Tente novamente.');
            }
        } catch (error) {
            console.error('Error creating booking:', error);
            alert('Erro ao criar agendamento. Tente novamente.');
        } finally {
            setSubmitting(false);
        }
    };

    const formatDate = (dateStr: string): string => {
        const date = new Date(dateStr + 'T12:00:00');
        return date.toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' });
    };

    const goToPreviousMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() - 1, 1));
    };

    const goToNextMonth = () => {
        setCurrentMonth(prev => new Date(prev.getFullYear(), prev.getMonth() + 1, 1));
    };

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

    return (
        <div className="flex-1 flex flex-col bg-background-light dark:bg-background-dark">
            {/* Header */}
            <header className="flex items-center gap-3 p-4 pt-6 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-40">
                <button
                    onClick={() => {
                        if (step === 'info') setStep('slot');
                        else if (step === 'slot') setStep('calendar');
                        else onBack();
                    }}
                    className="size-10 rounded-full flex items-center justify-center hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
                >
                    <span className="material-symbols-outlined">arrow_back</span>
                </button>
                <div className="flex-1">
                    <h1 className="text-xl font-bold text-[#131616] dark:text-white">{program.nome}</h1>
                    <p className="text-sm text-text-muted">
                        {step === 'calendar' && 'Escolha uma data'}
                        {step === 'slot' && 'Escolha um horário'}
                        {step === 'info' && 'Confirme seus dados'}
                    </p>
                </div>
            </header>

            {/* Progress */}
            <div className="flex gap-2 px-5 py-3">
                {['calendar', 'slot', 'info'].map((s, i) => (
                    <div
                        key={s}
                        className={`flex-1 h-1 rounded-full transition-all ${['calendar', 'slot', 'info'].indexOf(step) >= i ? 'bg-primary' : 'bg-gray-200 dark:bg-white/10'
                            }`}
                        style={{ backgroundColor: ['calendar', 'slot', 'info'].indexOf(step) >= i ? program.cor : undefined }}
                    />
                ))}
            </div>

            {/* Content */}
            <div className="flex-1 overflow-auto px-5 pb-8">
                {/* Step 1: Calendar Selection */}
                {step === 'calendar' && (
                    <div className="mt-4">
                        {/* Calendar Container */}
                        <div className="bg-white dark:bg-white/5 rounded-2xl border border-card-border dark:border-white/10 overflow-hidden">
                            {/* Month Navigation */}
                            <div className="flex items-center justify-between p-4 border-b border-card-border dark:border-white/10">
                                <button
                                    onClick={goToPreviousMonth}
                                    className="size-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                >
                                    <span className="material-symbols-outlined">chevron_left</span>
                                </button>
                                <h3 className="text-lg font-bold text-[#131616] dark:text-white capitalize">
                                    {currentMonth.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
                                </h3>
                                <button
                                    onClick={goToNextMonth}
                                    className="size-10 rounded-full flex items-center justify-center hover:bg-gray-100 dark:hover:bg-white/10 transition-colors"
                                >
                                    <span className="material-symbols-outlined">chevron_right</span>
                                </button>
                            </div>

                            {/* Week Days Header */}
                            <div className="grid grid-cols-7 border-b border-card-border dark:border-white/10">
                                {weekDays.map(day => (
                                    <div key={day} className="py-2 text-center text-xs font-semibold text-text-muted uppercase">
                                        {day}
                                    </div>
                                ))}
                            </div>

                            {/* Calendar Grid */}
                            <div className="p-2">
                                {calendarData.weeks.map((week, weekIndex) => (
                                    <div key={weekIndex} className="grid grid-cols-7">
                                        {week.map((date, dayIndex) => {
                                            const dateStr = date.toISOString().split('T')[0];
                                            const isCurrentMonth = date.getMonth() === currentMonth.getMonth();
                                            const slotsAvailable = availableDatesMap.get(dateStr) || 0;
                                            const isAvailable = slotsAvailable > 0;
                                            const isToday = date.toDateString() === today.toDateString();
                                            const isPast = date < today;
                                            const isSelected = dateStr === selectedDate;

                                            return (
                                                <button
                                                    key={dayIndex}
                                                    onClick={() => handleDateSelect(date)}
                                                    disabled={!isAvailable || isPast}
                                                    className={`
                                                        aspect-square m-0.5 rounded-xl flex flex-col items-center justify-center text-sm transition-all relative
                                                        ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-700' : ''}
                                                        ${isCurrentMonth && !isAvailable && !isPast ? 'text-gray-400 dark:text-gray-600' : ''}
                                                        ${isCurrentMonth && isPast ? 'text-gray-300 dark:text-gray-700' : ''}
                                                        ${isAvailable && !isPast && isCurrentMonth ? 'text-white cursor-pointer hover:scale-105' : ''}
                                                        ${isToday && !isSelected ? 'ring-2 ring-offset-1 ring-gray-400' : ''}
                                                    `}
                                                    style={{
                                                        backgroundColor: isSelected
                                                            ? program.cor
                                                            : isAvailable && !isPast && isCurrentMonth
                                                                ? program.cor
                                                                : undefined,
                                                    }}
                                                >
                                                    <span className={`font-bold ${isAvailable && !isPast && isCurrentMonth ? 'text-white' : ''}`}>
                                                        {date.getDate()}
                                                    </span>
                                                    {isAvailable && !isPast && isCurrentMonth && (
                                                        <span className="text-[9px] font-medium text-white/90 -mt-0.5">
                                                            {slotsAvailable} {slotsAvailable === 1 ? 'vaga' : 'vagas'}
                                                        </span>
                                                    )}
                                                </button>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Legend */}
                        <div className="flex items-center justify-center gap-6 mt-4 text-xs text-text-muted">
                            <div className="flex items-center gap-2">
                                <div
                                    className="size-6 rounded-lg flex items-center justify-center text-white text-[10px] font-bold"
                                    style={{ backgroundColor: program.cor }}
                                >
                                    5
                                </div>
                                <span>Vagas disp.</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <div className="size-6 rounded-lg bg-gray-200 dark:bg-gray-700" />
                                <span>Indisponível</span>
                            </div>
                        </div>
                    </div>
                )}

                {/* Step 2: Slot Selection */}
                {step === 'slot' && (
                    <div className="mt-4">
                        <div className="p-4 rounded-xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10 mb-4">
                            <p className="text-sm text-text-muted">Data selecionada</p>
                            <p className="font-semibold text-[#131616] dark:text-white capitalize">{formatDate(selectedDate)}</p>
                        </div>

                        <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider mb-3">
                            Horários Disponíveis
                        </h3>

                        {availableSlots.length === 0 ? (
                            <div className="text-center py-12">
                                <span className="material-symbols-outlined text-5xl text-gray-300 dark:text-gray-600">schedule</span>
                                <p className="text-text-muted mt-4">Nenhum horário disponível para esta data</p>
                                <button
                                    onClick={() => setStep('calendar')}
                                    className="mt-4 text-primary font-medium"
                                    style={{ color: program.cor }}
                                >
                                    Escolher outra data
                                </button>
                            </div>
                        ) : (
                            <div className="grid grid-cols-3 gap-3">
                                {availableSlots.map(slot => (
                                    <button
                                        key={slot.horario}
                                        onClick={() => handleSlotSelect(slot.horario)}
                                        className="p-4 rounded-xl bg-white dark:bg-white/5 border-2 border-card-border dark:border-white/10 hover:border-primary transition-all flex flex-col items-center group"
                                        style={{ '--hover-border': program.cor } as React.CSSProperties}
                                    >
                                        <span className="text-lg font-bold text-[#131616] dark:text-white">{slot.horario}</span>
                                        <span className="text-xs text-text-muted mt-1">
                                            {slot.vagasDisponiveis} vaga{slot.vagasDisponiveis > 1 ? 's' : ''}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Step 3: Confirmation */}
                {step === 'confirm' && (
                    <div className="mt-4">
                        {/* Summary */}
                        <div className="p-5 rounded-2xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10 mb-6">
                            <h3 className="font-bold text-[#131616] dark:text-white mb-4 text-lg">Confirme seu agendamento</h3>

                            {/* Program */}
                            <div className="flex items-center gap-3 pb-4 border-b border-card-border dark:border-white/10">
                                <ProgramIcon program={program} size="sm" />
                                <div>
                                    <p className="font-semibold text-[#131616] dark:text-white">{program.nome}</p>
                                    <p className="text-xs text-text-muted">{program.duracaoMinutos} minutos</p>
                                </div>
                            </div>

                            {/* Date & Time */}
                            <div className="flex items-center gap-4 py-4 border-b border-card-border dark:border-white/10">
                                <div className="flex items-center gap-2 text-[#131616] dark:text-white">
                                    <span className="material-symbols-outlined text-lg" style={{ color: program.cor }}>event</span>
                                    <span className="font-medium">{new Date(selectedDate + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-[#131616] dark:text-white">
                                    <span className="material-symbols-outlined text-lg" style={{ color: program.cor }}>schedule</span>
                                    <span className="font-medium">{selectedSlot}</span>
                                </div>
                            </div>

                            {/* User Info - Read Only */}
                            <div className="pt-4">
                                <p className="text-xs text-text-muted uppercase tracking-wider mb-2">Dados do participante</p>
                                <div className="flex items-center gap-3">
                                    <div className="size-10 rounded-full flex items-center justify-center text-white" style={{ backgroundColor: program.cor }}>
                                        <span className="material-symbols-outlined">person</span>
                                    </div>
                                    <div>
                                        <p className="font-semibold text-[#131616] dark:text-white">{user?.nome}</p>
                                        <p className="text-sm text-text-muted">{user?.email}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Change Selection Button */}
                        <button
                            onClick={() => setStep('slot')}
                            className="w-full py-3 rounded-xl font-semibold text-text-muted bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-all flex items-center justify-center gap-2 mb-3"
                        >
                            <span className="material-symbols-outlined text-lg">edit_calendar</span>
                            Alterar data/horário
                        </button>

                        {/* Submit */}
                        <button
                            onClick={handleSubmit}
                            disabled={submitting}
                            className="w-full py-4 rounded-xl text-white font-bold text-lg shadow-lg transition-all hover:opacity-90 active:scale-[0.98] disabled:opacity-50"
                            style={{ backgroundColor: program.cor }}
                        >
                            {submitting ? 'Agendando...' : 'Confirmar Agendamento'}
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
};

export default BookingScreen;
