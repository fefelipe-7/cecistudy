// Lógica pura da tela de captura rápida ("o caderno do cantinho").
// TODO o estado de UI fica em ComposeNoteView; este módulo centraliza as regras
// de classificação (aula × avulsa), previsão "parece aula?", numeração de aula,
// estado persistente (prefs + rascunho) e montagem dos payloads.
import type { ClassNote, LooseNote } from '../types';
import { noteFirstLine } from './noteLogic';

/** Categorias possíveis de uma nota avulsa. */
export const LOOSE_CATEGORIES: LooseNote['category'][] = ['reflexão', 'estudo', 'ideia', 'lembrete'];

/** A partir de quantos caracteres o texto parece uma nota de aula. */
export const LOOKS_LIKE_CLASS_THRESHOLD = 40;

/** Chave do rascunho persistente (prefixo `cecistudy_` é adicionado pelo storage). */
export const COMPOSE_DRAFT_KEY = 'composeDraft';

export type ComposeMode = 'aula' | 'avulsa';

/** Última escolha do quick capture (abre no último modo/disciplina). */
export interface ComposePrefs {
  mode: ComposeMode;
  courseId?: string;
}

/** Rascunho persistido da nota em digitação. */
export interface ComposeDraft {
  text: string;
  mode: ComposeMode;
  courseId?: string;
  category: LooseNote['category'];
  tag: string;
  rating: number;
}

/** Rascunho vazio — novo começo praticamente sem fluxo de abertura. */
export function emptyDraft(): ComposeDraft {
  return {
    text: '',
    mode: 'avulsa',
    courseId: undefined,
    category: 'reflexão',
    tag: '',
    rating: 0,
  };
}

/** Modo inicial (aula quando veio de um contexto de disciplina; senão a última escolha). */
export function initialMode(composeCourseId: string | undefined, lastPrefs?: ComposePrefs): ComposeMode {
  if (composeCourseId) return 'aula';
  return lastPrefs?.mode ?? 'avulsa';
}

/** Disciplina inicial (contexto > preferência > primeira do catálogo). */
export function initialCourseId(
  composeCourseId: string | undefined,
  lastPrefs: ComposePrefs | undefined,
  courses: { id: string }[]
): string | undefined {
  return composeCourseId ?? lastPrefs?.courseId ?? courses[0]?.id;
}

/** Próximo número de aula para uma disciplina (máximo atual + 1; 1 quando vazio). */
export function nextClassNumber(
  classes: Pick<ClassNote, 'courseId' | 'number'>[],
  courseId: string | undefined
): number {
  if (!courseId) return 1;
  const nums = classes.filter((c) => c.courseId === courseId).map((c) => c.number || 0);
  return (nums.length ? Math.max(...nums) : 0) + 1;
}

/** O texto parece uma nota de aula? (nudge "anotar como aula"). */
export function looksLikeClassNote(text: string, hasCourses: boolean): boolean {
  return text.trim().length >= LOOKS_LIKE_CLASS_THRESHOLD && hasCourses;
}

/** Quando mostrar o nudge de conversão para aula. */
export function shouldShowClassNudge(text: string, mode: ComposeMode, hasCourses: boolean): boolean {
  return mode === 'avulsa' && looksLikeClassNote(text, hasCourses);
}

/** Título do cabeçalho contextual. */
export function composeTitle(mode: ComposeMode, courseName?: string): string {
  return mode === 'aula'
    ? courseName
      ? `anotar aula de ${courseName}`
      : 'anotar aula'
    : 'nova nota';
}

/** Preferências a guardar após salvar (aula lembra a disciplina; avulsa esquece). */
export function nextComposePrefs(mode: ComposeMode, courseId?: string): ComposePrefs {
  return mode === 'aula' ? { mode, courseId } : { mode };
}

/** Monta uma ClassNote a partir da captura (binário de compose). */
export function buildClassNoteFromCompose(input: {
  text: string;
  tag: string;
  courseId?: string;
  number: number;
  rating: number;
}): ClassNote {
  const content = input.text.trim();
  return {
    id: 'cl-' + Date.now(),
    courseId: input.courseId ?? '',
    title: input.tag.trim() || noteFirstLine(content) || 'aula anotada no cantinho',
    number: input.number,
    date: new Date().toISOString().split('T')[0],
    summary: content,
    fullNotes: content,
    conceptIds: [],
    authorIds: [],
    approachIds: [],
    materials: [],
    hasQuestions: false,
    rating: input.rating || undefined,
  };
}

/** Monta uma LooseNote mantendo o vínculo de matéria quando escolhido (bugfix). */
export function buildLooseNoteFromCompose(input: {
  text: string;
  category: LooseNote['category'];
  courseId?: string;
}): LooseNote {
  const content = input.text.trim();
  return {
    id: 'note-' + Date.now(),
    title: noteFirstLine(content) || 'nota sem título',
    content,
    category: input.category,
    date: new Date().toISOString(),
    courseId: input.courseId || undefined,
  };
}