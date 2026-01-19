import { supabase, DbProgram, DbBooking } from './supabaseClient';
import { Program, Booking, AvailableSlot, TimeSlot } from './types';

// ==================== HELPER FUNCTIONS ====================

// Convert database program to frontend Program type
const dbToProgram = (db: DbProgram): Program => ({
    id: db.id,
    nome: db.nome,
    descricao: db.descricao,
    categoria: db.categoria,
    cor: db.cor,
    icone: db.icone,
    imagemUrl: db.imagem_url,
    tipo: db.tipo,
    diasSemana: db.dias_semana,
    dataInicio: db.data_inicio,
    dataFim: db.data_fim,
    horarios: db.horarios as TimeSlot[],
    duracaoMinutos: db.duracao_minutos,
    vagasPorHorario: db.vagas_por_horario,
    alcanceAgenda: db.alcance_agenda as 7 | 14 | 30 | 180,
    limitePorUsuario: db.limite_por_usuario,
    limitePorDiaUsuario: db.limite_por_dia_usuario,
    ativo: db.ativo,
    criadoEm: db.criado_em,
    companyId: db.company_id,
});

// Convert frontend Program to database format
const programToDb = (program: Omit<Program, 'id' | 'criadoEm'>, companyId: string): Omit<DbProgram, 'id' | 'criado_em'> => ({
    nome: program.nome,
    descricao: program.descricao,
    categoria: program.categoria,
    cor: program.cor,
    icone: program.icone,
    imagem_url: program.imagemUrl,
    tipo: program.tipo,
    dias_semana: program.diasSemana,
    data_inicio: program.dataInicio,
    data_fim: program.dataFim,
    horarios: program.horarios,
    duracao_minutos: program.duracaoMinutos,
    vagas_por_horario: program.vagasPorHorario,
    alcance_agenda: program.alcanceAgenda,
    limite_por_usuario: program.limitePorUsuario,
    limite_por_dia_usuario: program.limitePorDiaUsuario,
    ativo: program.ativo,
    company_id: companyId,
});

// Convert database booking to frontend Booking type
const dbToBooking = (db: DbBooking): Booking => ({
    id: db.id,
    programaId: db.programa_id,
    usuarioId: db.usuario_id,
    usuarioNome: db.usuario_nome,
    usuarioEmail: db.usuario_email,
    data: db.data,
    horario: db.horario,
    status: db.status,
    criadoEm: db.criado_em,
    companyId: db.company_id,
});

// ==================== PROGRAMS ====================

// Get programs - RLS will automatically filter by company
export const getPrograms = async (): Promise<Program[]> => {
    const { data, error } = await supabase
        .from('programs')
        .select('*')
        .order('criado_em', { ascending: false });

    if (error) {
        console.error('Error fetching programs:', error);
        return [];
    }

    return (data || []).map(dbToProgram);
};

// Get active programs for the user's company
export const getActivePrograms = async (): Promise<Program[]> => {
    const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('ativo', true)
        .order('criado_em', { ascending: false });

    if (error) {
        console.error('Error fetching active programs:', error);
        return [];
    }

    return (data || []).map(dbToProgram);
};

export const getProgramById = async (id: string): Promise<Program | undefined> => {
    const { data, error } = await supabase
        .from('programs')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching program:', error);
        return undefined;
    }

    return data ? dbToProgram(data) : undefined;
};

export const addProgram = async (
    program: Omit<Program, 'id' | 'criadoEm' | 'companyId'>,
    companyId: string
): Promise<Program | null> => {
    const { data, error } = await supabase
        .from('programs')
        .insert(programToDb(program as any, companyId))
        .select()
        .single();

    if (error) {
        console.error('Error adding program:', error);
        return null;
    }

    return data ? dbToProgram(data) : null;
};

