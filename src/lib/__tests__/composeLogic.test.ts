import { describe, expect, it } from 'vitest';
import {
  LOOKS_LIKE_CLASS_THRESHOLD,
  buildClassNoteFromCompose,
  buildLooseNoteFromCompose,
  composeTitle,
  emptyDraft,
  initialCourseId,
  initialMode,
  looksLikeClassNote,
  nextClassNumber,
  nextComposePrefs,
  shouldShowClassNudge,
} from '../composeLogic';
import type { ClassNote } from '../../types';

const classes: Pick<ClassNote, 'courseId' | 'number'>[] = [
  { courseId: 'c1', number: 3 },
  { courseId: 'c1', number: 5 },
  { courseId: 'c2', number: 2 },
];

describe('initialMode', () => {
  it('força aula quando veio de um contexto de disciplina', () => {
    expect(initialMode('c3', { mode: 'avulsa' })).toBe('aula');
  });

  it('usa a última preferência quando aberto avulso', () => {
    expect(initialMode(undefined, { mode: 'aula', courseId: 'c1' })).toBe('aula');
    expect(initialMode(undefined, { mode: 'avulsa' })).toBe('avulsa');
  });

  it('padrão é avulsa sem contexto e sem preferência', () => {
    expect(initialMode(undefined, undefined)).toBe('avulsa');
  });
});

describe('initialCourseId', () => {
  it('contexto vence a preferência', () => {
    expect(initialCourseId('c2', { mode: 'aula', courseId: 'c1' }, [{ id: 'c9' }])).toBe('c2');
  });

  it('preferência vence o primeiro do catálogo', () => {
    expect(initialCourseId(undefined, { mode: 'aula', courseId: 'c1' }, [{ id: 'c9' }])).toBe('c1');
  });

  it('cai no primeiro do catálogo quando não há preferência', () => {
    expect(initialCourseId(undefined, undefined, [{ id: 'c9' }])).toBe('c9');
  });

  it('undefined quando não há nenhuma disciplina', () => {
    expect(initialCourseId(undefined, undefined, [])).toBeUndefined();
  });
});

describe('nextClassNumber', () => {
  it('maior número + 1 para a disciplina', () => {
    expect(nextClassNumber(classes, 'c1')).toBe(6);
    expect(nextClassNumber(classes, 'c2')).toBe(3);
  });

  it('começa em 1 sem aulas da disciplina', () => {
    expect(nextClassNumber(classes, 'c3')).toBe(1);
  });

  it('começa em 1 sem disciplina', () => {
    expect(nextClassNumber(classes, undefined)).toBe(1);
  });
});

describe('looksLikeClassNote / shouldShowClassNudge', () => {
  it('texto curto nunca parece aula', () => {
    expect(looksLikeClassNote('oi', true)).toBe(false);
  });

  it('texto longo parece aula apenas quando há disciplinas', () => {
    const long = 'x'.repeat(LOOKS_LIKE_CLASS_THRESHOLD);
    expect(looksLikeClassNote(long, true)).toBe(true);
    expect(looksLikeClassNote(long, false)).toBe(false);
  });

  it('nudge só aparece no modo avulsa', () => {
    const long = 'x'.repeat(LOOKS_LIKE_CLASS_THRESHOLD);
    expect(shouldShowClassNudge(long, 'avulsa', true)).toBe(true);
    expect(shouldShowClassNudge(long, 'aula', true)).toBe(false);
    expect(shouldShowClassNudge(long, 'avulsa', false)).toBe(false);
  });

  it('nudge respeita texto com espaços apenas', () => {
    expect(shouldShowClassNudge('   ', 'avulsa', true)).toBe(false);
  });
});

describe('composeTitle', () => {
  it('título contextual conforme o modo', () => {
    expect(composeTitle('aula', 'psicologia clínica')).toBe('anotar aula de psicologia clínica');
    expect(composeTitle('aula')).toBe('anotar aula');
    expect(composeTitle('avulsa')).toBe('nova nota');
  });
});

describe('nextComposePrefs', () => {
  it('aula guarda a disciplina; avulsa esquece', () => {
    expect(nextComposePrefs('aula', 'c1')).toEqual({ mode: 'aula', courseId: 'c1' });
    expect(nextComposePrefs('avulsa', 'c1')).toEqual({ mode: 'avulsa' });
  });
});

describe('buildClassNoteFromCompose', () => {
  it('monta aula com número, data hoje e conteúdo', () => {
    const note = buildClassNoteFromCompose({
      text: 'parcialidade seletiva\nsegunda linha',
      tag: 'depressão',
      courseId: 'c1',
      number: 6,
      rating: 5,
    });
    expect(note.courseId).toBe('c1');
    expect(note.title).toBe('depressão');
    expect(note.number).toBe(6);
    expect(note.summary).toContain('segunda linha');
    expect(note.rating).toBe(5);
    expect(note.hasQuestions).toBe(false);
    expect(note.date).toBe(new Date().toISOString().split('T')[0]);
  });

  it('usa a primeira linha como título quando sem tag', () => {
    const note = buildClassNoteFromCompose({
      text: 'vínculo terapêutico\nlinha 2',
      tag: '',
      courseId: 'c1',
      number: 1,
      rating: 0,
    });
    expect(note.title).toBe('vínculo terapêutico');
    expect(note.rating).toBeUndefined();
  });
});

describe('buildLooseNoteFromCompose', () => {
  it('mantém o vínculo de matéria quando escolhido (bugfix)', () => {
    const note = buildLooseNoteFromCompose({
      text: 'ideia solta',
      category: 'ideia',
      courseId: 'c1',
    });
    expect(note.courseId).toBe('c1');
    expect(note.content).toBe('ideia solta');
    expect(note.category).toBe('ideia');
  });

  it('não inventa vínculo quando não escolhido', () => {
    const note = buildLooseNoteFromCompose({ text: 'reflexão', category: 'reflexão' });
    expect(note.courseId).toBeUndefined();
  });

  it('título padrão acolhedor quando vazio', () => {
    const note = buildLooseNoteFromCompose({ text: '   ', category: 'lembrete' });
    expect(note.title).toBe('nota sem título');
  });
});

describe('emptyDraft', () => {
  it('começa zerado no modo avulsa', () => {
    expect(emptyDraft()).toEqual({
      text: '',
      mode: 'avulsa',
      courseId: undefined,
      category: 'reflexão',
      tag: '',
      rating: 0,
    });
  });
});