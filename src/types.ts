import type { ComponentType, ReactNode } from 'react';

export type NavTab = 'home' | 'faculdade' | 'estudos' | 'biblioteca' | 'perfil';

export type SubTabFaculdade = 'disciplinas' | 'aulas' | 'avaliacoes' | 'calendario';
export type SubTabEstudos = 'sessoes' | 'leituras' | 'flashcards' | 'questoes' | 'historico';
export type SubTabBiblioteca = 'materiais' | 'autores' | 'conceitos' | 'abordagens' | 'mapa';
export type SubTabPerfil = 'jornada' | 'stickers' | 'estagio' | 'tcc' | 'configuracoes';

/**
 * Tela da pilha de navegação nativa (push/pop).
 * Base = tab; telas auxiliares são empurradas por cima da base.
 */
export type NavScreen =
  | { kind: 'tab'; tab: NavTab }
  | { kind: 'course'; courseId: string }
  | { kind: 'notes' }
  | { kind: 'temple' }
  | { kind: 'mood' };

export interface HeaderAction {
  label: string;
  Icon?: ComponentType<{ className?: string }>;
  onClick: () => void;
}

export interface DynamicHeaderConfig {
  type?: 'default' | 'detail' | 'custom';
  title?: string;
  subtitle?: string;
  code?: string;
  badge?: string;
  badgeColor?: string;
  icon?: string;
  color?: string;
  onBack?: () => void;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  rightActions?: ReactNode;
  /** Menu de ações contextuais renderizado no lado direito do header (padrão de telas auxiliares). */
  actions?: HeaderAction[];
}

export interface Task {
  id: string;
  title: string;
  disciplineId?: string;
  classId?: string;
  dueDate?: string;
  completed: boolean;
  priority: 'alta' | 'media' | 'baixa';
  category: 'leitura' | 'trabalho' | 'revisao' | 'estagio' | 'outro';
}

export interface Course {
  id: string;
  name: string;
  code?: string;
  professor: string;
  semester: string; // e.g. "6º Semestre"
  schedule: string; // e.g. "Segunda 09:00 - 12:00"
  room?: string;
  category?: 'obrigatoria' | 'complementar';
  color: string; // hex code or style class
  icon: string; // Lucide icon name
  progress: number; // 0-100%
  description?: string;
}

export interface ClassNote {
  id: string;
  courseId: string;
  title: string;
  number: number;
  date: string;
  summary: string;
  fullNotes?: string;
  conceptIds?: string[];
  authorIds?: string[];
  materials?: string[];
  hasQuestions?: boolean;
}

export interface Exam {
  id: string;
  courseId: string;
  title: string;
  date: string;
  weight: string; // e.g. "40% da nota"
  topics: string[];
  completed: boolean;
  grade?: number;
}

export interface StudySession {
  id: string;
  courseId?: string;
  topic: string;
  date: string;
  durationMinutes: number;
  mood: 'com_foco' | 'tranquilo' | 'cansado' | 'produtivo';
  notes?: string;
}

export interface ReadingItem {
  id: string;
  title: string;
  author: string;
  courseId?: string;
  type: 'livro' | 'artigo' | 'capitulo' | 'pdf';
  totalPages?: number;
  readPages?: number;
  status: 'nao_iniciado' | 'lendo' | 'concluido';
  highlights?: string[];
}

export interface Flashcard {
  id: string;
  conceptId?: string;
  courseId?: string;
  question: string;
  answer: string;
  lastReviewed?: string;
  easeFactor?: number;
  timesReviewed?: number;
}

export interface PsychologyConcept {
  id: string;
  name: string;
  definition: string;
  approachId?: string; // TCC, Psicanálise, etc.
  authorIds: string[];
  courseIds: string[];
  tags: string[];
}

export interface PsychologyAuthor {
  id: string;
  name: string;
  bio: string;
  lifespan?: string;
  approachId?: string;
  keyConcepts: string[];
  majorWorks: string[];
  imageUrl?: string;
}

export interface PsychologyApproach {
  id: string;
  name: string;
  shortName: string;
  description: string;
  foundingAuthors: string[];
  color: string;
}

export interface MaterialItem {
  id: string;
  title: string;
  type: 'artigo' | 'livro' | 'pdf' | 'link' | 'slides';
  author: string;
  courseId?: string;
  url?: string;
  tags: string[];
  addedAt: string;
}

export interface InternshipLog {
  id: string;
  date: string;
  hours: number;
  activity: string;
  supervisionNotes: string;
  reflections: string;
  conceptIds?: string[];
}

export interface TccData {
  title: string;
  advisor: string;
  field: string;
  problemStatement: string;
  objectives: string[];
  status: 'em_andamento' | 'revisao' | 'concluido';
  chapters: {
    title: string;
    completed: boolean;
    dueDate?: string;
  }[];
  references: string[];
}

export interface Sticker {
  id: string;
  name: string;
  emoji: string;
  description: string;
  unlocked: boolean;
  unlockedAt?: string;
  category: 'faculdade' | 'estudo' | 'leituras' | 'jornada';
}

export interface UserProfile {
  name: string;
  semester: number;
  totalSemesters: number;
  university: string;
  targetCareer: string;
  avatarMood: string;
  dailyQuote: string;
  stickersCollected: number;
}

export interface DailyMoodData {
  emoji: string;
  label: string;
  energyLevel: number; // 1-5
  vibeColor: string;
  reflection: string;
  intention: string;
  updatedAt: string;
}

export type QuickType =
  | 'task'
  | 'class'
  | 'reading'
  | 'flashcard'
  | 'concept'
  | 'internship'
  | 'session'
  | 'exam'
  | 'author';
