import type { LooseNote, ClassNote } from '../types';

/** Primeira linha do conteúdo da nota, truncada — usado como título padrão. */
export function noteFirstLine(content: string, max = 60): string {
  const line = content.split('\n')[0]?.trim() || '';
  return line.slice(0, max);
}

/** Constrói uma ClassNote a partir de uma nota avulsa (herda os vínculos). */
export function buildClassNoteFromNote(
  note: LooseNote,
  overrides: { title: string; courseId: string; number: number }
): ClassNote {
  return {
    id: 'cl-' + Date.now(),
    courseId: overrides.courseId,
    title: overrides.title.trim() || noteFirstLine(note.content) || 'aula anotada no cantinho',
    number: overrides.number,
    date: new Date().toISOString().split('T')[0],
    summary: note.content,
    fullNotes: note.content,
    conceptIds: note.conceptIds ?? [],
    authorIds: note.authorIds ?? [],
    approachIds: note.approachIds ?? [],
    materials: note.materialIds ?? [],
    hasQuestions: false,
  };
}