import { describe, expect, it } from 'vitest';
import { buildItemContext, clampPageInput } from '../contextActions';
import type { ManagedDB } from '../entityOps';

const todayISO = () => new Date().toISOString().split('T')[0];
const yesterday = () => {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toISOString().split('T')[0];
};

function makeDb(overrides: Partial<ManagedDB> = {}): ManagedDB {
   return {
     courses: [{ id: 'c1', name: 'Psicopatologia I' } as never],
     classes: [],
     tasks: [],
     exams: [],
     authors: [],
     concepts: [],
     readings: [],
     flashcards: [],
     materials: [],
     internshipLogs: [],
     sessions: [],
     quizSessions: [],
     looseNotes: [],
     bookmarkedCourseIds: [],
     ...overrides,
   };
 }

describe('clampPageInput', () => {
  it('aceita valor maior que a atual e dentro do total', () => {
    expect(clampPageInput(42, '48', 180)).toBe(48);
    expect(clampPageInput(42, 43)).toBe(43);
  });

  it('rejeita menor que a página atual', () => {
    expect(clampPageInput(42, '10', 180)).toBeNull();
  });

  it('rejeita acima do total conhecido', () => {
    expect(clampPageInput(42, '200', 180)).toBeNull();
  });

  it('total desconhecido aceita qualquer valor ≥ atual', () => {
    expect(clampPageInput(42, '9999')).toBe(9999);
  });

  it('rejeita entrada não numérica', () => {
    expect(clampPageInput(42, 'abc')).toBeNull();
  });
});

describe('buildItemContext — task', () => {
  it('tarefa pendente recomenda concluir', () => {
    const db = makeDb({
      tasks: [
        {
          id: 't1',
          title: 'ler capítulo 4',
          completed: false,
          priority: 'alta',
          category: 'leitura',
          dueDate: '2026-09-01',
        } as never,
      ],
    });
    const ctx = buildItemContext('task', 't1', db);
    expect(ctx?.name).toBe('ler capítulo 4');
    expect(ctx?.status).toBe('pendente');
    expect(ctx?.meta).toContain('prazo');
    expect(ctx?.recommended?.id).toBe('toggle-done');
    expect(ctx?.recommended?.label).toBe('marcar como concluída');
    expect(ctx?.recommended?.tone).toBe('primary');
    expect(ctx?.actions.map((a) => a.id)).toEqual(['edit']);
  });

  it('tarefa concluída recomenda reabrir e mostra "sem prazo" quando não há data', () => {
    const db = makeDb({
      tasks: [
        { id: 't1', title: 'x', completed: true, priority: 'baixa', category: 'outro' } as never,
      ],
    });
    const ctx = buildItemContext('task', 't1', db);
    expect(ctx?.status).toBe('concluída');
    expect(ctx?.meta).toBe('sem prazo');
    expect(ctx?.recommended?.label).toBe('reabrir tarefa');
    expect(ctx?.recommended?.tone).toBe('neutral');
  });

  it('retorna null para item inexistente', () => {
    expect(buildItemContext('task', 'zzz', makeDb())).toBeNull();
  });
});

describe('buildItemContext — exam', () => {
  it('prova pendente recomenda concluir; concluída recomenda reabrir', () => {
    const base = { id: 'e1', title: 'P2', courseId: 'c1' };
    const pending = buildItemContext('exam', 'e1', makeDb({ exams: [{ ...base, completed: false }] as never }));
    expect(pending?.recommended?.id).toBe('toggle-done');
    const done = buildItemContext('exam', 'e1', makeDb({ exams: [{ ...base, completed: true }] as never }));
    expect(done?.recommended?.label).toBe('reabrir prova');
  });
});

describe('buildItemContext — reading', () => {
  it('não iniciada recomenda começar leitura', () => {
    const db = makeDb({
      readings: [
        { id: 'r1', title: 'A interpretação dos sonhos', status: 'nao_iniciado', readPages: 0, totalPages: 180 } as never,
      ],
    });
    const ctx = buildItemContext('reading', 'r1', db);
    expect(ctx?.status).toBe('não iniciada');
    expect(ctx?.meta).toBe('0 de 180 páginas');
    expect(ctx?.recommended?.label).toBe('começar leitura');
    expect(ctx?.recommended?.id).toBe('reading-progress');
  });

  it('em andamento recomenda adicionar páginas lidas', () => {
    const db = makeDb({
      readings: [
        { id: 'r1', title: 'X', status: 'lendo', readPages: 42, totalPages: 180 } as never,
      ],
    });
    const ctx = buildItemContext('reading', 'r1', db);
    expect(ctx?.status).toBe('em andamento');
    expect(ctx?.meta).toBe('42 de 180 páginas');
    expect(ctx?.recommended?.label).toBe('adicionar páginas lidas');
  });

  it('concluída não tem ação recomendada', () => {
    const db = makeDb({
      readings: [
        { id: 'r1', title: 'X', status: 'concluido', readPages: 180, totalPages: 180 } as never,
      ],
    });
    const ctx = buildItemContext('reading', 'r1', db);
    expect(ctx?.status).toBe('concluída');
    expect(ctx?.recommended).toBeUndefined();
  });

  it('total desconhecido mostra apenas contagem de páginas', () => {
    const db = makeDb({
      readings: [{ id: 'r1', title: 'X', status: 'lendo', readPages: 12 } as never],
    });
    const ctx = buildItemContext('reading', 'r1', db);
    expect(ctx?.meta).toBe('12 páginas');
  });
});