export const updateProgram = async (id: string, updates: Partial<Program>): Promise<Program | null> => {
    // Convert updates to database format
    const dbUpdates: Record<string, unknown> = {};

    if (updates.nome !== undefined) dbUpdates.nome = updates.nome;
    if (updates.descricao !== undefined) dbUpdates.descricao = updates.descricao;
    if (updates.categoria !== undefined) dbUpdates.categoria = updates.categoria;
    if (updates.cor !== undefined) dbUpdates.cor = updates.cor;
    if (updates.icone !== undefined) dbUpdates.icone = updates.icone;
    if (updates.imagemUrl !== undefined) dbUpdates.imagem_url = updates.imagemUrl;
    if (updates.tipo !== undefined) dbUpdates.tipo = updates.tipo;
    if (updates.diasSemana !== undefined) dbUpdates.dias_semana = updates.diasSemana;
    if (updates.dataInicio !== undefined) dbUpdates.data_inicio = updates.dataInicio;
    if (updates.dataFim !== undefined) dbUpdates.data_fim = updates.dataFim;
    if (updates.horarios !== undefined) dbUpdates.horarios = updates.horarios;
    if (updates.duracaoMinutos !== undefined) dbUpdates.duracao_minutos = updates.duracaoMinutos;
    if (updates.vagasPorHorario !== undefined) dbUpdates.vagas_por_horario = updates.vagasPorHorario;
    if (updates.alcanceAgenda !== undefined) dbUpdates.alcance_agenda = updates.alcanceAgenda;
    if (updates.limitePorUsuario !== undefined) dbUpdates.limite_por_usuario = updates.limitePorUsuario;
    if (updates.limitePorDiaUsuario !== undefined) dbUpdates.limite_por_dia_usuario = updates.limitePorDiaUsuario;
    if (updates.ativo !== undefined) dbUpdates.ativo = updates.ativo;

    const { data, error } = await supabase
        .from('programs')
        .update(dbUpdates)
        .eq('id', id)
        .select()
        .single();

    if (error) {
        console.error('Error updating program:', error);
        return null;
    }

    return data ? dbToProgram(data) : null;
};

export const deleteProgram = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('programs')
        .delete()
        .eq('id', id);

    if (error) {
        console.error('Error deleting program:', error);
        return false;
    }

    return true;
};

// ==================== BOOKINGS ====================

// Get bookings - RLS will automatically filter by company
export const getBookings = async (): Promise<Booking[]> => {
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .order('criado_em', { ascending: false });

    if (error) {
        console.error('Error fetching bookings:', error);
        return [];
    }

    return (data || []).map(dbToBooking);
};

export const getBookingsByProgram = async (programaId: string): Promise<Booking[]> => {
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('programa_id', programaId)
        .eq('status', 'confirmado');

    if (error) {
        console.error('Error fetching bookings by program:', error);
        return [];
    }

    return (data || []).map(dbToBooking);
};

export const getBookingsByUserId = async (userId: string): Promise<Booking[]> => {
    const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('usuario_id', userId)
        .order('data', { ascending: true });

    if (error) {
        console.error('Error fetching bookings by user:', error);
        return [];
    }

    return (data || []).map(dbToBooking);
};

