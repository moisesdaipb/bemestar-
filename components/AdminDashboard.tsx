import React, { useState, useEffect } from 'react';
import { Program, Booking, Screen } from '../types';
import { getPrograms, getBookings, deleteProgram, getUpcomingBookingsCount, cancelBooking } from '../storageService';
import { DIAS_SEMANA } from '../constants';
import ProgramIcon from './ProgramIcon';
import * as XLSX from 'xlsx';

interface AdminDashboardProps {
  onNavigate: (screen: Screen, programId?: string) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onNavigate }) => {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [activeTab, setActiveTab] = useState<'programs' | 'bookings'>('programs');
  const [loading, setLoading] = useState(true);

  // Export modal states
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportProgramId, setExportProgramId] = useState<string>('all');
  const [exportDateFrom, setExportDateFrom] = useState<string>('');
  const [exportDateTo, setExportDateTo] = useState<string>('');

  const loadData = async () => {
    try {
      const [programsData, bookingsData, upcoming] = await Promise.all([
        getPrograms(),
        getBookings(),
        getUpcomingBookingsCount()
      ]);
      setPrograms(programsData);
      setBookings(bookingsData.filter(b => b.status === 'confirmado'));
      setUpcomingCount(upcoming);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleDeleteProgram = async (id: string, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir o programa "${nome}"?\n\nTodos os agendamentos relacionados também serão excluídos.`)) {
      await deleteProgram(id);
      await loadData();
    }
  };

  const handleCancelBooking = async (booking: Booking) => {
    const program = programs.find(p => p.id === booking.programaId);
    const dataFormatada = new Date(booking.data + 'T12:00:00').toLocaleDateString('pt-BR');
    if (confirm(`Cancelar agendamento de ${booking.usuarioNome}?\n\nPrograma: ${program?.nome || 'N/A'}\nData: ${dataFormatada}\nHorário: ${booking.horario}`)) {
      await cancelBooking(booking.id);
      await loadData();
    }
  };

  const formatDiasSemana = (dias: number[]): string => {
    if (dias.length === 0) return '';
    if (dias.length === 7) return 'Todos os dias';
    if (dias.length === 5 && !dias.includes(0) && !dias.includes(6)) return 'Seg a Sex';
    return dias.map(d => DIAS_SEMANA.find(ds => ds.value === d)?.label).join(', ');
  };

  const exportToExcel = () => {
    // Filter bookings based on selected options
    let filteredBookings = bookings;

    // Filter by program
    if (exportProgramId !== 'all') {
      filteredBookings = filteredBookings.filter(b => b.programaId === exportProgramId);
    }

    // Filter by date range
    if (exportDateFrom) {
      filteredBookings = filteredBookings.filter(b => b.data >= exportDateFrom);
    }
    if (exportDateTo) {
      filteredBookings = filteredBookings.filter(b => b.data <= exportDateTo);
    }

    if (filteredBookings.length === 0) {
      alert('Não há agendamentos para exportar com os filtros selecionados');
      return;
    }

    // Prepare data for export
    const exportData = filteredBookings.map(booking => {
      const program = programs.find(p => p.id === booking.programaId);
      return {
        'Programa': program?.nome || 'N/A',
        'Participante': booking.usuarioNome,
        'Email': booking.usuarioEmail,
        'Data': new Date(booking.data + 'T12:00:00').toLocaleDateString('pt-BR'),
        'Horário': booking.horario,
        'Status': booking.status === 'confirmado' ? 'Confirmado' : 'Cancelado',
        'Data de Criação': new Date(booking.criadoEm).toLocaleDateString('pt-BR'),
      };
    });

    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(exportData);

    // Set column widths
    ws['!cols'] = [
      { wch: 25 }, // Programa
      { wch: 30 }, // Participante
      { wch: 35 }, // Email
      { wch: 12 }, // Data
      { wch: 10 }, // Horário
      { wch: 12 }, // Status
      { wch: 15 }, // Data de Criação
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Agendamentos');

    // Generate filename with current date
    const today = new Date().toISOString().split('T')[0];
    const programName = exportProgramId === 'all' ? 'todos' : (programs.find(p => p.id === exportProgramId)?.nome || 'programa');
    const filename = `agendamentos_${programName.toLowerCase().replace(/\s+/g, '_')}_${today}.xlsx`;

    // Download file
    XLSX.writeFile(wb, filename);
    setShowExportModal(false);
  };

  const openExportModal = () => {
    // Set default date range (last 30 days to today)
    const today = new Date().toISOString().split('T')[0];
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    setExportDateFrom(thirtyDaysAgo);
    setExportDateTo(today);
    setExportProgramId('all');
    setShowExportModal(true);
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
      <header className="p-4 pt-6 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md sticky top-0 z-40">
        <h1 className="text-2xl font-bold text-[#131616] dark:text-white">Painel Administrativo</h1>
        <p className="text-text-muted text-sm mt-1">Gerencie programas e agendamentos</p>
      </header>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-4 px-5 mt-2">
        <div className="p-4 rounded-2xl bg-primary/10 border border-primary/20">
          <div className="flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined">event_available</span>
            <span className="text-2xl font-bold">{programs.length}</span>
          </div>
          <p className="text-sm text-text-muted mt-1">Programas</p>
        </div>
        <div className="p-4 rounded-2xl bg-blue-600/10 border border-blue-600/20">
          <div className="flex items-center gap-2 text-blue-600">
            <span className="material-symbols-outlined">calendar_month</span>
            <span className="text-2xl font-bold">{upcomingCount}</span>
          </div>
          <p className="text-sm text-text-muted mt-1">Agendamentos</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="px-5 mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => onNavigate(Screen.COMPANY_SETTINGS)}
          className="p-4 rounded-2xl bg-gradient-to-r from-purple-500 to-pink-500 text-white flex flex-col items-center gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">palette</span>
          </div>
          <div className="text-center">
            <p className="font-bold text-sm">Identidade Visual</p>
            <p className="text-xs text-white/70">Cores e banner</p>
          </div>
        </button>
        <button
          onClick={openExportModal}
          className="p-4 rounded-2xl bg-gradient-to-r from-green-500 to-emerald-500 text-white flex flex-col items-center gap-2 shadow-lg hover:shadow-xl transition-all"
        >
          <div className="size-12 rounded-xl bg-white/20 flex items-center justify-center">
            <span className="material-symbols-outlined text-2xl">download</span>
          </div>
          <div className="text-center">
            <p className="font-bold text-sm">Exportar Excel</p>
            <p className="text-xs text-white/70">Baixar agendamentos</p>
          </div>
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-5 mt-6">
        <button
          onClick={() => setActiveTab('programs')}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all ${activeTab === 'programs' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}
        >
          Programas
        </button>
        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 py-3 rounded-xl font-semibold transition-all ${activeTab === 'bookings' ? 'bg-primary text-white' : 'bg-gray-100 dark:bg-white/10 text-gray-600 dark:text-gray-300'}`}
        >
          Agendamentos
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-5 pb-24 mt-4">
        {activeTab === 'programs' && (
          <>
            {/* New Program Button */}
            <button
              onClick={() => onNavigate(Screen.ADMIN_PROGRAM_FORM)}
              className="w-full p-4 rounded-2xl border-2 border-dashed border-primary/50 bg-primary/5 flex items-center justify-center gap-2 text-primary font-semibold hover:bg-primary/10 transition-colors mb-4"
            >
              <span className="material-symbols-outlined">add_circle</span>
              Criar Novo Programa
            </button>

            {/* Programs List */}
            {programs.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">event_busy</span>
                <p className="text-text-muted mt-4">Nenhum programa criado ainda</p>
                <p className="text-sm text-text-muted mt-1">Clique no botão acima para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {programs.map(program => (
                  <div
                    key={program.id}
                    className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10"
                  >
                    <div className="flex items-start gap-3">
                      <ProgramIcon program={program} size="md" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-[#131616] dark:text-white truncate">{program.nome}</h3>
                          {!program.ativo && (
                            <span className="px-2 py-0.5 rounded-full bg-gray-200 dark:bg-gray-700 text-xs text-gray-600 dark:text-gray-300">
                              Inativo
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-text-muted mt-0.5">
                          {program.tipo === 'recorrente'
                            ? formatDiasSemana(program.diasSemana)
                            : `${new Date(program.dataInicio!).toLocaleDateString('pt-BR')} - ${new Date(program.dataFim!).toLocaleDateString('pt-BR')}`
                          }
                        </p>
                        <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">schedule</span>
                            {program.horarios.length} horários
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">group</span>
                            {program.vagasPorHorario} vaga{program.vagasPorHorario > 1 ? 's' : ''}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[14px]">timer</span>
                            {program.duracaoMinutos}min
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 mt-4 pt-3 border-t border-card-border dark:border-white/10">
                      <button
                        onClick={() => onNavigate(Screen.ADMIN_PROGRAM_FORM, program.id)}
                        className="flex-1 py-2 rounded-xl bg-gray-100 dark:bg-white/10 text-gray-700 dark:text-gray-300 font-medium text-sm hover:bg-gray-200 dark:hover:bg-white/20 transition-colors flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">edit</span>
                        Editar
                      </button>
                      <button
                        onClick={() => handleDeleteProgram(program.id, program.nome)}
                        className="py-2 px-4 rounded-xl bg-red-500/10 text-red-500 font-medium text-sm hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1"
                      >
                        <span className="material-symbols-outlined text-[18px]">delete</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {activeTab === 'bookings' && (
          <>
            {bookings.length === 0 ? (
              <div className="text-center py-12">
                <span className="material-symbols-outlined text-6xl text-gray-300 dark:text-gray-600">event</span>
                <p className="text-text-muted mt-4">Nenhum agendamento ainda</p>
              </div>
            ) : (
              <div className="space-y-3">
                {bookings
                  .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
                  .map(booking => {
                    const program = programs.find(p => p.id === booking.programaId);
                    return (
                      <div
                        key={booking.id}
                        className="p-4 rounded-2xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10"
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="size-10 rounded-lg flex items-center justify-center text-white shrink-0"
                            style={{ backgroundColor: program?.cor || '#666' }}
                          >
                            <span className="material-symbols-outlined text-[20px]">{program?.icone || 'event'}</span>
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-[#131616] dark:text-white">{booking.usuarioNome}</p>
                            <p className="text-xs text-text-muted">{booking.usuarioEmail}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-4 mt-3 text-sm text-text-muted">
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">event</span>
                            {new Date(booking.data + 'T12:00:00').toLocaleDateString('pt-BR')}
                          </span>
                          <span className="flex items-center gap-1">
                            <span className="material-symbols-outlined text-[16px]">schedule</span>
                            {booking.horario}
                          </span>
                          <span className="flex items-center gap-1 text-primary font-medium">
                            {program?.nome || 'Programa'}
                          </span>
                        </div>

                        {/* Botão Cancelar */}
                        <div className="mt-3 pt-3 border-t border-card-border dark:border-white/10">
                          <button
                            onClick={() => handleCancelBooking(booking)}
                            className="w-full py-2 rounded-xl bg-red-500/10 text-red-500 font-medium text-sm hover:bg-red-500/20 transition-colors flex items-center justify-center gap-1"
                          >
                            <span className="material-symbols-outlined text-[18px]">cancel</span>
                            Cancelar Agendamento
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-2xl w-full max-w-md shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between p-5 border-b border-card-border dark:border-white/10">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-green-500/10 flex items-center justify-center">
                  <span className="material-symbols-outlined text-green-500">download</span>
                </div>
                <h2 className="text-lg font-bold text-[#131616] dark:text-white">Exportar Agendamentos</h2>
              </div>
              <button
                onClick={() => setShowExportModal(false)}
                className="size-8 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 flex items-center justify-center transition-colors"
              >
                <span className="material-symbols-outlined text-text-muted">close</span>
              </button>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {/* Program Filter */}
              <div>
                <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                  Programa
                </label>
                <select
                  value={exportProgramId}
                  onChange={e => setExportProgramId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                >
                  <option value="all">Todos os programas</option>
                  {programs.map(p => (
                    <option key={p.id} value={p.id}>{p.nome}</option>
                  ))}
                </select>
              </div>

              {/* Date Range */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                    Data Inicial
                  </label>
                  <input
                    type="date"
                    value={exportDateFrom}
                    onChange={e => setExportDateFrom(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#131616] dark:text-white mb-2">
                    Data Final
                  </label>
                  <input
                    type="date"
                    value={exportDateTo}
                    onChange={e => setExportDateTo(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl border border-card-border dark:border-white/10 bg-white dark:bg-white/5 text-[#131616] dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none"
                  />
                </div>
              </div>

              {/* Quick Date Buttons */}
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    setExportDateFrom(weekAgo);
                    setExportDateTo(today);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-white/10 text-text-muted hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                  Últimos 7 dias
                </button>
                <button
                  onClick={() => {
                    const today = new Date().toISOString().split('T')[0];
                    const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
                    setExportDateFrom(monthAgo);
                    setExportDateTo(today);
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-white/10 text-text-muted hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                  Últimos 30 dias
                </button>
                <button
                  onClick={() => {
                    setExportDateFrom('');
                    setExportDateTo('');
                  }}
                  className="px-3 py-1.5 rounded-lg text-xs font-medium bg-gray-100 dark:bg-white/10 text-text-muted hover:bg-gray-200 dark:hover:bg-white/20 transition-colors"
                >
                  Todos
                </button>
              </div>
            </div>

            {/* Footer */}
            <div className="p-5 border-t border-card-border dark:border-white/10 flex gap-3">
              <button
                onClick={() => setShowExportModal(false)}
                className="flex-1 py-3 rounded-xl font-semibold text-text-muted bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 transition-all"
              >
                Cancelar
              </button>
              <button
                onClick={exportToExcel}
                className="flex-1 py-3 rounded-xl font-semibold text-white bg-green-500 hover:bg-green-600 transition-all flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-lg">download</span>
                Exportar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
