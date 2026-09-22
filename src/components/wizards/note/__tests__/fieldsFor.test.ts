import { describe, expect, it, vi, beforeEach, afterEach, type Mock } from 'vitest';
import type { ClassNote, Course, LooseNote, NoteTargetType } from '../../../../types';
import {
  FIELDS_FOR,
  hydrateTransform,
  type TransformSaveActions,
  type TransformValues,
} from '../fieldsFor';

const note = (over: Partial<LooseNote> = {}): LooseNote => ({
  id: 'n-1',
  title: 'tríade cognitiva',
  content: 'conteúdo da nota sobre beck',
  category: 'estudo',
  date: '2026-01-01',
  courseId: 'c1',
  conceptIds: ['con-1'],
  authorIds: ['aut-1'],
  approachIds: ['app-1'],
  materialIds: [],
  ...over,
});

const courses: Course[] = [
  {
    id: 'c1', name: 'psicopatologia', code: 'PSI-1', professor: 'x',
    semester: '1', schedule: [], room: '', color: '#fff', icon: 'Brain',
  },
];

const classes: ClassNote[] = [
  {
    id: 'cl-1', courseId: 'c1', title: 'aula 1', number: 3, date: '2026-01-01',
    summary: '', fullNotes: '', conceptIds: [], authorIds: [], materials: [], hasQuestions: false,
  },
];

describe('hydrateTransform', () => {
  it('pré-preenche cada destino a partir da nota', () => {
    const v = hydrateTransform(note(), courses, classes);
    expect(v.title).toBe('tríade cognitiva');
    expect(v.courseId).toBe('c1');
    expect(v.classNumber).toBe(4);
    expect(v.question).toBe('tríade cognitiva');
    expect(v.answer).toBe('conteúdo da nota sobre beck');
    expect(v.conceptId).toBe('con-1');
    expect(v.authorIds).toEqual(['aut-1']);
    expect(v.approachId).toBe('app-1');
    expect(v.courseIds).toEqual(['c1']);
    expect(v.sessionTopic).toBe('tríade cognitiva');
    expect(v.duration).toBe(30);
    expect(v.examWeight).toBe('1,0');
    expect(v.materialType).toBe('artigo');
  });

  it('usa a primeira linha quando a nota não tem título', () => {
    const v = hydrateTransform(note({ title: '', content: 'primeira linha\nsegunda' }), courses, []);
    expect(v.question).toBe('primeira linha');
    expect(v.classNumber).toBe(1);
  });

  it('cai para a primeira disciplina quando a nota não tem vínculo', () => {
    const v = hydrateTransform(note({ courseId: undefined }), courses, classes);
    expect(v.courseId).toBe('c1');
    expect(v.courseIds).toEqual([]);
  });
});

describe('FIELDS_FOR', () => {
  const targets: NoteTargetType[] = [
    'class', 'task', 'exam', 'flashcard', 'session', 'internship', 'concept', 'author', 'material',
  ];

  it('cobre todos os destinos com passo, revisão e validade', () => {
    for (const t of targets) {
      const cfg = FIELDS_FOR[t];
      expect(cfg.stepId.length).toBeGreaterThan(0);
      expect(cfg.headline.length).toBeGreaterThan(0);
      expect(typeof cfg.render).toBe('function');
      expect(typeof cfg.review).toBe('function');
      expect(typeof cfg.valid).toBe('function');
    }
  });

  it('validade exige o campo essencial de cada destino', () => {
    const base = hydrateTransform(note(), courses, classes);
    const empty: TransformValues = {
      ...base,
      title: '', content: '', question: '', sessionTopic: '', activity: '',
      conceptName: '', authorName: '', materialTitle: '',
    };
    for (const t of targets) {
      expect(FIELDS_FOR[t].valid(empty), t).toBe(false);
      expect(FIELDS_FOR[t].valid(base), t).toBe(true);
    }
  });

  it('revisão da prova mostra "a confirmar" sem data', () => {
    const v = hydrateTransform(note(), courses, classes);
    const rows = FIELDS_FOR.exam.review({
      v, patch: () => {}, lookups: {
        courseSelect: null, courseName: 'psicopatologia', conceptOptions: [],
        resolveIds: (ids) => ids, approaches: [], authors: [], courses, concepts: [],
      },
    });
    expect(rows.find((r) => r.label === 'data')?.value).toBe('a confirmar');
    expect(rows.find((r) => r.label === 'peso')?.value).toBe('1,0');
  });
});

