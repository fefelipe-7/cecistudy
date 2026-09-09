import { describe, it, expect } from 'vitest';
import { selectDiaryPreview, INTERNSHIP_TYPE_LABEL } from '../internshipPreview';
import type { InternshipLog } from '../../types';

const makeLog = (id: string, date: string): InternshipLog => ({
  id,
  date,
  activity: '',
  hours: 0,
  type: 'estagio',
  reflections: '',
});

describe('selectDiaryPreview', () => {
  const baseDate = new Date(2026, 7, 15); // 15/08/2026 (local)

  it('retorna array vazio quando não há logs', () => {
    expect(selectDiaryPreview([], baseDate)).toEqual([]);
  });

  it('prioriza futuros em ordem cronológica (mais próximo primeiro)', () => {
    const logs = [
      makeLog('f3', '2026-08-20'), // +5 dias
      makeLog('f1', '2026-08-16'), // +1 dia
      makeLog('f2', '2026-08-18'), // +3 dias
      makeLog('p1', '2026-08-10'), // -5 dias (passado)
    ];
    const preview = selectDiaryPreview(logs, baseDate, 5);
    expect(preview.map((l) => l.id)).toEqual(['f1', 'f2', 'f3', 'p1']);
  });

  it('quando houver mais de `limit` futuros, retorna os mais próximos', () => {
    const logs = [
      makeLog('f1', '2026-08-16'),
      makeLog('f2', '2026-08-17'),
      makeLog('f3', '2026-08-18'),
      makeLog('f4', '2026-08-19'),
      makeLog('f5', '2026-08-20'),
      makeLog('f6', '2026-08-21'),
    ];
    const preview = selectDiaryPreview(logs, baseDate, 4);
    expect(preview.map((l) => l.id)).toEqual(['f1', 'f2', 'f3', 'f4']);
  });

  it('preenche com passados mais recentes quando faltam futuros', () => {
    const logs = [
      makeLog('f1', '2026-08-16'), // +1
      makeLog('p1', '2026-08-10'), // -5
      makeLog('p2', '2026-08-12'), // -3
      makeLog('p3', '2026-08-14'), // -1
    ];
    const preview = selectDiaryPreview(logs, baseDate, 4);
    expect(preview.map((l) => l.id)).toEqual(['f1', 'p3', 'p2', 'p1']);
  });

  it('respeita o limite total quando mistura futuros e passados', () => {
    const logs = [
      makeLog('f1', '2026-08-16'),
      makeLog('f2', '2026-08-18'),
      makeLog('p1', '2026-08-10'),
      makeLog('p2', '2026-08-11'),
      makeLog('p3', '2026-08-12'),
      makeLog('p4', '2026-08-13'),
      makeLog('p5', '2026-08-14'),
    ];
    const preview = selectDiaryPreview(logs, baseDate, 5);
    expect(preview.length).toBe(5);
    expect(preview.map((l) => l.id)).toEqual(['f1', 'f2', 'p5', 'p4', 'p3']);
  });

  it('hoje conta como futuro (>= today)', () => {
    const logs = [makeLog('hj', '2026-08-15')];
    const preview = selectDiaryPreview(logs, baseDate, 1);
    expect(preview[0].id).toBe('hj');
  });

  it('ordena por data apenas (ignora horas etc)', () => {
    const logs = [
      makeLog('a', '2026-08-16'),
      makeLog('b', '2026-08-16'), // mesma data
      makeLog('c', '2026-08-15'),
    ];
    const preview = selectDiaryPreview(logs, baseDate, 3);
    // ordem dentro da mesma data é estável pelo sort original; aceita qualquer ordem entre a/b
    expect(preview.map((l) => l.date)).toEqual(['2026-08-15', '2026-08-16', '2026-08-16']);
  });
});

describe('INTERNSHIP_TYPE_LABEL', () => {
  it('contém todos os tipos', () => {
    expect(Object.keys(INTERNSHIP_TYPE_LABEL)).toEqual([
      'estagio',
      'atendimento_clinico',
      'supervisao',
      'intervisao',
      'outro',
    ]);
  });

  it('rótulos são strings não-vazias', () => {
    Object.values(INTERNSHIP_TYPE_LABEL).forEach((label) => {
      expect(typeof label).toBe('string');
      expect(label.length).toBeGreaterThan(0);
    });
  });
});