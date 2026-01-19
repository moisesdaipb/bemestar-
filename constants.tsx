// Cores disponíveis para programas
export const PROGRAM_COLORS = [
  { name: 'Verde', value: '#16a34a' },
  { name: 'Azul', value: '#2563eb' },
  { name: 'Roxo', value: '#7c3aed' },
  { name: 'Rosa', value: '#db2777' },
  { name: 'Laranja', value: '#ea580c' },
  { name: 'Amarelo', value: '#ca8a04' },
  { name: 'Ciano', value: '#0891b2' },
  { name: 'Vermelho', value: '#dc2626' },
];

// Ícones disponíveis para programas
export const PROGRAM_ICONS = [
  { name: 'Spa', value: 'spa' },
  { name: 'Saúde', value: 'health_and_safety' },
  { name: 'Fitness', value: 'fitness_center' },
  { name: 'Meditação', value: 'self_improvement' },
  { name: 'Nutrição', value: 'restaurant' },
  { name: 'Financeiro', value: 'account_balance_wallet' },
  { name: 'Jurídico', value: 'gavel' },
  { name: 'Educação', value: 'school' },
  { name: 'Psicologia', value: 'psychology' },
  { name: 'Médico', value: 'medical_services' },
  { name: 'Evento', value: 'event' },
  { name: 'Grupo', value: 'groups' },
];

// Dias da semana
export const DIAS_SEMANA = [
  { value: 0, label: 'Dom', fullLabel: 'Domingo' },
  { value: 1, label: 'Seg', fullLabel: 'Segunda' },
  { value: 2, label: 'Ter', fullLabel: 'Terça' },
  { value: 3, label: 'Qua', fullLabel: 'Quarta' },
  { value: 4, label: 'Qui', fullLabel: 'Quinta' },
  { value: 5, label: 'Sex', fullLabel: 'Sexta' },
  { value: 6, label: 'Sáb', fullLabel: 'Sábado' },
];

// Horários padrão sugeridos
export const HORARIOS_SUGERIDOS = [
  '08:00', '09:00', '10:00', '11:00',
  '13:00', '14:00', '15:00', '16:00', '17:00',
];

// Durações de sessão sugeridas
export const DURACOES_SESSAO = [
  { value: 15, label: '15 minutos' },
  { value: 30, label: '30 minutos' },
  { value: 45, label: '45 minutos' },
  { value: 60, label: '1 hora' },
  { value: 90, label: '1h30' },
  { value: 120, label: '2 horas' },
];

// Alcance da agenda (quantos dias no futuro podem agendar)
export const ALCANCE_AGENDA = [
  { value: 7, label: '1 semana', description: 'Próximos 7 dias' },
  { value: 14, label: '2 semanas', description: 'Próximos 14 dias' },
  { value: 30, label: '1 mês', description: 'Próximos 30 dias' },
  { value: 180, label: '6 meses', description: 'Próximos 180 dias' },
];
