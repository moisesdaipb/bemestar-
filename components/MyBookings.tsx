import React, { useState, useEffect } from 'react';
import { Booking, Program } from '../types';
import { getBookingsByUserId, cancelBooking, getProgramById } from '../storageService';
import { useAuth } from '../AuthContext';

interface MyBookingsProps {
    onBack: () => void;
}

const MyBookings: React.FC<MyBookingsProps> = ({ onBack }) => {
    const { user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [programs, setPrograms] = useState<Map<string, Program>>(new Map());
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'history'>('upcoming');

    const loadBookings = async () => {
        if (!user) return;

        try {
            const found = await getBookingsByUserId(user.id);
            setBookings(found);

            // Load programs for bookings
            const programMap = new Map<string, Program>();
            for (const b of found) {
                if (!programMap.has(b.programaId)) {
                    const p = await getProgramById(b.programaId);
                    if (p) programMap.set(b.programaId, p);
                }
            }
            setPrograms(programMap);
        } catch (error) {
            console.error('Error loading bookings:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBookings();
    }, [user]);

    const handleCancel = async (bookingId: string) => {
        if (confirm('Tem certeza que deseja cancelar este agendamento?')) {
            await cancelBooking(bookingId);
            await loadBookings();
        }
    };

    const today = new Date().toISOString().split('T')[0];
    const activeBookings = bookings.filter(b => b.status === 'confirmado' && b.data >= today);
    const pastBookings = bookings.filter(b => b.status !== 'confirmado' || b.data < today);
    const completedBookings = pastBookings.filter(b => b.status === 'confirmado' && b.data < today);
    const cancelledBookings = bookings.filter(b => b.status === 'cancelado');

    // Calculate days until next booking
    const getDaysUntil = (dateStr: string): number => {
        const target = new Date(dateStr + 'T12:00:00');
        const now = new Date();
        const diff = target.getTime() - now.getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const nextBooking = activeBookings[0];
    const daysUntilNext = nextBooking ? getDaysUntil(nextBooking.data) : null;

    // Get company colors
    const primaryColor = user?.company?.corPrimaria || '#22c55e';
    const secondaryColor = user?.company?.corSecundaria || '#0d9488';

    if (loading) {
        return (
            <div className="flex-1 flex items-center justify-center bg-background-light dark:bg-background-dark">
                <div className="text-center">
                    <div className="size-16 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center text-white mx-auto mb-4 shadow-xl">
                        <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
                    </div>
                    <p className="text-text-muted font-medium">Carregando sua agenda...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col bg-gradient-to-br from-primary/5 via-background-light to-blue-50 dark:from-primary/10 dark:via-background-dark dark:to-blue-900/10">
            {/* Header com gradiente */}
            <header className="relative overflow-hidden">
                <div
                    className="absolute inset-0"
                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                ></div>
                <div className="absolute inset-0 opacity-20">
                    <div className="absolute top-0 right-0 size-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 size-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
                </div>

                <div className="relative p-5 pt-8 pb-6">
                    <div className="flex items-center gap-3 mb-6">
                        <button
                            onClick={onBack}
                            className="size-10 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors text-white"
                        >
                            <span className="material-symbols-outlined">arrow_back</span>
                        </button>
                        <div className="flex-1">
                            <h1 className="text-2xl font-bold text-white">Minha Agenda</h1>
                            <p className="text-white/70 text-sm">Seus agendamentos de bem-estar</p>
                        </div>
                    </div>

                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
                            <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-2">
                                <span className="material-symbols-outlined text-white">event_available</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{activeBookings.length}</p>
                            <p className="text-xs text-white/70 mt-1">Próximos</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
                            <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-2">
                                <span className="material-symbols-outlined text-white">check_circle</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{completedBookings.length}</p>
                            <p className="text-xs text-white/70 mt-1">Realizados</p>
                        </div>
                        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-4 text-center border border-white/10">
                            <div className="size-10 rounded-xl bg-white/20 flex items-center justify-center mx-auto mb-2">
                                <span className="material-symbols-outlined text-white">calendar_month</span>
                            </div>
                            <p className="text-3xl font-bold text-white">{bookings.length}</p>
                            <p className="text-xs text-white/70 mt-1">Total</p>
                        </div>
                    </div>
                </div>
            </header>

            {/* Content */}
            <div className="flex-1 overflow-auto px-5 pb-24 pt-4">
                {/* Next Booking Highlight */}
                {
                    nextBooking && (
                        <div className="mb-5">
                            <div className="bg-white dark:bg-white/10 rounded-3xl shadow-xl border border-card-border dark:border-white/10 overflow-hidden">
                                <div
                                    className="px-5 py-3"
                                    style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
                                >
                                    <div className="flex items-center gap-2 text-white">
                                        <span className="material-symbols-outlined text-lg">upcoming</span>
                                        <span className="font-semibold text-sm">Próximo Agendamento</span>
                                        {daysUntilNext !== null && (
                                            <span className="ml-auto bg-white/20 px-2 py-0.5 rounded-full text-xs font-medium">
                                                {daysUntilNext === 0 ? 'Hoje' : daysUntilNext === 1 ? 'Amanhã' : `Em ${daysUntilNext} dias`}
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="p-5">
                                    <div className="flex items-center gap-4">
                                        <div
                                            className="size-16 rounded-2xl flex items-center justify-center text-white shadow-lg"
                                            style={{ backgroundColor: programs.get(nextBooking.programaId)?.cor || primaryColor }}
                                        >
                                            <span className="material-symbols-outlined text-3xl">
                                                {programs.get(nextBooking.programaId)?.icone || 'spa'}
                                            </span>
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-lg font-bold text-[#131616] dark:text-white">
                                                {programs.get(nextBooking.programaId)?.nome || 'Programa'}
                                            </h3>
                                            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-2 text-text-muted">
                                                <span className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-lg text-primary">calendar_today</span>
                                                    <span className="font-medium">
                                                        {new Date(nextBooking.data + 'T12:00:00').toLocaleDateString('pt-BR', {
                                                            weekday: 'long',
                                                            day: 'numeric',
                                                            month: 'long'
                                                        })}
                                                    </span>
                                                </span>
                                                <span className="flex items-center gap-1.5">
                                                    <span className="material-symbols-outlined text-lg text-primary">schedule</span>
                                                    <span className="font-medium">{nextBooking.horario}</span>
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleCancel(nextBooking.id)}
                                        className="w-full mt-4 py-3 rounded-xl border-2 border-red-200 dark:border-red-500/30 text-red-500 font-semibold hover:bg-red-50 dark:hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                                    >
                                        <span className="material-symbols-outlined text-lg">event_busy</span>
                                        Cancelar Agendamento
                                    </button>
                                </div>
                            </div>
                        </div>
                    )
                }

                {/* Tabs */}
                {
                    bookings.length > 0 && (
                        <div className="flex gap-2 mb-5">
                            <button
                                onClick={() => setActiveTab('upcoming')}
                                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'upcoming'
                                    ? 'text-white shadow-lg'
                                    : 'bg-white dark:bg-white/5 text-text-muted border border-card-border dark:border-white/10'
                                    }`}
                                style={activeTab === 'upcoming' ? { backgroundColor: primaryColor } : undefined}
                            >
                                <span className="material-symbols-outlined text-lg">event_available</span>
                                Próximos ({activeBookings.length})
                            </button>
                            <button
                                onClick={() => setActiveTab('history')}
                                className={`flex-1 py-3 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${activeTab === 'history'
                                    ? 'text-white shadow-lg'
                                    : 'bg-white dark:bg-white/5 text-text-muted border border-card-border dark:border-white/10'
                                    }`}
                                style={activeTab === 'history' ? { backgroundColor: primaryColor } : undefined}
                            >
                                <span className="material-symbols-outlined text-lg">history</span>
                                Histórico ({pastBookings.length})
                            </button>
                        </div>
                    )
                }

                {/* Empty State */}
                {
                    bookings.length === 0 && (
                        <div className="text-center py-16">
                            <div className="size-24 rounded-3xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto mb-6">
                                <span className="material-symbols-outlined text-5xl text-primary/50">calendar_month</span>
                            </div>
                            <h3 className="text-xl font-bold text-[#131616] dark:text-white mb-2">Nenhum agendamento</h3>
                            <p className="text-text-muted max-w-xs mx-auto">
                                Explore os programas de bem-estar disponíveis e faça sua primeira reserva!
                            </p>
                            <button
                                onClick={onBack}
                                className="mt-6 px-6 py-3 rounded-xl bg-primary text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                            >
                                Explorar Programas
                            </button>
                        </div>
                    )
                }

                {/* Upcoming Bookings List */}
                {
                    activeTab === 'upcoming' && activeBookings.length > 1 && (
                        <div className="space-y-3">
                            <h3 className="text-sm font-semibold text-text-muted uppercase tracking-wider flex items-center gap-2">
                                <span className="material-symbols-outlined text-lg">event</span>
                                Outros Agendamentos
                            </h3>
                            {activeBookings.slice(1).map(booking => {
                                const program = programs.get(booking.programaId);
                                const days = getDaysUntil(booking.data);
                                return (
                                    <div
                                        key={booking.id}
                                        className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10 shadow-sm hover:shadow-md transition-all"
                                    >
                                        <div className="flex items-center gap-4">
                                            <div
                                                className="size-14 rounded-xl flex items-center justify-center text-white shadow-md"
                                                style={{ backgroundColor: program?.cor || '#666' }}
                                            >
                                                <span className="material-symbols-outlined text-2xl">{program?.icone || 'event'}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-bold text-[#131616] dark:text-white truncate">{program?.nome || 'Programa'}</h4>
                                                <div className="flex items-center gap-3 mt-1 text-sm text-text-muted">
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[16px]">event</span>
                                                        {new Date(booking.data + 'T12:00:00').toLocaleDateString('pt-BR', { weekday: 'short', day: 'numeric', month: 'short' })}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <span className="material-symbols-outlined text-[16px]">schedule</span>
                                                        {booking.horario}
                                                    </span>
                                                </div>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                                                    {days === 0 ? 'Hoje' : days === 1 ? 'Amanhã' : `${days} dias`}
                                                </span>
                                            </div>
                                        </div>
                                        <button
                                            onClick={() => handleCancel(booking.id)}
                                            className="w-full mt-3 py-2 rounded-xl text-red-500 font-medium text-sm hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <span className="material-symbols-outlined text-[16px]">close</span>
                                            Cancelar
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    )
                }

                {/* History List */}
                {
                    activeTab === 'history' && pastBookings.length > 0 && (
                        <div className="space-y-3">
                            {pastBookings.map(booking => {
                                const program = programs.get(booking.programaId);
                                const isCancelled = booking.status === 'cancelado';
                                return (
                                    <div
                                        key={booking.id}
                                        className={`p-4 rounded-2xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10 ${isCancelled ? 'opacity-60' : ''}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`size-12 rounded-xl flex items-center justify-center text-white ${isCancelled ? 'grayscale' : ''}`}
                                                style={{ backgroundColor: program?.cor || '#666' }}
                                            >
                                                <span className="material-symbols-outlined text-xl">{program?.icone || 'event'}</span>
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h4 className="font-semibold text-[#131616] dark:text-white truncate">{program?.nome || 'Programa'}</h4>
                                                <p className="text-sm text-text-muted">
                                                    {new Date(booking.data + 'T12:00:00').toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', year: 'numeric' })} às {booking.horario}
                                                </p>
                                            </div>
                                            <div className="shrink-0">
                                                {isCancelled ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-red-100 dark:bg-red-500/20 text-red-600 dark:text-red-400 text-xs font-medium">
                                                        <span className="material-symbols-outlined text-[14px]">cancel</span>
                                                        Cancelado
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 dark:bg-green-500/20 text-green-600 dark:text-green-400 text-xs font-medium">
                                                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                                                        Realizado
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )
                }

                {/* No upcoming bookings message */}
                {
                    activeTab === 'upcoming' && activeBookings.length === 0 && bookings.length > 0 && (
                        <div className="text-center py-12">
                            <div className="size-20 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-4xl text-gray-400">event_busy</span>
                            </div>
                            <h3 className="font-bold text-[#131616] dark:text-white mb-2">Nenhum agendamento próximo</h3>
                            <p className="text-sm text-text-muted">Que tal agendar uma nova sessão de bem-estar?</p>
                            <button
                                onClick={onBack}
                                className="mt-4 px-5 py-2 rounded-xl bg-primary text-white font-semibold text-sm"
                            >
                                Ver Programas
                            </button>
                        </div>
                    )
                }

                {/* No history message */}
                {
                    activeTab === 'history' && pastBookings.length === 0 && bookings.length > 0 && (
                        <div className="text-center py-12">
                            <div className="size-20 rounded-2xl bg-gray-100 dark:bg-white/5 flex items-center justify-center mx-auto mb-4">
                                <span className="material-symbols-outlined text-4xl text-gray-400">history</span>
                            </div>
                            <h3 className="font-bold text-[#131616] dark:text-white mb-2">Sem histórico ainda</h3>
                            <p className="text-sm text-text-muted">Seus agendamentos realizados aparecerão aqui</p>
                        </div>
                    )
                }
            </div >
        </div >
    );
};

export default MyBookings;