describe('FIELDS_FOR.save', () => {
  const actions = (): { mocks: Record<string, Mock>; asActions: TransformSaveActions } => {
    const mocks: Record<string, Mock> = {
      addClassNote: vi.fn(),
      addTask: vi.fn(),
      addExam: vi.fn(),
      addFlashcard: vi.fn(),
      addSession: vi.fn(),
      addInternshipLog: vi.fn(),
      addConcept: vi.fn(),
      addAuthor: vi.fn(),
      addMaterial: vi.fn(),
      openComposeDetails: vi.fn(),
      gotoTab: vi.fn(),
    };
    return { mocks, asActions: mocks as unknown as TransformSaveActions };
  };

  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('task monta o payload e navega para a aba certa', () => {
    const { mocks: a, asActions } = actions();
    const v = { ...hydrateTransform(note(), courses, classes), title: 'ler cap 4', dueDate: '' };
    const { onOpen } = FIELDS_FOR.task.save({ v, note: note(), actions: asActions });
    expect(a.addTask).toHaveBeenCalledOnce();
    const payload = a.addTask.mock.calls[0][0];
    expect(payload.id).toMatch(/^t-/);
    expect(payload.title).toBe('ler cap 4');
    expect(payload.disciplineId).toBe('c1');
    expect(payload.dueDate).toBeUndefined();
    expect(payload.completed).toBe(false);

    onOpen?.();
    vi.runAllTimers();
    expect(a.gotoTab).toHaveBeenCalledWith('faculdade');
  });

  it('task sem disciplina navega para a home', () => {
    const { mocks: a, asActions } = actions();
    const v = { ...hydrateTransform(note(), courses, classes), title: 'x', courseId: '' };
    const { onOpen } = FIELDS_FOR.task.save({ v, note: note(), actions: asActions });
    expect(a.addTask.mock.calls[0][0].disciplineId).toBeUndefined();
    onOpen?.();
    vi.runAllTimers();
    expect(a.gotoTab).toHaveBeenCalledWith('home');
  });

  it('class cria a aula e abre os detalhes', () => {
    const { mocks: a, asActions } = actions();
    const v = hydrateTransform(note(), courses, classes);
    const { onOpen } = FIELDS_FOR.class.save({ v, note: note(), actions: asActions });
    expect(a.addClassNote).toHaveBeenCalledOnce();
    const created = a.addClassNote.mock.calls[0][0];
    expect(created.courseId).toBe('c1');
    expect(created.number).toBe(4);
    onOpen?.();
    expect(a.openComposeDetails).toHaveBeenCalledWith(created.id);
  });

  it('flashcard usa o conteúdo da nota como resposta reserva', () => {
    const { mocks: a, asActions } = actions();
    const base = hydrateTransform(note(), courses, classes);
    const v = { ...base, question: 'o que é?', answer: '' };
    FIELDS_FOR.flashcard.save({ v, note: note(), actions: asActions });
    const payload = a.addFlashcard.mock.calls[0][0];
    expect(payload.answer).toBe('conteúdo da nota sobre beck');
    expect(payload.conceptId).toBe('con-1');
  });

  it('concept carrega vínculos e definição reserva', () => {
    const { mocks: a, asActions } = actions();
    const base = hydrateTransform(note(), courses, classes);
    const v = { ...base, conceptName: 'novo conceito', definition: '' };
    FIELDS_FOR.concept.save({ v, note: note(), actions: asActions });
    const payload = a.addConcept.mock.calls[0][0];
    expect(payload.id).toMatch(/^con-/);
    expect(payload.definition).toBe('conteúdo da nota sobre beck');
    expect(payload.authorIds).toEqual(['aut-1']);
    expect(payload.courseIds).toEqual(['c1']);
  });

  it('material usa "—" sem autor e guarda o link', () => {
    const { mocks: a, asActions } = actions();
    const base = hydrateTransform(note(), courses, classes);
    const v = { ...base, materialTitle: 'manual', materialAuthor: '', url: '' };
    FIELDS_FOR.material.save({ v, note: note(), actions: asActions });
    const payload = a.addMaterial.mock.calls[0][0];
    expect(payload.author).toBe('—');
    expect(payload.url).toBeUndefined();
  });

  it('exam/session/internship/author salvam com ids e fallbacks', () => {
    const { mocks: a, asActions } = actions();
    const v = hydrateTransform(note(), courses, classes);
    const n = note();
    FIELDS_FOR.exam.save({ v, note: n, actions: asActions });
    FIELDS_FOR.session.save({ v, note: n, actions: asActions });
    FIELDS_FOR.internship.save({ v, note: n, actions: asActions });
    FIELDS_FOR.author.save({ v, note: n, actions: asActions });
    expect(a.addExam.mock.calls[0][0].id).toMatch(/^e-/);
    expect(a.addSession.mock.calls[0][0].durationMinutes).toBe(30);
    expect(a.addInternshipLog.mock.calls[0][0].conceptIds).toEqual(['con-1']);
    expect(a.addAuthor.mock.calls[0][0].id).toMatch(/^aut-/);
  });
});
