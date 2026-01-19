// Enums
export enum Screen {
  LOGIN = 'LOGIN',
  REGISTER = 'REGISTER',
  EMAIL_VERIFY = 'EMAIL_VERIFY',
  COMPLETE_PROFILE = 'COMPLETE_PROFILE',
  SELECT_COMPANY = 'SELECT_COMPANY',
  HOME = 'HOME',
  PROGRAM_DETAILS = 'PROGRAM_DETAILS',
  BOOKING = 'BOOKING',
  CONFIRMATION = 'CONFIRMATION',
  MY_BOOKINGS = 'MY_BOOKINGS',
  ADMIN = 'ADMIN',
  ADMIN_PROGRAM_FORM = 'ADMIN_PROGRAM_FORM',
  ADMIN_BOOKINGS = 'ADMIN_BOOKINGS',
  ADMIN_USERS = 'ADMIN_USERS',
  CREATE_USER = 'CREATE_USER',
  COMPANY_SETTINGS = 'COMPANY_SETTINGS',
  SUPER_ADMIN = 'SUPER_ADMIN',
  SUPER_ADMIN_COMPANIES = 'SUPER_ADMIN_COMPANIES',
  SUPER_ADMIN_COMPANY_FORM = 'SUPER_ADMIN_COMPANY_FORM',
  RESET_PASSWORD = 'RESET_PASSWORD',
}

export type UserRole = 'super_admin' | 'admin' | 'user';

export interface Company {
  id: string;
  nome: string;
  slug: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  corPrimaria: string;
  corSecundaria: string;
  dominiosEmail: string[];
  ativo: boolean;
  criadoEm: string;
}

export interface AuthUser {
  id: string;
  nome: string;
  email: string;
  role: UserRole;
  companyId: string | null;
  company?: Company | null;
}

export type ProgramType = 'recorrente' | 'periodo';
export type BookingStatus = 'confirmado' | 'cancelado';
export type BookingRange = 7 | 14 | 30 | 180; // dias: 1 semana, 2 semanas, 1 mês, 6 meses

// Interfaces
export interface TimeSlot {
  hora: string; // HH:mm format
  ativo: boolean;
}

export interface Program {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  cor: string; // hex color
  icone: string; // material icon name OR 'custom' if using image
  imagemUrl: string | null; // custom image URL (base64 or external)
  tipo: ProgramType;
  diasSemana: number[]; // 0-6 (domingo-sábado) - para tipo recorrente
  dataInicio: string | null; // ISO date - para tipo periodo
  dataFim: string | null; // ISO date - para tipo periodo
  horarios: TimeSlot[];
  duracaoMinutos: number;
  vagasPorHorario: number;
  alcanceAgenda: BookingRange; // quantos dias no futuro pode agendar
  limitePorUsuario: number | null; // max active bookings per user (null = unlimited)
  limitePorDiaUsuario: number | null; // max bookings per day per user (null = unlimited)
  ativo: boolean;
  criadoEm: string; // ISO datetime
  companyId: string; // empresa dona do programa
}

export interface Booking {
  id: string;
  programaId: string;
  usuarioId: string;
  usuarioNome: string;
  usuarioEmail: string;
  data: string; // ISO date
  horario: string; // HH:mm
  status: BookingStatus;
  criadoEm: string; // ISO datetime
  companyId: string; // empresa do booking
}

export interface User {
  nome: string;
  email: string;
}

// Helper type for available slots
export interface AvailableSlot {
  horario: string;
  vagasDisponiveis: number;
  vagasTotal: number;
}