describe('buildItemContext — catalogBook', () => {
  const catalog = [
    { id: 'bk-1', title: 'O cérebro e o inconsciente', totalPages: 180 },
    { id: 'bk-2', title: 'Sem total de páginas' },
  ];

  it('livro em andamento recomenda progresso e oferece guardar/remover salvos', () => {
    const db = makeDb({
      catalogBooks: catalog,
      savedBookIds: ['bk-1'],
      readingProgress: { 'bk-1': 42 },
    });
    const ctx = buildItemContext('catalogBook', 'bk-1', db);
    expect(ctx?.name).toBe('O cérebro e o inconsciente');
    expect(ctx?.status).toBe('em andamento');
    expect(ctx?.recommended?.id).toBe('reading-progress');
    expect(ctx?.actions.map((a) => a.id)).toEqual(['toggle-save']);
    expect(ctx?.actions[0].label).toBe('remover dos salvos');
  });

  it('livro não salvo e sem progresso recomenda começar leitura + guardar', () => {
    const db = makeDb({ catalogBooks: catalog, savedBookIds: [], readingProgress: {} });
    const ctx = buildItemContext('catalogBook', 'bk-1', db);
    expect(ctx?.recommended?.label).toBe('começar leitura');
    expect(ctx?.actions[0].label).toBe('guardar livro');
  });

  it('livro concluído não tem recomendada; livro sem total usa progresso do mapa', () => {
    const done = buildItemContext('catalogBook', 'bk-1', makeDb({
      catalogBooks: catalog,
      readingProgress: { 'bk-1': 180 },
    }));
    expect(done?.status).toBe('concluída');
    expect(done?.recommended).toBeUndefined();

    const openTotal = buildItemContext('catalogBook', 'bk-2', makeDb({
      catalogBooks: catalog,
      readingProgress: { 'bk-2': 30 },
    }));
    expect(openTotal?.meta).toBe('30 páginas');
  });
});

describe('buildItemContext — class', () => {
  it('aula completa recomenda revisar; incompleta recomenda continuar', () => {
    const completeCtx = buildItemContext('class', 'cl-1', makeDb({
      classes: [{ id: 'cl-1', title: 'Ansiedade', courseId: 'c1', fullNotes: 'texto', date: '2026-08-20' } as never],
    }));
    expect(completeCtx?.status).toBe('completa');
    expect(completeCtx?.recommended?.label).toBe('revisar anotação');

    const incompleteCtx = buildItemContext('class', 'cl-1', makeDb({
      classes: [{ id: 'cl-1', title: 'Ansiedade', courseId: 'c1', date: '2026-08-20' } as never],
    }));
    expect(incompleteCtx?.status).toBe('para completar');
    expect(incompleteCtx?.recommended?.label).toBe('continuar anotação');
  });
});

describe('buildItemContext — flashcard', () => {
  it('cartão nunca revisado está vencido e recomenda revisar agora', () => {
    const db = makeDb({
      flashcards: [{ id: 'f1', question: 'o que é transferência?' } as never],
    });
    const ctx = buildItemContext('flashcard', 'f1', db);
    expect(ctx?.status).toBe('para revisar');
    expect(ctx?.recommended?.id).toBe('review-flashcard');
    expect(ctx?.recommended?.label).toBe('revisar agora');
  });

  it('cartão revisado hoje não tem recomendada; revisado ontem volta a vencer', () => {
    const reviewedToday = buildItemContext('flashcard', 'f1', makeDb({
      flashcards: [{ id: 'f1', question: 'q', lastReviewed: todayISO() } as never],
    }));
    expect(reviewedToday?.recommended).toBeUndefined();
    expect(reviewedToday?.status).toBe('revisado hoje');

    const reviewedYesterday = buildItemContext('flashcard', 'f1', makeDb({
      flashcards: [{ id: 'f1', question: 'q', lastReviewed: yesterday() } as never],
    }));
    expect(reviewedYesterday?.recommended?.id).toBe('review-flashcard');
  });

  it('mostra o conceito vinculado como meta', () => {
    const db = makeDb({
      concepts: [{ id: 'con-1', name: 'Transferência' } as never],
      flashcards: [{ id: 'f1', question: 'q', conceptId: 'con-1' } as never],
    });
    expect(buildItemContext('flashcard', 'f1', db)?.meta).toBe('conceito: Transferência');
  });
});

