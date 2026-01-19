import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Please check your .env.local file.');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Types for database
export interface DbCompany {
  id: string;
  nome: string;
  slug: string;
  logo_url: string | null;
  banner_url: string | null;
  cor_primaria: string;
  cor_secundaria: string;
  dominios_email: string[];
  ativo: boolean;
  criado_em: string;
}

export interface DbProfile {
  id: string;
  nome: string;
  email: string;
  role: 'super_admin' | 'admin' | 'user';
  company_id: string | null;
  criado_em: string;
}

export interface DbProgram {
  id: string;
  nome: string;
  descricao: string;
  categoria: string;
  cor: string;
  icone: string;
  imagem_url: string | null;
  tipo: 'recorrente' | 'periodo';
  dias_semana: number[];
  data_inicio: string | null;
  data_fim: string | null;
  horarios: { hora: string; ativo: boolean }[];
  duracao_minutos: number;
  vagas_por_horario: number;
  alcance_agenda: number;
  limite_por_usuario: number | null;
  limite_por_dia_usuario: number | null;
  ativo: boolean;
  criado_em: string;
  company_id: string;
}

export interface DbBooking {
  id: string;
  programa_id: string;
  usuario_id: string;
  usuario_nome: string;
  usuario_email: string;
  data: string;
  horario: string;
  status: 'confirmado' | 'cancelado';
  criado_em: string;
  company_id: string;
}
