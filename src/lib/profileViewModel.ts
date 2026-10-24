/**
 * View model de apresentação do Perfil — SPEC-013 D2.
 *
 * O Perfil reunia, na própria view, oito derivações independentes (minutos,
 * páginas, flashcards, tarefas, provas, estágio, TCC, stickers) espalhadas no
 * corpo do componente. Isso obrigava toda mudança de layout a mexer na conta, e
 * tornava impossível testar a apresentação sem renderizar a árvore inteira.
 *
 * Aqui as derivações acontecem **uma vez**, numa função **pura** (`deriveProfileViewModel`)
 * memoizada pelo hook `useProfileViewModel`. Cada componente recebe só a fatia
 * que usa.
 *
 * Regra de fronteira (SPEC-013 D9 / ADR-006): **nenhuma regra de domínio nova
 * nasce aqui.** Toda conta reusa o que já existe:
 * - progresso do curso → `degreeProgress` / `semestersLeft` (`termScope`);
 * - ordinal → o `AcademicTerm` ativo; `profile.semester` só como fallback legado;
 * - tempo de estudo → `formatStudyTime` (`profileMeta`);
 * - nível/título → `totalXp` / `levelFor` / `generalTitle` / `xpToNextLevel` (`levels`).
 *
 * "Registros recentes" é o **acumulado atual** — nenhuma janela temporal é
 * criada (isso seria regra de domínio, SPEC-013 D9).
 */
import { useMemo } from 'react';
import type { AcademicTerm, Sticker, UserProfile } from '../types';
import type {
  ClassNote,
  Course,
  Exam,
  Flashcard,
  ReadingItem,
  StudySession,
  Task,
} from '../types/entity';
import type { StreakStats } from './streak';
import {
  degreeProgress,
  semestersLeft,
  sortedTerms,
  MAX_TERM_ORDINAL,
} from './termScope';
import { formatStudyTime } from './profileMeta';
import { generalTitle, levelFor, totalXp, xpToNextLevel } from './levels';
import { THEMES, type ThemeId } from './themes';
import {
  normalizeReminderSettings,
  type ReminderCategories,
} from './reminderSettings';

/* -------------------------------------------------------------------------- */
/* Contrato                                                                    */
/* -------------------------------------------------------------------------- */

export interface ProfileIdentity {
  displayName: string;
  /** `curso · universidade`, sem separador solto quando um dos dois falta. */
  subtitle: string;
  quote: string;
  photoUrl?: string;
  initials: string;
  level: number;
  title: string;
}

export type ProfileJourneyStatus = 'past' | 'current' | 'future';

export interface ProfileJourneySlot {
  ordinal: number;
  status: ProfileJourneyStatus;
  /** O período tem resumo congelado (fechado) — vira "concluído" no trilho. */
  hasSummary: boolean;
  /** Disciplinas que pertenciam ao período no fechamento. */
  courses: number;
}

export interface ProfileJourney {
  currentOrdinal: number;
  totalSemesters: number;
  /** `%` da graduação (0..100, clampado). */
  percent: number;
  semestersLeft: number;
  activeTermLabel?: string;
  /** `id` do período ativo — a correção do ordinal acontece por id (SPEC-006 D6). */
  activeTermId?: string;
  hasActiveTerm: boolean;
  /** O ordinal passou do total do curso (palpite) — aviso, nunca clamp (SPEC-008 D3). */
  beyondCourseEstimate: boolean;
  /** Slots do trilho contínuo, do 1º ao último (≤ `MAX_TERM_ORDINAL`). */
  slots: ProfileJourneySlot[];
  /** Histórico do que foi fechado, do mais recente ao mais antigo. */
  history: Array<{ ordinal: number; label: string; courses: number; highlights: string[] }>;
}

export interface ProfilePulse {
  studyTimeMinutes: number;
  studyTimeLabel: string;
  pagesRead: number;
  tasksCompleted: number;
  tasksTotal: number;
  examsPending: number;
}

