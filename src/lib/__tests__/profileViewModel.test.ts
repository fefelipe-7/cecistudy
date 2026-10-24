/**
 * SPEC-013 D2 — o view model é puro e memoizado. Estes testes fixam os 10 casos
 * que a UI nova consome: identidade, jornada (com fallback legado), ritmo,
 * conquistas (nível e próximo objetivo), preferências e manutenção. Nenhum
 * deles renderiza React — é justamente o ponto de mover a derivação para cá.
 */
import { describe, expect, it } from 'vitest';
import { deriveProfileViewModel, type ProfileViewModelInput } from '../profileViewModel';
import type { AcademicTerm, Sticker, UserProfile } from '../../types';
import type { ReadingItem, StudySession, Task, Exam } from '../../types/entity';
import type { StreakStats } from '../streak';
import { MAX_TERM_ORDINAL } from '../termScope';

const profile = (over: Partial<UserProfile> = {}): UserProfile => ({
  name: 'Ceci',
  semester: 1,
  totalSemesters: 8,
  university: 'USP',
  targetCareer: 'Psicologia',
  dailyQuote: 'um passo por vez',
  stickersCollected: 0,
  ...over,
});

const term = (over: Partial<AcademicTerm> = {}): AcademicTerm => ({
  id: 'trm-1',
  ordinal: 6,
  label: '6º semestre',
  status: 'ativo',
  startedAt: '2026-02-01',
  statusTransitionAt: '2026-02-01T00:00:00.000Z',
  createdAt: '2026-02-01T00:00:00.000Z',
  updatedAt: '2026-02-01T00:00:00.000Z',
  ...over,
});

const closedTerm = (ordinal: number): AcademicTerm =>
  term({
    id: `trm-${ordinal}`,
    ordinal,
    label: `${ordinal}º semestre`,
    status: 'encerrado',
    // Data distinta por ordinal — `termsByRecency` desempata por ela, então sem
    // isso a ordenação dependeria da ordem de entrada (o teste ficaria frágil).
    startedAt: `2026-${String(ordinal).padStart(2, '0')}-01`,
    statusTransitionAt: `2026-${String(ordinal).padStart(2, '0')}-01T00:00:00.000Z`,
    summary: {
      closedAt: '2026-01-01T00:00:00.000Z',
      courses: 5,
      archivedCourses: 1,
      carriedCourses: 0,
      classNotes: 12,
      tasksCompleted: 3,
      tasksCarriedOver: 0,
      readingsCompleted: 2,
      pagesRead: 40,
      focusMinutes: 300,
      loggedHours: 5,
      bestStreak: 7,
      grades: [],
      highlights: ['fechou com carinho'],
    },
  });

const sticker = (over: Partial<Sticker> = {}): Sticker => ({
  id: 'stk-1',
  name: 'primeira leitura',
  emoji: '📖',
  description: 'leu a primeira obra',
  unlocked: false,
  category: 'leituras',
  ...over,
});

const streak: StreakStats = { current: 4, longest: 9, total: 20, alive: true };

const base = (over: Partial<ProfileViewModelInput> = {}): ProfileViewModelInput => ({
  profile: profile(),
  activeTerm: term(),
  academicTerms: [term()],
  courses: [],
  classes: [],
  tasks: [],
  exams: [],
  readings: [],
  flashcards: [],
  sessions: [],
  stickers: [],
  streak,
  themePref: 'rosa-claro',
  reminderSettings: { enabled: false, time: '20:00' },
  reminderSupported: true,
  gcalConfigured: false,
  gcalEnabled: false,
  native: false,
  ...over,
});

describe('deriveProfileViewModel — identidade', () => {
  it('monta nome, iniciais, subtítulo curso · universidade e nível', () => {
    const vm = deriveProfileViewModel(
      base({ profile: profile({ name: 'fê', targetCareer: 'Psicologia', university: 'USP' }) }),
    );
    expect(vm.identity.displayName).toBe('fê');
    expect(vm.identity.initials).toBe('F');
    expect(vm.identity.subtitle).toBe('Psicologia · USP');
    expect(vm.identity.level).toBeGreaterThanOrEqual(1);
  });

  it('sem universidade, o subtítulo não deixa separador solto', () => {
    const vm = deriveProfileViewModel(
      base({ profile: profile({ targetCareer: 'Psicologia', university: '   ' }) }),
    );
    expect(vm.identity.subtitle).toBe('Psicologia');
  });

  it('nome vazio cai para a inicial do app', () => {
    const vm = deriveProfileViewModel(base({ profile: profile({ name: '   ' }) }));
    expect(vm.identity.initials).toBe('C');
  });
});

