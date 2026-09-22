import React from 'react';
import { describe, expect, it, vi, beforeEach, type Mock } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import { GlobalSearchModal } from '../GlobalSearchModal';
import type {
  Course,
  ClassNote,
  PsychologyAuthor,
  PsychologyConcept,
  Task,
  Exam,
  LooseNote,
} from '../../types';

const courses: Course[] = [
  {
    id: 'c1', name: 'psicopatologia', professor: 'mariana', semester: '6º sem',
    schedule: [], color: '#fff', icon: 'Brain',
  },
];
const concepts: PsychologyConcept[] = [
  {
    id: 'con-1', name: 'tríade cognitiva', definition: 'visão negativa de si',
    approachId: 'app-1', authorIds: ['aut-1'], courseIds: ['c1'], tags: ['tcc'],
  },
];
const authors: PsychologyAuthor[] = [
  {
    id: 'aut-1', name: 'aaron beck', bio: 'pai da terapia cognitiva',
    lifespan: '1921–2021', approachId: 'app-1', keyConcepts: ['tríade'], majorWorks: [],
  },
];
const tasks: Task[] = [
  {
    id: 't-1', title: 'ler capítulo 4', disciplineId: 'c1',
    completed: false, priority: 'alta', category: 'leitura',
  },
];
const exams: Exam[] = [
  {
    id: 'e-1', courseId: 'c1', title: 'prova teórica ii', date: '2026-10-01',
    weight: '1,0', topics: ['ansiedade'], completed: false,
  },
];
const looseNotes: LooseNote[] = [
  { id: 'n-1', title: '', content: 'anotação sobre análise do comportamento', category: 'estudo', date: '2026-01-01' },
];

function renderModal(over: {
  onClose?: Mock;
  onNavigate?: Mock;
  onOpenNoteDetail?: Mock;
  onOpenCourseDetail?: Mock;
} = {}) {
  const handlers: {
    onClose: Mock;
    onNavigate: Mock;
    onOpenNoteDetail: Mock;
    onOpenCourseDetail: Mock;
  } = {
    onClose: vi.fn(),
    onNavigate: vi.fn(),
    onOpenNoteDetail: vi.fn(),
    onOpenCourseDetail: vi.fn(),
    ...over,
  };
  render(
    <GlobalSearchModal
      isOpen
      courses={courses}
      classes={[] as ClassNote[]}
      authors={authors}
      concepts={concepts}
      approaches={[]}
      readings={[]}
      tasks={tasks}
      exams={exams}
      looseNotes={looseNotes}
      {...handlers}
    />
  );
  return handlers;
}

describe('GlobalSearchModal', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('filtra e agrupa por seção com contador', () => {
    renderModal();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'beck' } });
    expect(screen.getByText('autores · 1')).toBeTruthy();
    expect(screen.getAllByRole('option')).toHaveLength(1);
  });

  it('é acento-insensível', () => {
    renderModal();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'analise' } });
    expect(screen.getByText('notas avulsas · 1')).toBeTruthy();
  });

  it('setas + enter navegam e gravam o recente', () => {
    const h = renderModal();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'beck' } });
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'ArrowDown' });
    fireEvent.keyDown(screen.getByRole('combobox'), { key: 'Enter' });
    expect(h.onClose).toHaveBeenCalledOnce();
    expect(
      h.onNavigate.mock.calls.length + h.onOpenNoteDetail.mock.calls.length + h.onOpenCourseDetail.mock.calls.length
    ).toBe(1);
  });

  it('nota avulsa abre o detalhe da nota', () => {
    const h = renderModal();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'análise' } });
    fireEvent.click(screen.getAllByRole('option')[0]);
    expect(h.onOpenNoteDetail).toHaveBeenCalledWith('n-1');
  });

  it('tarefa abre o detalhe da disciplina', () => {
    const h = renderModal();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'capítulo' } });
    fireEvent.click(screen.getAllByRole('option')[0]);
    expect(h.onOpenCourseDetail).toHaveBeenCalledWith('c1');
  });

  it('zero resultados mostra o cecinho + sugestão clicável', () => {
    renderModal();
    fireEvent.change(screen.getByRole('combobox'), { target: { value: 'zzz nada' } });
    expect(screen.getByText(/nada por aqui/)).toBeTruthy();
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByText(/aaron beck/));
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe('aaron beck');
  });

  it('recentes re-rodam a busca com 1 toque', () => {
    localStorage.setItem('cecistudy_recentSearches', JSON.stringify(['beck']));
    renderModal();
    fireEvent.click(screen.getByText('beck', { selector: 'button' }));
    expect((screen.getByRole('combobox') as HTMLInputElement).value).toBe('beck');
    expect(screen.getByText('autores · 1')).toBeTruthy();
  });
});