export interface ProfileAchievements {
  level: number;
  title: string;
  unlocked: number;
  total: number;
  /** Stickers desbloqueados primeiro, depois os bloqueados (silhuetas). */
  visible: Sticker[];
  /** Próximo objetivo de nível, ou ausente no teto. `progress` em 0..100. */
  next?: { label: string; progress: number };
  streak: StreakStats;
}

export interface ProfilePreferences {
  reminderSupported: boolean;
  reminderEnabled: boolean;
  reminderTime: string;
  reminderCategories: ReminderCategories;
  calendarConfigured: boolean;
  calendarEnabled: boolean;
  themeLabel: string;
}

export interface ProfileMaintenance {
  /** App rodando no nativo (OTA só existe lá). Derivado em `src/lib`, nunca no componente. */
  native: boolean;
}

export interface ProfileViewModel {
  identity: ProfileIdentity;
  journey: ProfileJourney;
  pulse: ProfilePulse;
  achievements: ProfileAchievements;
  preferences: ProfilePreferences;
  maintenance: ProfileMaintenance;
}

export interface ProfileViewModelInput {
  profile: UserProfile;
  activeTerm: AcademicTerm | null;
  academicTerms: AcademicTerm[];
  courses: Course[];
  classes: ClassNote[];
  tasks: Task[];
  exams: Exam[];
  readings: ReadingItem[];
  flashcards: Flashcard[];
  sessions: StudySession[];
  stickers: Sticker[];
  streak: StreakStats;
  themePref: ThemeId;
  reminderSettings: { enabled: boolean; time: string; categories?: ReminderCategories };
  reminderSupported: boolean;
  gcalConfigured: boolean;
  gcalEnabled: boolean;
  native: boolean;
}

/* -------------------------------------------------------------------------- */
/* Derivação pura                                                              */
/* -------------------------------------------------------------------------- */

/** Iniciais de exibição: primeira letra do nome, ou `C` de cecistudy. */
function initialsOf(name: string): string {
  return name.trim().charAt(0).toUpperCase() || 'C';
}

/** `curso · universidade` — sem separador quando só um dos dois existe. */
function subtitleOf(career: string, university: string): string {
  return [career?.trim(), university?.trim()].filter(Boolean).join(' · ');
}

/** Slots do trilho: do 1º ao último, com o resumo de quem já fechou. */
function buildJourneySlots(
  terms: AcademicTerm[],
  currentOrdinal: number,
  totalSemesters: number,
): ProfileJourneySlot[] {
  // O trilho vai até onde a formação alcança: o maior entre o total do curso e o
  // ordinal atual (quem está no 9º de um curso de 8 precisa se ver no 9º), preso
  // ao teto global (`MAX_TERM_ORDINAL`). O próximo período é resolvido por
  // `ordinal`, com o mais recente vencendo (`sortedTerms` vem do mais novo).
  const termByOrdinal = new Map<number, AcademicTerm>();
  for (const t of sortedTerms(terms)) {
    if (!termByOrdinal.has(t.ordinal)) termByOrdinal.set(t.ordinal, t);
  }
  const count = Math.min(MAX_TERM_ORDINAL, Math.max(1, totalSemesters, currentOrdinal));
  const slots: ProfileJourneySlot[] = [];
  for (let ordinal = 1; ordinal <= count; ordinal++) {
    const term = termByOrdinal.get(ordinal);
    const status: ProfileJourneyStatus =
      ordinal === currentOrdinal ? 'current' : ordinal < currentOrdinal ? 'past' : 'future';
    slots.push({
      ordinal,
      status,
      hasSummary: Boolean(term?.summary),
      courses: term?.summary?.courses ?? 0,
    });
  }
  return slots;
}

/** Histórico do que foi fechado, do mais recente ao mais antigo. */
function buildHistory(
  terms: AcademicTerm[],
): ProfileJourney['history'] {
  return sortedTerms(terms)
    .filter((t) => Boolean(t.summary))
    .map((t) => ({
      ordinal: t.ordinal,
      label: t.label,
      courses: t.summary?.courses ?? 0,
      highlights: t.summary?.highlights ?? [],
    }));
}