describe('deriveProfileViewModel — jornada', () => {
  it('deriva progresso e restantes do período ativo (SPEC-005 D4)', () => {
    const vm = deriveProfileViewModel(
      base({
        activeTerm: term({ ordinal: 6 }),
        profile: profile({ totalSemesters: 10, semester: 1 }),
      }),
    );
    expect(vm.journey.currentOrdinal).toBe(6);
    expect(vm.journey.percent).toBe(60);
    expect(vm.journey.semestersLeft).toBe(4);
    expect(vm.journey.hasActiveTerm).toBe(true);
    expect(vm.journey.activeTermLabel).toBe('6º semestre');
  });

  it('sem período ativo, usa `profile.semester` como fallback legado', () => {
    const vm = deriveProfileViewModel(
      base({
        activeTerm: null,
        academicTerms: [],
        profile: profile({ semester: 3, totalSemesters: 8 }),
      }),
    );
    expect(vm.journey.currentOrdinal).toBe(3);
    expect(vm.journey.hasActiveTerm).toBe(false);
    expect(vm.journey.activeTermLabel).toBeUndefined();
  });

  it('marca o atual, o passado e o futuro, com o teto do trilho em MAX_TERM_ORDINAL', () => {
    const vm = deriveProfileViewModel(
      base({
        activeTerm: term({ ordinal: 3 }),
        academicTerms: [closedTerm(1), closedTerm(2), term({ ordinal: 3 })],
        profile: profile({ totalSemesters: 20 }),
      }),
    );
    expect(vm.journey.slots).toHaveLength(MAX_TERM_ORDINAL);
    expect(vm.journey.slots[0].status).toBe('past');
    expect(vm.journey.slots[0].hasSummary).toBe(true);
    expect(vm.journey.slots[2].status).toBe('current');
    expect(vm.journey.slots[3].status).toBe('future');
  });

  it('avisa quando o ordinal passa do total do curso (SPEC-008 D3)', () => {
    const vm = deriveProfileViewModel(
      base({ activeTerm: term({ ordinal: 9 }), profile: profile({ totalSemesters: 8 }) }),
    );
    expect(vm.journey.beyondCourseEstimate).toBe(true);
    // o trilho alcança o 9º mesmo com total 8
    expect(vm.journey.slots).toHaveLength(9);
    expect(vm.journey.history).toHaveLength(0);
  });

  it('o histórico traz só os períodos fechados, do mais novo ao mais antigo', () => {
    const vm = deriveProfileViewModel(
      base({
        activeTerm: term({ ordinal: 4 }),
        academicTerms: [closedTerm(2), closedTerm(3), term({ ordinal: 4 })],
      }),
    );
    expect(vm.journey.history.map((h) => h.ordinal)).toEqual([3, 2]);
    expect(vm.journey.history[0].courses).toBe(5);
  });
});