describe('buildItemContext — course', () => {
  it('conta registros e ajusta o rótulo da recomendada', () => {
    const withRecords = makeDb({
      classes: [{ id: 'cl-1', title: 'A', courseId: 'c1' } as never],
      tasks: [{ id: 't1', title: 'T', disciplineId: 'c1', completed: false, priority: 'baixa', category: 'outro' } as never],
    });
    const ctx = buildItemContext('course', 'c1', withRecords);
    expect(ctx?.status).toBe('2 registros');
    expect(ctx?.recommended?.label).toBe('adicionar registro');

    const empty = buildItemContext('course', 'c1', makeDb());
    expect(empty?.status).toBe('sem registros ainda');
    expect(empty?.recommended?.label).toBe('adicionar primeiro registro');
  });
});

describe('buildItemContext — looseNote', () => {
  it('nota curta recomenda transformar; nota longa recomenda continuar editando com transformar nas comuns', () => {
    const short = buildItemContext('looseNote', 'n1', makeDb({
      looseNotes: [{ id: 'n1', title: 'ideia', content: 'curta', category: 'ideia', date: '' } as never],
    }));
    expect(short?.recommended?.id).toBe('transform-note');
    expect(short?.recommended?.label).toBe('transformar em tarefa');
    expect(short?.actions).toHaveLength(0);

    const long = buildItemContext('looseNote', 'n1', makeDb({
      looseNotes: [{ id: 'n1', title: 'ensaio', content: 'x'.repeat(300), category: 'reflexão', date: '' } as never],
    }));
    expect(long?.recommended?.id).toBe('edit');
    expect(long?.actions.map((a) => a.id)).toEqual(['transform-note']);
  });
});

describe('buildItemContext — concept / author / material / session / internship / quizSession', () => {
  it('conceito recomenda criar flashcard', () => {
    const ctx = buildItemContext('concept', 'con-1', makeDb({
      concepts: [{ id: 'con-1', name: 'Vínculo', authorIds: [], courseIds: [], tags: [] } as never],
    }));
    expect(ctx?.recommended?.id).toBe('create-flashcard');
  });

  it('autor recomenda conceitos relacionados', () => {
    const ctx = buildItemContext('author', 'aut-1', makeDb({
      authors: [{ id: 'aut-1', name: 'Melanie Klein', bio: '', keyConcepts: [], majorWorks: [] } as never],
    }));
    expect(ctx?.recommended?.id).toBe('view-related');
  });

  it('material com link recomenda abrir; sem link cai para editar', () => {
    const withUrl = buildItemContext('material', 'm1', makeDb({
      materials: [{ id: 'm1', title: 'Artigo', type: 'artigo', author: '', url: 'https://x', tags: [], addedAt: '' } as never],
    }));
    expect(withUrl?.recommended?.id).toBe('open-link');
    expect(withUrl?.actions.map((a) => a.id)).toEqual(['edit']);

    const noUrl = buildItemContext('material', 'm1', makeDb({
      materials: [{ id: 'm1', title: 'Artigo', type: 'artigo', author: '', tags: [], addedAt: '' } as never],
    }));
    expect(noUrl?.recommended?.id).toBe('edit');
  });

  it('sessão recomenda ver no histórico', () => {
    const ctx = buildItemContext('session', 'ss-1', makeDb({
      sessions: [{ id: 'ss-1', topic: 'pomodoro', date: '2026-08-21', durationMinutes: 25 } as never],
    }));
    expect(ctx?.recommended?.id).toBe('view-history');
    expect(ctx?.meta).toContain('25 min');
  });

  it('registro de estágio incompleto recomenda continuar registro (ação de editar)', () => {
    const ctx = buildItemContext('internship', 'ilog-1', makeDb({
      internshipLogs: [{ id: 'ilog-1', type: 'estagio', activity: 'triagem', hours: 4, date: '2026-08-21', reflections: '' } as never],
    }));
    expect(ctx?.status).toBe('incompleto');
    expect(ctx?.recommended?.id).toBe('edit');
    expect(ctx?.recommended?.label).toBe('continuar registro');
    expect(ctx?.actions).toHaveLength(0); // edit já é a recomendada
  });

  it('quiz com erros recomenda revisar erros e mostra contagem; quiz perfeito não tem recomendada', () => {
    const base = {
      id: 'qs-1',
      startedAt: 0,
      finishedAt: Date.now(),
      totalTimeMs: 1000,
      config: {} as never,
      answers: [],
      createdAt: '',
    };
    const withErrors = buildItemContext('quizSession', 'qs-1', makeDb({
      quizSessions: [{ ...base, correctCount: 3, totalCount: 5, scorePct: 60 } as never],
    }));
    expect(withErrors?.recommended?.id).toBe('review-quiz');
    expect(withErrors?.meta).toContain('2 erros');
    expect(withErrors?.status).toBe('60% de acerto');

    const perfect = buildItemContext('quizSession', 'qs-1', makeDb({
      quizSessions: [{ ...base, correctCount: 5, totalCount: 5, scorePct: 100 } as never],
    }));
    expect(perfect?.recommended).toBeUndefined();
  });
});
