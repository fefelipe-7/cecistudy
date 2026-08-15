import type { Course, ReadingItem, Flashcard, Exam } from '../types';

export interface Suggestion {
  id: string;
  title: string;
  time: string;
  category: string;
  completed: boolean;
}

const courseName = (courses: Course[], courseId?: string): string =>
  courses.find((c) => c.id === courseId)?.name ?? 'estudos';

/**
 * Sugestões do dia derivadas de dados reais:
 * 1. revisão de flashcards vencidos/a revisar
 * 2. leitura em andamento com páginas restantes
 * 3. prova mais próxima
 */
export function buildSuggestions(
  flashcards: Flashcard[],
  readings: ReadingItem[],
  exams: Exam[],
  courses: Course[]
): Suggestion[] {
  const suggestions: Suggestion[] = [];

  const dueFlashcards = flashcards
    .filter((f) => (f.timesReviewed ?? 0) < 2)
    .slice(0, 5);
  if (dueFlashcards.length > 0) {
    suggestions.push({
      id: 'sug_flashcards',
      title: `revisar ${dueFlashcards.length} flashcard${dueFlashcards.length === 1 ? '' : 's'} de ${courseName(courses, dueFlashcards[0].courseId)}`,
      time: `${Math.max(5, dueFlashcards.length * 3)} min`,
      category: 'sugestão • opcional',
      completed: false,
    });
  }

  const inProgress = readings.filter((r) => r.status === 'lendo' && (r.readPages ?? 0) < (r.totalPages ?? 0));
  if (inProgress.length > 0) {
    const reading = inProgress[0];
    const remaining = (reading.totalPages ?? 0) - (reading.readPages ?? 0);
    suggestions.push({
      id: `sug_read_${reading.id}`,
      title: `ler ${remaining > 0 ? `${remaining} páginas restantes de ` : ''}${reading.title}`,
      time: `${Math.max(5, Math.round(remaining * 0.8))} min`,
      category: 'sugestão • opcional',
      completed: false,
    });
  }

  const upcoming = exams
    .filter((e) => !e.completed)
    .sort((a, b) => a.date.localeCompare(b.date))[0];
  if (upcoming) {
    suggestions.push({
      id: `sug_exam_${upcoming.id}`,
      title: `revisar para ${upcoming.title} em ${courseName(courses, upcoming.courseId)}`,
      time: '30 min',
      category: 'sugestão • opcional',
      completed: false,
    });
  }

  return suggestions.slice(0, 3);
}
