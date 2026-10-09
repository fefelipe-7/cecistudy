import { describe, expect, it } from 'vitest';
import { addDays, daysBetween } from '../common';
import {
  buildThesisLinkIndex,
  abntDataFromReading,
  captureLink,
  commitFlatOrder,
  emptyThesis,
  emptyThesisReminderPrefs,
  extractFirstUrl,
  formatAbnt,
  isChapterDone,
  isValidUrl,
  moveChapter,
  newChapterId,
  newMeetingId,
  newReadingId,
  newReferenceId,
  newTaskId,
  newWritingLogId,
  nextThesisDeadline,
  normalizeUrl,
  orderChaptersForRender,
  parseAuthorString,
  parseCaptureDeepLink,
  planThesisReminders,
  routeFromNotificationExtra,
  reorderSiblings,
  thesisProgress,
  toPlainText,
  validateRef,
  weekWords,
  THESIS_REMINDER_BASE,
  type PlannedThesisReminder,
  type ThesisChapter,
  type ThesisMeeting,
  type ThesisReference,
  type ThesisTask,
  type ThesisWritingLog,
} from '../thesis';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const chapter = (over: Partial<ThesisChapter> = {}): ThesisChapter => ({
  id: newChapterId(),
  thesisId: 'tcc-main',
  position: 0,
  title: 'introdução',
  kind: 'capitulo',
  requiredness: 'obrigatorio',
  stage: 'a_fazer',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...over,
});

const meeting = (over: Partial<ThesisMeeting> = {}): ThesisMeeting => ({
  id: newMeetingId(),
  thesisId: 'tcc-main',
  date: '2026-10-15',
  mode: 'online',
  status: 'agendada',
  decisions: [],
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...over,
});

const task = (over: Partial<ThesisTask> = {}): ThesisTask => ({
  id: newTaskId(),
  thesisId: 'tcc-main',
  title: 'ler artigo',
  origin: 'orientadora',
  status: 'aberta',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...over,
});

const ref = (over: Partial<ThesisReference> = {}): ThesisReference => ({
  id: newReferenceId(),
  thesisId: 'tcc-main',
  readingId: 'r-1',
  status: 'candidata',
  createdAt: '2026-10-01T00:00:00.000Z',
  updatedAt: '2026-10-01T00:00:00.000Z',
  ...over,
});

const log = (over: Partial<ThesisWritingLog> = {}): ThesisWritingLog => ({
  id: newWritingLogId(),
  thesisId: 'tcc-main',
  date: '2026-10-05',
  words: 500,
  createdAt: '2026-10-05T00:00:00.000Z',
  ...over,
});

// ---------------------------------------------------------------------------
// Datas — regressão do `daysBetween`
// ---------------------------------------------------------------------------

