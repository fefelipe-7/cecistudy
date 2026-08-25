import { describe, it, expect } from 'vitest';
import {
  applyStampChange,
  emptySyncIndex,
  mergeIndexes,
  tieBreak,
} from '../stamp';

describe('applyStampChange', () => {
  it('bumpa o stamp da coleção em qualquer mudança', () => {
    const idx = emptySyncIndex();
    const { index } = applyStampChange(idx, 'profile', { name: '' }, { name: 'Ceci' }, 100);
    expect(index.stamps.profile).toBe(100);
    // índice original não é mutado
    expect(idx.stamps.profile).toBeUndefined();
  });

  it('carimba registros novos e alterados', () => {
    const prev = [{ id: 'c1', name: 'antiga' }];
    const next = [
      { id: 'c1', name: 'renomeada' },
      { id: 'c2', name: 'nova' },
    ];
    const { index, changedRecords } = applyStampChange(emptySyncIndex(), 'courses', prev, next, 200);
    expect(changedRecords).toBe(2);
    expect(index.records.courses['c1']).toBe(200);
    expect(index.records.courses['c2']).toBe(200);
  });

  it('não carimba registro idêntico', () => {
    const item = { id: 'c1', name: 'x' };
    const first = applyStampChange(emptySyncIndex(), 'courses', [], [item], 300);
    expect(first.changedRecords).toBe(1); // primeiro insert carimba
    const second = applyStampChange(first.index, 'courses', [item], [{ ...item }], 400);
    expect(second.changedRecords).toBe(0);
    expect(second.index.records.courses['c1']).toBe(300);
  });

  it('gera tombstone para registros removidos e limpa o stamp do registro', () => {
    const prev = [{ id: 't1' }, { id: 't2' }];
    const next = [{ id: 't1' }];
    const { index, removedIds } = applyStampChange(emptySyncIndex(), 'tasks', prev, next, 500);
    expect(removedIds).toEqual(['t2']);
    expect(index.tombstones.tasks['t2']).toBe(500);
    expect(index.records.tasks?.['t2']).toBeUndefined();
  });

  it('coleções fora da lista de registros só bumpam o stamp da coleção', () => {
    const { index } = applyStampChange(emptySyncIndex(), 'readingProgress', {}, { b1: 10 }, 600);
    expect(index.stamps.readingProgress).toBe(600);
    expect(index.records.readingProgress).toBeUndefined();
  });
});

describe('mergeIndexes', () => {
  it('mantém o máximo de cada carimbo (simétrico)', () => {
    const a = emptySyncIndex();
    a.stamps.profile = 10;
    a.records.courses = { c1: 5 };
    const b = emptySyncIndex();
    b.stamps.profile = 20;
    b.tombstones.tasks = { t9: 7 };
    const ab = mergeIndexes(a, b);
    const ba = mergeIndexes(b, a);
    expect(ab).toEqual(ba);
    expect(ab.stamps.profile).toBe(20);
    expect(ab.records.courses['c1']).toBe(5);
    expect(ab.tombstones.tasks['t9']).toBe(7);
  });
});

describe('tieBreak', () => {
  it('é simétrico e determinístico', () => {
    const x = { v: 1 };
    const y = { v: 2 };
    expect(tieBreak(x, y)).toEqual(tieBreak(y, x));
    expect(tieBreak(x, x)).toEqual(x);
  });
});