export const addBooking = async (
    booking: Omit<Booking, 'id' | 'criadoEm' | 'status' | 'usuarioId' | 'companyId'>,
    userId: string,
    companyId: string
): Promise<{ success: boolean; booking?: Booking; error?: string }> => {
    // First, check if slot is still available
    const program = await getProgramById(booking.programaId);
    if (!program) {
        return { success: false, error: 'Programa não encontrado' };
    }

    // Check user's total active bookings limit for this program
    if (program.limitePorUsuario !== null && program.limitePorUsuario > 0) {
        const { data: userTotalBookings, error: totalError } = await supabase
            .rpc('count_user_program_bookings', {
                p_programa_id: booking.programaId,
                p_usuario_id: userId
            });

        if (totalError) {
            console.error('Error checking user total bookings:', totalError);
        } else if (userTotalBookings >= program.limitePorUsuario) {
            return {
                success: false,
                error: `Você atingiu o limite máximo de ${program.limitePorUsuario} agendamento(s) ativo(s) para este programa.`
            };
        }
    }

    // Check user's bookings for the same day
    if (program.limitePorDiaUsuario !== null && program.limitePorDiaUsuario > 0) {
        const { data: userDayBookings, error: dayError } = await supabase
            .rpc('count_user_date_bookings', {
                p_programa_id: booking.programaId,
                p_usuario_id: userId,
                p_data: booking.data
            });

        if (dayError) {
            console.error('Error checking user day bookings:', dayError);
        } else if (userDayBookings >= program.limitePorDiaUsuario) {
            return {
                success: false,
                error: `Você atingiu o limite máximo de ${program.limitePorDiaUsuario} agendamento(s) por dia para este programa.`
            };
        }
    }

    // Get current bookings for this slot (using RPC to bypass RLS)
    const { data: slotCount, error: countError } = await supabase
        .rpc('count_slot_bookings', {
            p_programa_id: booking.programaId,
            p_data: booking.data,
            p_horario: booking.horario
        });

    if (countError) {
        console.error('Error checking slot availability:', countError);
        return { success: false, error: 'Erro ao verificar disponibilidade' };
    }

    if (slotCount >= program.vagasPorHorario) {
        return { success: false, error: 'Este horário já está lotado. Por favor, escolha outro horário.' };
    }

    // Check if user already has a booking for this exact slot
    const { data: userExistingBooking } = await supabase
        .from('bookings')
        .select('id')
        .eq('programa_id', booking.programaId)
        .eq('data', booking.data)
        .eq('horario', booking.horario)
        .eq('usuario_id', userId)
        .eq('status', 'confirmado')
        .single();

    if (userExistingBooking) {
        return { success: false, error: 'Você já tem um agendamento para este horário.' };
    }

    // Insert the booking
    const { data, error } = await supabase
        .from('bookings')
        .insert({
            programa_id: booking.programaId,
            usuario_id: userId,
            usuario_nome: booking.usuarioNome,
            usuario_email: booking.usuarioEmail,
            data: booking.data,
            horario: booking.horario,
            status: 'confirmado',
            company_id: companyId,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding booking:', error);
        return { success: false, error: 'Erro ao criar agendamento' };
    }

    return { success: true, booking: data ? dbToBooking(data) : undefined };
};

export const cancelBooking = async (id: string): Promise<boolean> => {
    const { error } = await supabase
        .from('bookings')
        .update({ status: 'cancelado' })
        .eq('id', id);

    if (error) {
        console.error('Error canceling booking:', error);
        return false;
    }

    return true;
};

// ==================== AVAILABILITY ====================

export const isDateAvailableForProgram = (program: Program, date: Date): boolean => {
    const dayOfWeek = date.getDay();

    if (program.tipo === 'recorrente') {
        return program.diasSemana.includes(dayOfWeek);
    } else {
        // Tipo período
        if (!program.dataInicio || !program.dataFim) return false;
        const start = new Date(program.dataInicio);
        const end = new Date(program.dataFim);
        const checkDate = new Date(date.toDateString()); // Remove time part
        return checkDate >= start && checkDate <= end;
    }
};

export const getAvailableSlots = async (programaId: string, date: string): Promise<AvailableSlot[]> => {
    // Use RPC function that bypasses RLS to correctly count all bookings
    const { data, error } = await supabase
        .rpc('get_available_slots', {
            p_programa_id: programaId,
            p_data: date
        });

    if (error) {
        console.error('Error getting available slots:', error);
        // Fallback to old method if RPC fails
        const program = await getProgramById(programaId);
        if (!program) return [];

        const bookings = await getBookingsByProgram(programaId);
        const dateBookings = bookings.filter(b => b.data === date);

        return program.horarios
            .filter(slot => slot.ativo)
            .map(slot => {
                const bookingsForSlot = dateBookings.filter(b => b.horario === slot.hora);
                return {
                    horario: slot.hora,
                    vagasDisponiveis: program.vagasPorHorario - bookingsForSlot.length,
                    vagasTotal: program.vagasPorHorario,
                };
            })
            .filter(slot => slot.vagasDisponiveis > 0);
    }

    return (data || []).map((slot: any) => ({
        horario: slot.horario,
        vagasDisponiveis: slot.vagas_disponiveis,
        vagasTotal: slot.vagas_total,
    }));
};

export const getTotalBookingsToday = async (): Promise<number> => {
    const today = new Date().toISOString().split('T')[0];

    const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('data', today)
        .eq('status', 'confirmado');

    if (error) {
        console.error('Error counting today bookings:', error);
        return 0;
    }

    return count || 0;
};

export const getUpcomingBookingsCount = async (): Promise<number> => {
    const today = new Date().toISOString().split('T')[0];

    const { count, error } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .gte('data', today)
        .eq('status', 'confirmado');

    if (error) {
        console.error('Error counting upcoming bookings:', error);
        return 0;
    }

    return count || 0;
};