describe('daysBetween (regressão do hero, SPEC-012 F3)', () => {
  it('é dia civil de verdade — nunca a subtração YYYYMMDD', () => {
    // O bug real: o hero calculava "dias para a entrega" subtraindo
    // `dateKeyOrdinal` (inteiro `YYYYMMDD`, feito para comparar) —
    // `20261201 - 20261008` = 1193, não 54. O aviso já estava no docstring do
    // `dayNumber`; aconteceu mesmo assim, e foi o teste da tela que pegou.
    expect(daysBetween('2026-10-08', '2026-12-01')).toBe(54);
    expect(daysBetween('2026-10-08', '2026-10-08')).toBe(0);
    // Atravessa mês e ano, incluindo fevereiro.
    expect(daysBetween('2028-02-28', '2028-03-01')).toBe(2);
    expect(daysBetween(addDays('2026-05-31', 1), '2026-06-01')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// Ordem de renderização e arrastar (INV-T2)
// ---------------------------------------------------------------------------

describe('orderChaptersForRender / commitFlatOrder / moveChapter (F4.1-F4.2)', () => {
  const cap = (id: string, position: number, parentId?: string): ThesisChapter => ({
    ...chapter({ id, position, ...(parentId ? { parentId } : {}) }),
  });

  it('renderiza topo por posição, cada um seguido das suas seções', () => {
    const chapters = [
      cap('c2', 1),
      cap('s1', 0, 'c1'),
      cap('c1', 0),
      cap('s2', 1, 'c1'),
    ];
    expect(orderChaptersForRender(chapters).map((c) => c.id)).toEqual(['c1', 's1', 's2', 'c2']);
  });

  it('órfã (parentId apagado) fica no fim — nunca some da tela', () => {
    const chapters = [cap('c1', 0), cap('orf', 3, 'fantasma')];
    expect(orderChaptersForRender(chapters).map((c) => c.id)).toEqual(['c1', 'orf']);
  });

  it('commitFlatOrder devolve a mesma referência quando nada mudou', () => {
    const chapters = [cap('c1', 0), cap('c2', 1)];
    expect(commitFlatOrder(chapters, [...chapters])).toBe(chapters);
  });

  it('commitFlatOrder reindexa só entre irmãos, na ordem renderizada', () => {
    const chapters = [cap('c1', 0), cap('c2', 1), cap('c3', 2)];
    const rendered = [chapters[2], chapters[0], chapters[1]]; // c3, c1, c2
    const next = commitFlatOrder(chapters, rendered);
    expect(next.find((c) => c.id === 'c3')?.position).toBe(0);
    expect(next.find((c) => c.id === 'c1')?.position).toBe(1);
    expect(next.find((c) => c.id === 'c2')?.position).toBe(2);
    // E o array volta na ordem canônica de render.
    expect(next.map((c) => c.id)).toEqual(['c3', 'c1', 'c2']);
  });

  it('commitFlatOrder com seções: a seção reordena entre seções, sem tocar os irmãos do pai', () => {
    const chapters = [cap('c1', 0), cap('s1', 0, 'c1'), cap('s2', 1, 'c1'), cap('c2', 1)];
    // Arrastou s2 para antes de s1 (visual: c1, s2, s1, c2).
    const rendered = [chapters[0], chapters[2], chapters[1], chapters[3]];
    const next = commitFlatOrder(chapters, rendered);
    expect(next.find((c) => c.id === 's2')?.position).toBe(0);
    expect(next.find((c) => c.id === 's1')?.position).toBe(1);
    // Os capítulos de topo continuam 0 e 1.
    expect(next.find((c) => c.id === 'c1')?.position).toBe(0);
    expect(next.find((c) => c.id === 'c2')?.position).toBe(1);
  });

  it('moveChapter sobe/desce entre irmãos e para nas bordas', () => {
    const chapters = [cap('c1', 0), cap('c2', 1), cap('c3', 2)];
    const next = moveChapter(chapters, 'c3', -1);
    // `reorderSiblings` troca as **posições** (a ordem do array é a de render).
    expect(next.find((c) => c.id === 'c3')?.position).toBe(1);
    expect(next.find((c) => c.id === 'c2')?.position).toBe(2);
    // Já no topo: não escreve.
    const moved = moveChapter(chapters, 'c1', -1);
    expect(moved).toBe(chapters);
  });
});

// ---------------------------------------------------------------------------
// Lembretes (§6.3)
// ---------------------------------------------------------------------------

describe('planThesisReminders (F4.6)', () => {
  // O default nasce **desligado** (§6.4: só liga quando a usuária ativar) — o
  // teste liga explicitamente.
  const prefs = { ...emptyThesisReminderPrefs(), enabled: true };
  // Relógio e "hoje" explícitos: o plano é puro e o teste é determinístico.
  // 08:00 — antes do `prefs.time` (09:00), para que gatilhos "no dia" contem
  // como futuro; com `now` depois das 09:00 eles seriam passados (correto).
  const today = '2026-10-08';
  const now = new Date(2026, 9, 8, 8, 0);

  it('desligado não agenda nada', () => {
    const plan = planThesisReminders(
      { thesis: emptyThesis(), chapters: [], tasks: [], meetings: [] },
      today,
      { ...prefs, enabled: false },
      now,
    );
    expect(plan).toEqual([]);
  });

  it('capítulo com prazo gera 7/1/0 dias antes, às prefs.time, e ignora pronto', () => {
    const chapters = [
      chapter({ title: 'metodologia', dueDate: '2026-10-15', stage: 'a_fazer' }),
      chapter({ title: 'pronto', dueDate: '2026-10-20', stage: 'pronto' }),
    ];
    const plan = planThesisReminders({ thesis: emptyThesis(), chapters, tasks: [], meetings: [] }, today, prefs, now);
    expect(plan.map((r) => r.target.entityId)).toEqual([chapters[0].id, chapters[0].id, chapters[0].id]);
    // Datas: 15-7=08/10, 15-1=14/10, 15=15/10 — todas às 09:00.
    expect(plan.map((r) => r.at.getDate())).toEqual([8, 14, 15]);
    expect(plan.every((r) => r.at.getHours() === 9)).toBe(true);
    expect(plan.every((r) => r.target.tab === 'capitulos')).toBe(true);
  });

  it('só agenda futuro: gatilho de 7 dias que já passou não entra', () => {
    // Prazo amanhã: 7 dias antes seria ontem — só 1/0 dias valem.
    const chapters = [chapter({ dueDate: addDays(today, 1) })];
    const plan = planThesisReminders({ thesis: emptyThesis(), chapters, tasks: [], meetings: [] }, today, prefs, now);
    expect(plan).toHaveLength(2);
  });

  it('pendência com prazo gera 1/0 dias; resolvida não gera nada', () => {
    const tasks = [task({ dueDate: '2026-10-10' }), task({ dueDate: '2026-10-10', status: 'resolvida' })];
    const plan = planThesisReminders({ thesis: emptyThesis(), chapters: [], tasks, meetings: [] }, today, prefs, now);
    expect(plan).toHaveLength(2);
    expect(plan.every((r) => r.target.tab === 'orientacao')).toBe(true);
  });

  it('reunião com hora: véspera 18:00 + 60min antes; sem hora: véspera + 09:00 do dia', () => {
    const meetings = [
      meeting({ date: '2026-10-12', time: '14:00' }),
      meeting({ date: '2026-10-13', time: undefined }),
    ];
    const plan = planThesisReminders(
      { thesis: { ...emptyThesis(), advisor: 'Helena' }, chapters: [], tasks: [], meetings },
      today,
      prefs,
      now,
    );
    const comHora = plan.filter((r) => r.body.includes('14:00'));
    expect(comHora).toHaveLength(2); // véspera (menciona às 14:00) + 1h antes (hoje às 14:00)
    const semHora = plan.filter((r) => !r.body.includes('14:00'));
    expect(semHora).toHaveLength(2);
    expect(semHora.some((r) => r.at.getHours() === 9)).toBe(true); // 09:00 do dia
    expect(plan.every((r) => r.target.tab === 'orientacao')).toBe(true);
  });

  it('reunião cancelada não gera lembrete (gate F6)', () => {
    const meetings = [meeting({ date: '2026-10-12', status: 'cancelada' })];
    const plan = planThesisReminders(
      { thesis: emptyThesis(), chapters: [], tasks: [], meetings },
      today,
      prefs,
      now,
    );
    expect(plan).toEqual([]);
  });

  it('entrega e banca geram 30/14/7/1 dias antes na aba visão geral', () => {
    const thesis = { ...emptyThesis(), deliveryDate: '2026-12-01', defenseDate: '2026-11-15' };
    const plan = planThesisReminders({ thesis, chapters: [], tasks: [], meetings: [] }, today, prefs, now);
    // 4 da banca + os da entrega que ainda são futuro a partir de 08/10.
    expect(plan.length).toBeGreaterThan(4);
    expect(plan.every((r) => r.target.tab === 'visao')).toBe(true);
    expect(plan.some((r) => r.body.includes('a entrega'))).toBe(true);
    expect(plan.some((r) => r.body.includes('a banca'))).toBe(true);
  });

  it('ordena por data, corta no teto de 64 e numera ids na faixa do TCC', () => {
    // 40 capítulos com prazo = 120 gatilhos: o teto corta em 64, mais próximos
    // primeiro.
    const chapters = Array.from({ length: 40 }, (_, i) =>
      chapter({ id: `thc-${i}`, title: `cap ${i}`, dueDate: addDays(today, 5 + i) }),
    );
    const plan = planThesisReminders({ thesis: emptyThesis(), chapters, tasks: [], meetings: [] }, today, prefs, now);
    expect(plan.length).toBeLessThanOrEqual(64);
    expect(plan[0].id).toBe(THESIS_REMINDER_BASE);
    expect(plan[plan.length - 1].id).toBe(THESIS_REMINDER_BASE + plan.length - 1);
    // Ordenado por data.
    const times = plan.map((r) => r.at.getTime());
    expect([...times].sort((a, b) => a - b)).toEqual(times);
  });
});

// ---------------------------------------------------------------------------
// Roteamento do toque na notificação (Q10)
// ---------------------------------------------------------------------------

describe('routeFromNotificationExtra (F4.7)', () => {
  it('extra válido devolve aba e focusId', () => {
    expect(routeFromNotificationExtra({ thesis: { tab: 'capitulos', entityId: 'thc-1' } })).toEqual({
      tab: 'capitulos',
      focusId: 'thc-1',
    });
    expect(routeFromNotificationExtra({ thesis: { tab: 'visao' } })).toEqual({ tab: 'visao' });
  });

  it('extra inválido, ausente ou com aba desconhecida devolve null', () => {
    expect(routeFromNotificationExtra(null)).toBeNull();
    expect(routeFromNotificationExtra('string')).toBeNull();
    expect(routeFromNotificationExtra({})).toBeNull();
    expect(routeFromNotificationExtra({ thesis: { tab: 'escrita' } })).toBeNull();
    expect(routeFromNotificationExtra({ outro: { tab: 'capitulos' } })).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// Seeds
// ---------------------------------------------------------------------------

describe('emptyThesis', () => {
  it('começa com metas vazias (INV-T7)', () => {
    const t = emptyThesis();
    expect(t.wordGoalTotal).toBeUndefined();
    expect(t.weeklyWordGoal).toBeUndefined();
  });

  it('começa sem capítulos semeados (INV-T6)', () => {
    const t = emptyThesis();
    expect(t.title).toBe('');
    expect(t.status).toBe('em_andamento');
  });
});

// ---------------------------------------------------------------------------
// isChapterDone / thesisProgress
// ---------------------------------------------------------------------------

describe('isChapterDone', () => {
  it('só é pronto quando stage é pronto (INV-T1)', () => {
    expect(isChapterDone(chapter({ stage: 'pronto' }))).toBe(true);
    expect(isChapterDone(chapter({ stage: 'a_fazer' }))).toBe(false);
    expect(isChapterDone(chapter({ stage: 'escrevendo' }))).toBe(false);
    expect(isChapterDone(chapter({ stage: 'em_revisao' }))).toBe(false);
  });
});

describe('thesisProgress', () => {
  it('0 quando não há capítulos', () => {
    expect(thesisProgress([])).toBe(0);
  });

  it('conta só stage pronto', () => {
    const chapters = [
      chapter({ stage: 'pronto' }),
      chapter({ stage: 'escrevendo' }),
      chapter({ stage: 'a_fazer' }),
      chapter({ stage: 'pronto' }),
    ];
    expect(thesisProgress(chapters)).toBe(50);
  });
});

// ---------------------------------------------------------------------------
// nextThesisDeadline
// ---------------------------------------------------------------------------

describe('nextThesisDeadline', () => {
  const thesis = emptyThesis();

  it('retorna null quando não há prazos', () => {
    expect(nextThesisDeadline(thesis, [], [], [], '2026-10-01')).toBeNull();
  });

  it('retorna o prazo mais próximo', () => {
    const chapters = [
      chapter({ title: 'cap 1', stage: 'a_fazer', dueDate: '2026-10-20' }),
      chapter({ title: 'cap 2', stage: 'a_fazer', dueDate: '2026-10-10' }),
    ];
    const result = nextThesisDeadline(thesis, chapters, [], [], '2026-10-01');
    expect(result?.entityId).toBe(chapters[1].id);
    expect(result?.date).toBe('2026-10-10');
  });

  it('ignora capítulo pronto', () => {
    const chapters = [chapter({ stage: 'pronto', dueDate: '2026-10-05' })];
    expect(nextThesisDeadline(thesis, chapters, [], [], '2026-10-01')).toBeNull();
  });

  it('marca overdue quando a data passou', () => {
    const chapters = [chapter({ stage: 'a_fazer', dueDate: '2026-09-30' })];
    const result = nextThesisDeadline(thesis, chapters, [], [], '2026-10-01');
    expect(result?.overdue).toBe(true);
  });

  it('inclui reunião agendada', () => {
    const meetings = [meeting({ date: '2026-10-12' })];
    const result = nextThesisDeadline(thesis, [], [], meetings, '2026-10-01');
    expect(result?.kind).toBe('meeting');
  });

  it('ignora reunião cancelada', () => {
    const meetings = [meeting({ status: 'cancelada' })];
    expect(nextThesisDeadline(thesis, [], [], meetings, '2026-10-01')).toBeNull();
  });

  it('inclui pendência com prazo', () => {
    const tasks = [task({ dueDate: '2026-10-08' })];
    const result = nextThesisDeadline(thesis, [], tasks, [], '2026-10-01');
    expect(result?.kind).toBe('task');
  });

  it('inclui entrega e banca', () => {
    const t = { ...thesis, deliveryDate: '2026-12-01', defenseDate: '2026-11-15' };
    const result = nextThesisDeadline(t, [], [], [], '2026-10-01');
    expect(result?.kind).toBe('milestone');
    expect(result?.entityId).toBe('defense');
  });
});

// ---------------------------------------------------------------------------
// weekWords
// ---------------------------------------------------------------------------

describe('weekWords', () => {
  it('soma só os logs da semana', () => {
    const logs = [
      log({ date: '2026-10-05', words: 300 }),
      log({ date: '2026-10-06', words: 200 }),
      log({ date: '2026-10-12', words: 999 }),
    ];
    expect(weekWords(logs, '2026-10-05')).toBe(500);
  });

  it('semana começa na segunda', () => {
    const logs = [log({ date: '2026-10-04', words: 100 })];
    expect(weekWords(logs, '2026-10-05')).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// reorderSiblings
// ---------------------------------------------------------------------------

describe('reorderSiblings', () => {
  it('reordena só entre irmãos do mesmo parentId', () => {
    const parent = chapter({ id: 'p1', parentId: undefined, position: 0 });
    const child1 = chapter({ id: 'c1', parentId: 'p1', position: 0 });
    const child2 = chapter({ id: 'c2', parentId: 'p1', position: 1 });
    const child3 = chapter({ id: 'c3', parentId: 'p1', position: 2 });
    const other = chapter({ id: 'o1', parentId: 'p2', position: 0 });

    const result = reorderSiblings([parent, child1, child2, child3, other], 'p1', 0, 2);

    expect(result.find((c) => c.id === 'c1')?.position).toBe(2);
    expect(result.find((c) => c.id === 'c2')?.position).toBe(0);
    expect(result.find((c) => c.id === 'c3')?.position).toBe(1);
    expect(result.find((c) => c.id === 'o1')?.position).toBe(0);
  });

  it('soltar na mesma posição não escreve', () => {
    const chapters = [chapter({ position: 0 }), chapter({ position: 1 })];
    const result = reorderSiblings(chapters, undefined, 0, 0);
    expect(result).toBe(chapters);
  });

  it('reindexa position de 0…n-1', () => {
    const a = chapter({ id: 'a', position: 5 });
    const b = chapter({ id: 'b', position: 9 });
    const result = reorderSiblings([a, b], undefined, 0, 1);
    expect(result.find((c) => c.id === 'a')?.position).toBe(1);
    expect(result.find((c) => c.id === 'b')?.position).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// buildThesisLinkIndex
// ---------------------------------------------------------------------------

describe('buildThesisLinkIndex', () => {
  it('deriva o vínculo a partir de readingId (INV-T4)', () => {
    const refs = [
      ref({ readingId: 'r-1', status: 'citada' }),
      ref({ readingId: 'r-2', status: 'candidata' }),
    ];
    const index = buildThesisLinkIndex(refs);
    expect(index.byReadingId.get('r-1')?.status).toBe('citada');
    expect(index.citedCount).toBe(1);
    expect(index.candidateCount).toBe(1);
  });

  it('referência sem readingId não entra no índice (INV-T4)', () => {
    const refs = [ref({ readingId: '' })];
    const index = buildThesisLinkIndex(refs);
    expect(index.byReadingId.size).toBe(0);
  });
});

// ---------------------------------------------------------------------------
// abntDataFromReading / parseAuthorString (SPEC-012 F7.1 / ADR-010)
// ---------------------------------------------------------------------------

describe('parseAuthorString', () => {
  it('"Sobrenome, Nome" vira family + given', () => {
    expect(parseAuthorString('Silva, Ana Maria')).toEqual({ family: 'Silva', given: 'Ana Maria' });
  });

  it('sem vírgula não adivinha sobrenome (F7.5)', () => {
    expect(parseAuthorString('Ana Maria Silva')).toBeNull();
  });

  it('espaços nas bordas são aparados', () => {
    expect(parseAuthorString('  Silva  ,  Ana  ')).toEqual({ family: 'Silva', given: 'Ana' });
  });
});

describe('abntDataFromReading', () => {
  const base = {
    type: 'artigo' as const,
    title: 'escuta clínica no luto',
    author: 'Silva, Ana Maria',
    year: '2024',
  };

  it('título/autor/ano chegam à forma ABNT', () => {
    const data = abntDataFromReading(base);
    const txt = toPlainText(formatAbnt(data));
    expect(txt).toContain('SILVA, Ana Maria.');
    expect(data.authors).toEqual([{ family: 'Silva', given: 'Ana Maria' }]);
  });

  it('pdf → type outro; refType sobrepõe', () => {
    expect(abntDataFromReading({ ...base, type: 'pdf' }).type).toBe('outro');
    expect(abntDataFromReading({ ...base, type: 'pdf', refType: 'artigo' }).type).toBe('artigo');
  });

  it('author sem vírgula não vira autor', () => {
    const data = abntDataFromReading({ ...base, author: 'Ana Maria Silva' });
    expect(data.authors).toEqual([]);
    expect(validateRef(data).some((m) => m.field === 'authors')).toBe(true);
  });

  it('authors estruturados vencem o author em texto', () => {
    const data = abntDataFromReading({
      ...base,
      author: 'Ordem, Inicial',
      authors: [{ family: 'Worden', given: 'J. W.' }],
    });
    expect(data.authors).toEqual([{ family: 'Worden', given: 'J. W.' }]);
  });

  it('rawCitation passa direto e vence', () => {
    const data = abntDataFromReading({
      ...base,
      type: 'livro',
      rawCitation: 'AUTORA, A. (2023). texto manual.',
    });
    expect(toPlainText(formatAbnt(data))).toBe('AUTORA, A. (2023). texto manual.');
  });
});

// ---------------------------------------------------------------------------
// formatAbnt
// ---------------------------------------------------------------------------

describe('formatAbnt', () => {
  const base = {
    type: 'artigo' as const,
    authors: [{ family: 'Silva', given: 'Ana Maria' }],
    title: 'escuta clínica no luto',
    year: '2024',
  };

  it('artigo com todos os campos', () => {
    const ref = {
      ...base,
      container: 'Revista de Psicologia',
      place: 'São Paulo',
      volume: '12',
      issue: '3',
      pages: '45-60',
      doi: '10.1234/abc',
      url: 'https://exemplo.org/artigo',
      accessedOn: '2026-10-01',
    };
    const segments = formatAbnt(ref);
    const text = toPlainText(segments);
    expect(text).toContain('SILVA, Ana Maria.');
    expect(text).toContain('escuta clínica no luto.');
    expect(text).toContain('Revista de Psicologia, São Paulo, v. 12, n. 3, p. 45-60, 2024.');
    expect(text).toContain('DOI: 10.1234/abc.');
    expect(text).toContain('Disponível em: https://exemplo.org/artigo.');
    expect(text).toContain('Acesso em: 1 out. 2026.');
    // O negrito é do periódico (§7.1), nunca do título do artigo.
    expect(segments.find((s) => s.bold)?.text).toBe('Revista de Psicologia');
  });

  it('até 3 autores listados', () => {
    const ref = {
      ...base,
      authors: [
        { family: 'Silva', given: 'Ana' },
        { family: 'Santos', given: 'Bruno' },
        { family: 'Oliveira', given: 'Carla' },
      ],
    };
    const text = toPlainText(formatAbnt(ref));
    expect(text).toContain('SILVA, Ana; SANTOS, Bruno; OLIVEIRA, Carla.');
  });

  it('a partir de 4 autores: primeiro + et al.', () => {
    const ref = {
      ...base,
      authors: [
        { family: 'Silva', given: 'Ana' },
        { family: 'Santos', given: 'Bruno' },
        { family: 'Oliveira', given: 'Carla' },
        { family: 'Costa', given: 'Diego' },
      ],
    };
    const text = toPlainText(formatAbnt(ref));
    expect(text).toContain('SILVA, Ana; et al.');
  });

  it('listAllAuthors força a lista completa', () => {
    const ref = {
      ...base,
      authors: [
        { family: 'Silva', given: 'Ana' },
        { family: 'Santos', given: 'Bruno' },
        { family: 'Oliveira', given: 'Carla' },
        { family: 'Costa', given: 'Diego' },
      ],
    };
    const text = toPlainText(formatAbnt(ref, { listAllAuthors: true }));
    expect(text).toContain('COSTA, Diego');
  });

  it('sobrenome em caixa alta, preposição não é adivinhada', () => {
    const ref = { ...base, authors: [{ family: 'de Souza', given: 'Ana' }] };
    const text = toPlainText(formatAbnt(ref));
    expect(text).toContain('DE SOUZA, Ana.');
  });

  it('sem ano não inventa s.d. (§7.1: só se a usuária marcar)', () => {
    const ref = { ...base, year: undefined };
    const text = toPlainText(formatAbnt(ref));
    expect(text).not.toContain('s.d.');
  });

  it('s.d. digitado pela usuária aparece como veio', () => {
    const ref = { ...base, year: 's.d.' };
    const text = toPlainText(formatAbnt(ref));
    expect(text).toContain('s.d.');
  });

  it('online sem accessedOn não inventa data', () => {
    const ref = { ...base, url: 'https://exemplo.org' };
    const text = toPlainText(formatAbnt(ref));
    expect(text).not.toContain('Acesso em:');
  });

  it('livro', () => {
    const ref = {
      type: 'livro' as const,
      authors: [{ family: 'Worden', given: 'J. W.' }],
      title: 'Tratamento do luto',
      subtitle: 'um guia para o profissional',
      edition: '4',
      place: 'São Paulo',
      publisher: 'Roca',
      year: '2018',
    };
    const segments = formatAbnt(ref);
    const text = toPlainText(segments);
    expect(text).toContain('WORDEN, J. W..');
    expect(text).toContain('Tratamento do luto: um guia para o profissional.');
    expect(text).toContain('4 ed. São Paulo: Roca, 2018.');
    // No livro o negrito é do título (§7.1).
    expect(segments.find((s) => s.bold)?.text).toBe('Tratamento do luto');
  });

  it('capítulo de livro', () => {
    const ref = {
      type: 'capitulo' as const,
      authors: [{ family: 'Bowlby', given: 'J.' }],
      title: 'a perda afetiva',
      container: 'Separação: ansiedade e raiva',
      place: 'Londres',
      publisher: 'Hogarth',
      year: '1980',
      pages: '15-40',
    };
    const segments = formatAbnt(ref);
    const text = toPlainText(segments);
    expect(text).toContain('BOWLBY, J.. a perda afetiva. In: ');
    expect(text).toContain('Separação: ansiedade e raiva. ');
    expect(text).toContain('Londres: Hogarth, 1980.');
    expect(text).toContain('p. 15-40.');
    // No capítulo o negrito é do título do livro (`container`).
    expect(segments.find((s) => s.bold)?.text).toBe('Separação: ansiedade e raiva');
  });

  it('site', () => {
    const ref = {
      type: 'site' as const,
      authors: [{ family: 'ABNT' }],
      title: 'normas de citação',
      container: 'Site ABNT',
      year: '2025',
      url: 'https://abnt.org',
      accessedOn: '2026-09-15',
    };
    const segments = formatAbnt(ref);
    const text = toPlainText(segments);
    expect(text).toContain('ABNT.');
    expect(text).toContain('Site ABNT, 2025.');
    expect(text).toContain('Disponível em: https://abnt.org.');
    expect(text).toContain('Acesso em: 15 set. 2026.');
    // No site o negrito é do nome do site (`container`).
    expect(segments.find((s) => s.bold)?.text).toBe('Site ABNT');
  });

  it('tese', () => {
    const ref = {
      type: 'tese' as const,
      authors: [{ family: 'Freud', given: 'S.' }],
      title: 'a interpretação dos sonhos',
      year: '1900',
      institution: 'Universidade de Viena',
      degree: 'doutorado',
    };
    const text = toPlainText(formatAbnt(ref));
    expect(text).toContain('FREUD, S..');
    expect(text).toContain('Tese (doutorado) — Universidade de Viena, 1900.');
  });

  it('rawCitation sempre vence', () => {
    const ref = { ...base, rawCitation: 'SILVA, A. (2024). texto manual.' };
    const text = toPlainText(formatAbnt(ref));
    expect(text).toBe('SILVA, A. (2024). texto manual.');
  });

  it('outro usa campos soltos', () => {
    const ref = { type: 'outro' as const, authors: [], title: 'referência avulsa', year: '2020' };
    const text = toPlainText(formatAbnt(ref));
    expect(text).toContain('referência avulsa');
    expect(text).toContain('2020');
  });
});

// ---------------------------------------------------------------------------
// validateRef
// ---------------------------------------------------------------------------

describe('validateRef', () => {
  it('artigo exige autor, título, periódico e ano', () => {
    const missing = validateRef({ type: 'artigo', authors: [], title: '', container: '', year: '' });
    expect(missing.map((m) => m.field)).toEqual(['authors', 'title', 'container', 'year']);
  });

  it('livro exige editora e ano', () => {
    const missing = validateRef({ type: 'livro', authors: [{ family: 'X' }], title: 'T', publisher: '', year: '' });
    expect(missing.map((m) => m.field)).toEqual(['publisher', 'year']);
  });

  it('online sem accessedon marca acesso', () => {
    const missing = validateRef({
      type: 'artigo',
      authors: [{ family: 'X' }],
      title: 'T',
      container: 'C',
      year: '2024',
      url: 'https://exemplo.org',
    });
    expect(missing.map((m) => m.field)).toEqual(['accessedOn']);
  });

  it('não bloqueia: retorna lista vazia quando está completo', () => {
    const missing = validateRef({
      type: 'artigo',
      authors: [{ family: 'X' }],
      title: 'T',
      container: 'C',
      year: '2024',
    });
    expect(missing).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// normalizeUrl / extractFirstUrl / isValidUrl
// ---------------------------------------------------------------------------

describe('normalizeUrl', () => {
  it('remove utm, fbclid, gclid e fragmento', () => {
    expect(normalizeUrl('https://exemplo.org/artigo?utm_source=newsletter&fbclid=abc&gclid=xyz#topo')).toBe(
      'https://exemplo.org/artigo',
    );
  });

  it('remove barra final', () => {
    expect(normalizeUrl('https://exemplo.org/')).toBe('https://exemplo.org');
  });

  it('mantém o resto', () => {
    expect(normalizeUrl('https://exemplo.org/artigo?page=2')).toBe('https://exemplo.org/artigo?page=2');
  });

  it('devolve a entrada se não é URL válida', () => {
    expect(normalizeUrl('não é url')).toBe('não é url');
  });
});

describe('extractFirstUrl', () => {
  it('extrai a primeira URL de um texto livre', () => {
    expect(extractFirstUrl('olha esse artigo https://exemplo.org/artigo e esse outro https://outro.org')).toBe(
      'https://exemplo.org/artigo',
    );
  });

  it('só URL', () => {
    expect(extractFirstUrl('https://exemplo.org')).toBe('https://exemplo.org');
  });

  it('sem URL', () => {
    expect(extractFirstUrl('texto sem link')).toBeNull();
  });

  it('duas URLs: pega a primeira', () => {
    expect(extractFirstUrl('https://a.org https://b.org')).toBe('https://a.org');
  });
});

describe('isValidUrl', () => {
  it('aceita http e https', () => {
    expect(isValidUrl('http://exemplo.org')).toBe(true);
    expect(isValidUrl('https://exemplo.org')).toBe(true);
  });

  it('recusar javascript:, file:, data:', () => {
    expect(isValidUrl('javascript:alert(1)')).toBe(false);
    expect(isValidUrl('file:///etc/passwd')).toBe(false);
    expect(isValidUrl('data:text/html,<h1>oi</h1>')).toBe(false);
  });

  it('recusa URL acima de 2048 caracteres', () => {
    expect(isValidUrl(`https://exemplo.org/${'a'.repeat(2100)}`)).toBe(false);
  });

  it('recusa texto sem protocolo', () => {
    expect(isValidUrl('exemplo.org')).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// IDs
// ---------------------------------------------------------------------------

// ---------------------------------------------------------------------------
// Captura de link (F8)
// ---------------------------------------------------------------------------

describe('captureLink (F8.1)', () => {
  const now = '2026-10-09T12:00:00.000Z';

  it('artigo pro TCC cria leitura + referência candidata', () => {
    const r = captureLink(
      { url: 'https://exemplo.org/artigo?utm_source=x', kind: 'artigo', thesis: true },
      [],
      now,
    );
    expect(r.outcome).toBe('criada');
    if (r.outcome !== 'criada') return;
    expect(r.reading.id).toMatch(/^rdr-/);
    expect(r.reading.type).toBe('artigo');
    expect(r.reading.refType).toBe('artigo');
    expect(r.reading.status).toBe('nao_iniciado');
    expect(r.reading.author).toBe('autor não informado');
    expect(r.reading.url).toBe('https://exemplo.org/artigo');
    expect(r.reading.enrichStatus).toBe('pendente');
    expect(r.reference).not.toBeNull();
    expect(r.reference?.readingId).toBe(r.reading.id);
    expect(r.reference?.status).toBe('candidata');
    expect(r.reference?.createdAt).toBe(now);
  });

  it('sem título, o título provisório é o host', () => {
    const r = captureLink({ url: 'https://exemplo.org/x', kind: 'artigo', thesis: false }, [], now);
    if (r.outcome !== 'criada') throw new Error('esperava criada');
    expect(r.reading.title).toBe('exemplo.org');
    expect(r.reference).toBeNull();
  });

  it('leitura (livro) não TCC só cria a leitura, tipo livro', () => {
    const r = captureLink({ url: 'https://loja.org/livro', kind: 'leitura', thesis: false }, [], now);
    if (r.outcome !== 'criada') throw new Error('esperava criada');
    expect(r.reading.type).toBe('livro');
    expect(r.reading.refType).toBe('livro');
    expect(r.reference).toBeNull();
  });

  it('URL inválida é recusada', () => {
    expect(captureLink({ url: 'javascript:alert(1)', kind: 'artigo', thesis: true }, [], now)).toEqual({
      outcome: 'invalida',
    });
  });

  it('dedupe por URL normalizada devolve a leitura existente', () => {
    const existing = [{ id: 'rdr-velha', url: 'https://exemplo.org/artigo' }];
    const r = captureLink(
      { url: 'https://exemplo.org/artigo?utm_source=news#topo', kind: 'artigo', thesis: true },
      existing,
      now,
    );
    expect(r).toEqual({ outcome: 'duplicada', readingId: 'rdr-velha' });
  });
});

describe('parseCaptureDeepLink (F8.4)', () => {
  it('lê u/k/t/x com URL-encoding', () => {
    const link = parseCaptureDeepLink(
      'cecistudy://captura?u=' + encodeURIComponent('https://exemplo.org/artigo') + '&k=leitura&t=0&x=abc',
    );
    expect(link).toEqual({ url: 'https://exemplo.org/artigo', kind: 'leitura', thesis: false, id: 'abc' });
  });

  it('padrões: artigo e pro TCC sem parâmetros', () => {
    const link = parseCaptureDeepLink('cecistudy://captura?u=' + encodeURIComponent('https://exemplo.org'));
    expect(link).toEqual({ url: 'https://exemplo.org', kind: 'artigo', thesis: true, id: undefined });
  });

  it('recusa esquema ou host errados', () => {
    expect(parseCaptureDeepLink('cecistudy://outro?u=https://x.org')).toBeNull();
    expect(parseCaptureDeepLink('outro://captura?u=https://x.org')).toBeNull();
  });

  it('recusa quando a URL não é http(s)', () => {
    expect(parseCaptureDeepLink('cecistudy://captura?u=' + encodeURIComponent('file:///etc'))).toBeNull();
    expect(parseCaptureDeepLink('cecistudy://captura')).toBeNull();
  });
});

describe('ids', () => {
  it('prefixos thc, thr, thm, tts, twl, rdr', () => {
    expect(newChapterId()).toMatch(/^thc-/);
    expect(newReferenceId()).toMatch(/^thr-/);
    expect(newReadingId()).toMatch(/^rdr-/);
    expect(newMeetingId()).toMatch(/^thm-/);
    expect(newTaskId()).toMatch(/^tts-/);
    expect(newWritingLogId()).toMatch(/^twl-/);
  });
});
