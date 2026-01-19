import React, { useState, useEffect } from 'react';
import { Screen, Program } from '../types';
import { getActivePrograms } from '../storageService';
import { DIAS_SEMANA } from '../constants';
import { useAuth } from '../AuthContext';
import ProgramIcon from './ProgramIcon';

interface HomeProps {
  onOpenSidebar: () => void;
  onNavigate: (screen: Screen, programId?: string) => void;
}

const Home: React.FC<HomeProps> = ({ onOpenSidebar, onNavigate }) => {
  const { user } = useAuth();
  const [programs, setPrograms] = useState<Program[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadPrograms = async () => {
      try {
        const data = await getActivePrograms();
        setPrograms(data);
      } catch (error) {
        console.error('Error loading programs:', error);
      } finally {
        setLoading(false);
      }
    };
    loadPrograms();
  }, []);

  const formatDiasSemana = (dias: number[]): string => {
    if (dias.length === 0) return '';
    if (dias.length === 7) return 'Todos os dias';
    if (dias.length === 5 && !dias.includes(0) && !dias.includes(6)) return 'Seg a Sex';
    if (dias.length === 2 && dias.includes(0) && dias.includes(6)) return 'Fim de semana';
    return dias.map(d => DIAS_SEMANA.find(ds => ds.value === d)?.label).join(', ');
  };

  // Get greeting based on time of day
  const getGreeting = (): string => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Bom dia';
    if (hour < 18) return 'Boa tarde';
    return 'Boa noite';
  };

  // Get company colors
  const primaryColor = user?.company?.corPrimaria || '#22c55e';
  const secondaryColor = user?.company?.corSecundaria || '#0d9488';
  const bannerUrl = user?.company?.bannerUrl;
  const companyName = user?.company?.nome || 'BemEstar+';

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-primary/5 via-background-light to-blue-50 dark:from-primary/10 dark:via-background-dark dark:to-blue-900/10">
        <div className="text-center">
          <div
            className="size-16 rounded-2xl flex items-center justify-center text-white mx-auto mb-4 shadow-xl"
            style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}99)` }}
          >
            <span className="material-symbols-outlined animate-spin text-3xl">progress_activity</span>
          </div>
          <p className="text-text-muted font-medium">Carregando programas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-gradient-to-br from-primary/5 via-background-light to-blue-50 dark:from-primary/10 dark:via-background-dark dark:to-blue-900/10">
      {/* Header com gradiente ou banner */}
      <header className="relative overflow-hidden">
        {/* Background */}
        {bannerUrl ? (
          <>
            <div className="absolute inset-0">
              <img
                src={bannerUrl}
                alt="Banner"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/70"></div>
            </div>
          </>
        ) : (
          <>
            <div
              className="absolute inset-0"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${secondaryColor})` }}
            ></div>
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 right-0 size-32 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2"></div>
              <div className="absolute bottom-0 left-0 size-24 bg-white/10 rounded-full translate-y-1/2 -translate-x-1/2"></div>
            </div>
          </>
        )}

        <div className="relative p-5 pt-8 pb-8">
          <div className="flex items-center gap-3 mb-4">
            <button
              onClick={onOpenSidebar}
              className="size-10 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors text-white backdrop-blur-sm"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <div className="flex-1">
              <p className="text-white/70 text-sm">{getGreeting()},</p>
              <h1 className="text-2xl font-bold text-white">{user?.nome?.split(' ')[0] || 'Usuário'}</h1>
            </div>
            <button
              onClick={() => onNavigate(Screen.MY_BOOKINGS)}
              className="size-10 rounded-full flex items-center justify-center bg-white/20 hover:bg-white/30 transition-colors text-white backdrop-blur-sm"
            >
              <span className="material-symbols-outlined">calendar_month</span>
            </button>
          </div>

          {/* Company Name */}
          <div className="mt-4">
            <p className="text-white/60 text-xs uppercase tracking-wider">Bem-vindo ao</p>
            <h2 className="text-xl font-bold text-white">{companyName}</h2>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="flex-1 px-5 pb-24 pt-4">
        {/* Quick Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => onNavigate(Screen.MY_BOOKINGS)}
            className="flex-1 p-4 rounded-2xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10 shadow-sm hover:shadow-md transition-all flex items-center gap-3"
          >
            <div
              className="size-12 rounded-xl flex items-center justify-center text-white shadow-md"
              style={{ background: `linear-gradient(135deg, ${primaryColor}, ${primaryColor}99)` }}
            >
              <span className="material-symbols-outlined">event_available</span>
            </div>
            <div className="text-left">
              <p className="font-semibold text-[#131616] dark:text-white">Meus Agendamentos</p>
              <p className="text-xs text-text-muted">Ver minha agenda</p>
            </div>
          </button>
        </div>

        {/* Programs Section Title */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold text-[#131616] dark:text-white flex items-center gap-2">
            <span className="material-symbols-outlined" style={{ color: primaryColor }}>local_activity</span>
            Programas Disponíveis
          </h2>
          <span className="text-sm text-text-muted">{programs.length} disponíveis</span>
        </div>

        {programs.length === 0 ? (
          <div className="text-center py-16">
            <div
              className="size-24 rounded-3xl flex items-center justify-center mx-auto mb-6"
              style={{ background: `${primaryColor}20` }}
            >
              <span className="material-symbols-outlined text-5xl" style={{ color: `${primaryColor}80` }}>spa</span>
            </div>
            <h3 className="text-xl font-bold text-[#131616] dark:text-white mb-2">Nenhum programa disponível</h3>
            <p className="text-text-muted max-w-xs mx-auto">
              Aguarde a criação de novos programas de bem-estar pelo administrador
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {programs.map(program => (
              <button
                key={program.id}
                onClick={() => onNavigate(Screen.PROGRAM_DETAILS, program.id)}
                className="w-full p-5 rounded-2xl bg-white dark:bg-white/5 border border-card-border dark:border-white/10 text-left shadow-sm hover:shadow-lg transition-all group"
              >
                <div className="flex items-start gap-4">
                  <ProgramIcon program={program} size="lg" className="group-hover:scale-105 transition-transform shadow-md" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-[#131616] dark:text-white text-lg">{program.nome}</h3>
                      <span className="material-symbols-outlined text-gray-400 dark:text-gray-500 group-hover:translate-x-1 transition-transform shrink-0">
                        chevron_right
                      </span>
                    </div>
                    {program.categoria && (
                      <span
                        className="inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider mt-1.5"
                        style={{ backgroundColor: `${program.cor}20`, color: program.cor }}
                      >
                        {program.categoria}
                      </span>
                    )}
                    {program.descricao && (
                      <p className="text-text-muted text-sm mt-2 line-clamp-2">{program.descricao}</p>
                    )}
                    <div className="flex items-center gap-4 mt-3 text-xs text-text-muted">
                      <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg">
                        <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                        {program.tipo === 'recorrente'
                          ? formatDiasSemana(program.diasSemana)
                          : `${new Date(program.dataInicio!).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })} - ${new Date(program.dataFim!).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' })}`
                        }
                      </span>
                      <span className="flex items-center gap-1.5 bg-gray-100 dark:bg-white/5 px-2 py-1 rounded-lg">
                        <span className="material-symbols-outlined text-[14px]">schedule</span>
                        {program.duracaoMinutos}min
                      </span>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

export default Home;
