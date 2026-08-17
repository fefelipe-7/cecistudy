import { describe, expect, it } from 'vitest';
import { noteFirstLine, buildClassNoteFromNote } from '../noteLogic';
import type { LooseNote } from '../../types';

const note: LooseNote = {
  id: 'note-1',
  title: 'reflexão sobre o tcc',
  content: 'considerações sobre o vínculo terapêutico\nsegunda linha',
  category: 'reflexão',
  date: '2026-08-13T11:30:00-03:00',
  courseId: 'c1',
  conceptIds: ['con-1'],
  authorIds: ['aut-1'],
  approachIds: ['app-1'],
  materialIds: ['m1'],
};

describe('noteFirstLine', () => {
  it('pega a primeira linha e trunca', () => {
    expect(noteFirstLine('vínculo terapêutico\noutra')).toBe('vínculo terapêutico');
    expect(noteFirstLine('x'.repeat(100)).length).toBe(60);
  });

  it('retorna vazio para conteúdo vazio', () => {
    expect(noteFirstLine('   ')).toBe('');
  });
});

describe('buildClassNoteFromNote', () => {
  it('herda conteúdo e vínculos da nota', () => {
    const cn = buildClassNoteFromNote(note, { title: 'aula de hoje', courseId: 'c1', number: 3 });
    expect(cn.title).toBe('aula de hoje');
    expect(cn.courseId).toBe('c1');
    expect(cn.number).toBe(3);
    expect(cn.summary).toBe(note.content);
    expect(cn.conceptIds).toEqual(['con-1']);
    expect(cn.authorIds).toEqual(['aut-1']);
    expect(cn.approachIds).toEqual(['app-1']);
    expect(cn.materials).toEqual(['m1']);
    expect(cn.hasQuestions).toBe(false);
  });

  it('usa a primeira linha como título quando o campo vem vazio', () => {
    const cn = buildClassNoteFromNote(note, { title: '  ', courseId: 'c1', number: 1 });
    expect(cn.title).toBe('considerações sobre o vínculo terapêutico');
  });
});