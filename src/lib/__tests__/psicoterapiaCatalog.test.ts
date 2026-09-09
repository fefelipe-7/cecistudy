import { describe, expect, it } from 'vitest';
import { PSICOTERAPIA_APPROACHES } from '../../data/psicoterapia';
import { PSICOTERAPIA_FAMILIES } from '../../data/psicoterapiaFamilies';

describe('catálogo de psicoterapias (dados gerados)', () => {
  it('todas as abordagens têm familyId válido e nenhuma entrada vazia (sem buracos de array)', () => {
    expect(PSICOTERAPIA_APPROACHES.length).toBe(97);
    const falsy = PSICOTERAPIA_APPROACHES.map((a, i) => ({ a, i })).filter((x) => !x.a);
    expect(falsy).toEqual([]);
    const validFamilyIds = new Set(PSICOTERAPIA_FAMILIES.map((f) => f.id));
    const bad = PSICOTERAPIA_APPROACHES.filter(
      (a) => typeof a.familyId !== 'string' || !validFamilyIds.has(a.familyId)
    );
    expect(bad).toEqual([]);
  });
});