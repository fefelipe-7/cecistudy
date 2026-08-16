/**
 * Calendar integration wrapper using @capacitor/calendar plugin.
 * Provides utilities for creating events in Google Calendar on native platforms.
 */

import { Calendar } from '@capacitor/calendar';
import { checkPermission, requestPermission } from './permissions';

interface CalendarEventInput {
  title: string;
  description?: string;
  startDate: string; // ISO date string (YYYY-MM-DD)
  endDate?: string; // ISO date string (YYYY-MM-DD), defaults to startDate
}

/**
 * Creates a calendar event in Google Calendar (native only).
 * Returns success/failure status without throwing errors.
 *
 * @param event - Event details
 * @returns true if event was created, false otherwise
 */
export async function createCalendarEvent(event: CalendarEventInput): Promise<boolean> {
  try {
    // Check for calendar permission
    const hasPermission = await checkPermission('calendar');

    if (!hasPermission) {
      console.log('[calendar] No calendar permission, requesting...');
      const permissionResult = await requestPermission('calendar');

      if (permissionResult !== 'granted') {
        console.log('[calendar] Calendar permission denied by user');
        return false;
      }
    }

    // Parse dates
    const startDate = new Date(event.startDate);
    const endDate = event.endDate ? new Date(event.endDate) : new Date(startDate);

    // Capacitor Calendar expects event objects with specific format
    const calendarEvent = {
      title: event.title,
      description: event.description || '',
      startDate: {
        year: startDate.getFullYear(),
        month: startDate.getMonth() + 1, // Capacitor uses 1-based months
        day: startDate.getDate(),
        hour: 0,
        minute: 0,
      },
      endDate: {
        year: endDate.getFullYear(),
        month: endDate.getMonth() + 1,
        day: endDate.getDate(),
        hour: 0,
        minute: 0,
      },
      isAllDay: true,
      calendarId: 'primary', // Google Calendar's primary calendar
    };

    // Create the event
    const result = await Calendar.createEvent(calendarEvent as any);

    console.log('[calendar] Event created successfully:', result);
    return true;
  } catch (error) {
    // Web platforms and errors are expected to fail gracefully
    console.debug('[calendar] Calendar event creation unavailable:', error instanceof Error ? error.message : String(error));
    return false;
  }
}

/**
 * Creates a task event in Google Calendar (for tasks/activities).
 * Automatically handles permissions and date parsing.
 *
 * @param taskTitle - Title of the task
 * @param courseName - Course/discipline name to include in description
 * @param dueDate - Due date in ISO format (YYYY-MM-DD)
 * @returns true if event was created successfully
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
 * Creates an exam event in Google Calendar (for tests/exams).
 * Automatically handles permissions and date parsing.
 *
 * @param examTitle - Title of the exam
 * @param courseName - Course/discipline name
 * @param examDate - Exam date in ISO format (YYYY-MM-DD)
 * @returns true if event was created successfully
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