/** Deriva o view model do Perfil. Puro: mesmo input → mesmo output. */
export function deriveProfileViewModel(input: ProfileViewModelInput): ProfileViewModel {
  const {
    profile,
    activeTerm,
    academicTerms,
    tasks,
    exams,
    readings,
    sessions,
    stickers,
    streak,
    themePref,
    reminderSettings,
    reminderSupported,
    gcalConfigured,
    gcalEnabled,
    native,
  } = input;

  // Progresso do curso vem do **período ativo** (SPEC-005 §D4); `profile.semester`
  // é só o fallback de quem ainda não abriu o primeiro semestre.
  const currentOrdinal = activeTerm?.ordinal ?? profile.semester;
  const percent = degreeProgress(currentOrdinal, profile.totalSemesters);
  const left = semestersLeft(currentOrdinal, profile.totalSemesters);

  const xp = totalXp(profile);
  const level = levelFor(xp);
  const title = generalTitle(level);
  const levelProgress = xpToNextLevel(xp);
  const unlocked = stickers.filter((s) => s.unlocked).length;
  const visible = [
    ...stickers.filter((s) => s.unlocked),
    ...stickers.filter((s) => !s.unlocked),
  ];

  const studyTimeMinutes = sessions.reduce((acc, s) => acc + s.durationMinutes, 0);
  const tasksCompleted = tasks.filter((t) => t.completed).length;
  const examsPending = exams.filter((e) => !e.completed).length;

  return {
    identity: {
      displayName: profile.name,
      subtitle: subtitleOf(profile.targetCareer, profile.university),
      quote: profile.dailyQuote,
      photoUrl: profile.photoUrl,
      initials: initialsOf(profile.name),
      level,
      title,
    },
    journey: {
      currentOrdinal,
      totalSemesters: profile.totalSemesters,
      percent,
      semestersLeft: left,
      activeTermLabel: activeTerm?.label,
      activeTermId: activeTerm?.id,
      hasActiveTerm: Boolean(activeTerm),
      beyondCourseEstimate: currentOrdinal > profile.totalSemesters,
      slots: buildJourneySlots(academicTerms, currentOrdinal, profile.totalSemesters),
      history: buildHistory(academicTerms),
    },
    pulse: {
      studyTimeMinutes,
      studyTimeLabel: formatStudyTime(studyTimeMinutes),
      pagesRead: readings.reduce((acc, r) => acc + (r.readPages || 0), 0),
      tasksCompleted,
      tasksTotal: tasks.length,
      examsPending,
    },
    achievements: {
      level,
      title,
      unlocked,
      total: stickers.length,
      visible,
      next: levelProgress.isMaxLevel
        ? undefined
        : {
            label: `rumo ao nível ${level + 1}`,
            progress: Math.round((levelProgress.current / levelProgress.needed) * 100),
          },
      streak,
    },
    preferences: {
      reminderSupported,
      reminderEnabled: reminderSettings.enabled,
      reminderTime: reminderSettings.time,
      reminderCategories: normalizeReminderSettings(reminderSettings).categories,
      calendarConfigured: gcalConfigured,
      calendarEnabled: gcalEnabled,
      themeLabel: THEMES[themePref].label,
    },
    maintenance: {
      native,
    },
  };
}

/* -------------------------------------------------------------------------- */
/* Hook memoizado                                                              */
/* -------------------------------------------------------------------------- */

/**
 * Deriva o view model memoizando pelas fontes de estado (SPEC-013 D2).
 * Dependências explícitas: qualquer coleção trocada recalcula; nada mais.
 */
export function useProfileViewModel(input: ProfileViewModelInput): ProfileViewModel {
  return useMemo(
    () => deriveProfileViewModel(input),
    [
      input.profile,
      input.activeTerm,
      input.academicTerms,
      input.courses,
      input.classes,
      input.tasks,
      input.exams,
      input.readings,
      input.flashcards,
      input.sessions,
      input.stickers,
      input.streak,
      input.themePref,
      input.reminderSettings,
      input.reminderSupported,
      input.gcalConfigured,
      input.gcalEnabled,
      input.native,
    ],
  );
}
