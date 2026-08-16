/**
 * Calendar integration wrapper using @capacitor/calendar plugin.
 * Provides utilities for creating events in Google Calendar on native platforms.
 */

import { Calendar, type CreateEventOptions } from '@capacitor/calendar';

interface CalendarEventInput {
  title: string;
  description?: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate?: string; // ISO date string (YYYY-MM-DD), defaults to startDate
}

/** Converte a entrada para o formato do plugin (epoch ms + `notes`). */
function toOptions(event: CalendarEventInput): CreateEventOptions {
  const start = new Date(event.startDate);
  const end = event.endDate ? new Date(event.endDate) : new Date(start);
  return {
    title: event.title,
    notes: event.description,
    startDate: start.getTime(),
    endDate: end.getTime(),
    isAllDay: true,
  };
}

/**
 * Cria um evento no Google Agenda (apenas nativo).
 * Primeiro tenta criar em silêncio (o plugin pede permissão quando ainda não
 * foi decidida); se não der (permissão negada ou erro), abre o editor do
 * Google Agenda já preenchido — assim a ação sempre leva até a agenda.
 *
 * @param event - Detalhes do evento
 * @returns true se o evento foi criado (ou confirmado no editor), false caso contrário
 */
export async function createCalendarEvent(event: CalendarEventInput): Promise<boolean> {
  const options = toOptions(event);

  try {
    await Calendar.createEvent(options);
    return true;
  } catch (error) {
    console.debug(
      '[calendar] createEvent falhou, abrindo editor interativo:',
      error instanceof Error ? error.message : String(error)
    );
    try {
      await Calendar.createEventInteractively(options);
      return true;
    } catch {
      console.debug('[calendar] editor interativo cancelado ou indisponível');
      return false;
    }
  }
}

/**
 * Cria um evento de tarefa no Google Agenda (para tarefas/atividades).
 *
 * @param taskTitle - Título da tarefa
 * @param courseName - Nome da disciplina (vai na descrição)
 * @param dueDate - Data limite em ISO (YYYY-MM-DD)
 * @returns true se o evento foi criado
 */
export async function createTaskCalendarEvent(
  taskTitle: string,
  courseName: string,
  dueDate: string
): Promise<boolean> {
  return createCalendarEvent({
    title: `Tarefa: ${taskTitle}`,
    description: `Disciplina: ${courseName}\n\nCriado via cecistudy ♡`,
    startDate: dueDate,
    endDate: dueDate,
  });
}

/**
 * Cria um evento de prova no Google Agenda (para testes/provas).
 *
 * @param examTitle - Título da prova
 * @param courseName - Nome da disciplina (vai na descrição)
 * @param examDate - Data da prova em ISO (YYYY-MM-DD)
 * @returns true se o evento foi criado
 */
export async function createExamCalendarEvent(
  examTitle: string,
  courseName: string,
  examDate: string
): Promise<boolean> {
  return createCalendarEvent({
    title: `Prova: ${examTitle}`,
    description: `Disciplina: ${courseName}\n\nCriado via cecistudy ♡`,
    startDate: examDate,
    endDate: examDate,
  });
}