describe('deriveProfileViewModel — ritmo', () => {
  it('soma sessões e páginas e conta tarefas e provas', () => {
    const sessions: StudySession[] = [
      { id: 's1', topic: 'a', date: '2026-03-01', durationMinutes: 30 },
      { id: 's2', topic: 'b', date: '2026-03-02', durationMinutes: 45 },
    ];
    const readings: ReadingItem[] = [
      { id: 'r1', title: 'x', author: 'y', type: 'livro', status: 'concluido', readPages: 40 },
      { id: 'r2', title: 'z', author: 'w', type: 'artigo', status: 'lendo', readPages: 10 },
    ];
    const tasks: Task[] = [
      { id: 't1', title: 'a', completed: true, priority: 'alta', category: 'leitura' },
      { id: 't2', title: 'b', completed: false, priority: 'media', category: 'outro' },
    ];
    const exams: Exam[] = [
      {
        id: 'e1',
        courseId: 'c1',
        title: 'p1',
        date: '2026-04-01',
        weight: '50%',
        topics: [],
        completed: false,
      },
      {
        id: 'e2',
        courseId: 'c1',
        title: 'p2',
        date: '2026-05-01',
        weight: '50%',
        topics: [],
        completed: true,
      },
    ];
    const vm = deriveProfileViewModel(base({ sessions, readings, tasks, exams }));
    expect(vm.pulse.studyTimeMinutes).toBe(75);
    expect(vm.pulse.studyTimeLabel).toBe('1h 15min');
    expect(vm.pulse.pagesRead).toBe(50);
    expect(vm.pulse.tasksCompleted).toBe(1);
    expect(vm.pulse.tasksTotal).toBe(2);
    expect(vm.pulse.examsPending).toBe(1);
  });

  it('sem nada registrado, o ritmo é zero (não NaN)', () => {
    const vm = deriveProfileViewModel(base());
    expect(vm.pulse.studyTimeMinutes).toBe(0);
    expect(vm.pulse.studyTimeLabel).toBe('0min');
    expect(vm.pulse.pagesRead).toBe(0);
    expect(vm.pulse.tasksTotal).toBe(0);
  });
});

describe('deriveProfileViewModel — conquistas', () => {
  it('conta desbloqueados e coloca os desbloqueados na frente dos bloqueados', () => {
    const stickers: Sticker[] = [
      sticker({ id: 'a', unlocked: false }),
      sticker({ id: 'b', unlocked: true }),
      sticker({ id: 'c', unlocked: true }),
    ];
    const vm = deriveProfileViewModel(base({ stickers }));
    expect(vm.achievements.unlocked).toBe(2);
    expect(vm.achievements.total).toBe(3);
    expect(vm.achievements.visible.map((s) => s.id)).toEqual(['b', 'c', 'a']);
  });

  it('carrega a ofensiva como item de conquista (SPEC-013 D8)', () => {
    const vm = deriveProfileViewModel(base({ streak }));
    expect(vm.achievements.streak).toEqual(streak);
  });

  it('sem XP, aponta o próximo objetivo de nível com progresso 0..100', () => {
    const vm = deriveProfileViewModel(base({ profile: profile({ categoryXp: undefined }) }));
    expect(vm.achievements.level).toBe(1);
    expect(vm.achievements.next?.label).toMatch(/nível 2/);
    expect(vm.achievements.next?.progress).toBe(0);
  });
});

describe('deriveProfileViewModel — preferências e manutenção', () => {
  it('expõe rótulo do tema e o estado de lembrete e agenda', () => {
    const vm = deriveProfileViewModel(
      base({
        themePref: 'noturno',
        reminderSettings: { enabled: true, time: '21:30' },
        reminderSupported: true,
        gcalConfigured: true,
        gcalEnabled: true,
      }),
    );
    expect(vm.preferences.themeLabel.length).toBeGreaterThan(0);
    expect(vm.preferences.reminderEnabled).toBe(true);
    expect(vm.preferences.reminderTime).toBe('21:30');
    expect(vm.preferences.calendarConfigured).toBe(true);
    expect(vm.preferences.calendarEnabled).toBe(true);
  });

  it('repassa o `native` derivado (OTA só no nativo)', () => {
    expect(deriveProfileViewModel(base({ native: true })).maintenance.native).toBe(true);
    expect(deriveProfileViewModel(base({ native: false })).maintenance.native).toBe(false);
  });
});

describe('deriveProfileViewModel — pureza (SPEC-013 D2)', () => {
  it('mesmo input produz deep-equal e não muta as coleções de entrada', () => {
    const stickers: Sticker[] = [sticker({ id: 'a', unlocked: true }), sticker({ id: 'b' })];
    const input = base({ stickers });
    const snapshot = stickers.map((s) => ({ ...s }));
    const first = deriveProfileViewModel(input);
    const second = deriveProfileViewModel(input);
    expect(first).toEqual(second);
    expect(stickers).toEqual(snapshot);
  });
});
