import { describe, it, expect } from 'vitest';
import { deriveCases, temCampoForaDaLista, CAMPOS_QUE_NAO_ATRAVESSAM } from '../internshipCases';
import { CAMPOS_DA_PROJECAO } from '../../types/clinical';
import type { ClinicalProjection, InternshipLog } from '../../types';

let seq = 0;

/** Uma projeção válida. Só os cinco campos da lista fechada. */
const projecao = (over: Partial<ClinicalProjection> = {}): ClinicalProjection => ({
  id: `clin-${++seq}`,
  iniciais: 'AB',
  data: '2026-09-02',
  duracaoMin: 60,
  paraLevar: 'espaço para o luto',
  ...over,
});

/** Um registro acadêmico. `discussedClinicalIds` aponta para a projeção. */
const supervisao = (over: Partial<InternshipLog> = {}): InternshipLog => ({
  id: `ilog-${++seq}`,
  type: 'supervisao',
  date: '2026-09-09',
  hours: 1,
  activity: 'supervisão de caso',
  reflections: '',
  ...over,
});

describe('deriveCases', () => {
  it('vazio → nenhum caso', () => {
    expect(deriveCases([])).toEqual([]);
  });

  it('um caso agrupa projeções e totaliza minutos', () => {
    const cases = deriveCases([
      projecao({ data: '2026-09-02', duracaoMin: 60 }),
      projecao({ data: '2026-09-09', duracaoMin: 120 }),
    ]);
    expect(cases).toHaveLength(1);
    expect(cases[0]).toMatchObject({
      patientKey: 'ab',
      patientLabel: 'AB',
      totalMin: 180,
      lastSessionDate: '2026-09-09',
    });
    expect(cases[0].projections).toHaveLength(2);
  });

  it('agrupa iniciais distintas separadamente, mais recente primeiro', () => {
    const cases = deriveCases([
      projecao({ iniciais: 'AB', data: '2026-08-01' }),
      projecao({ iniciais: 'CD', data: '2026-09-15' }),
    ]);
    expect(cases).toHaveLength(2);
    expect(cases[0].patientKey).toBe('cd');
    expect(cases[1].patientKey).toBe('ab');
  });

  it('ignora projeção sem iniciais', () => {
    expect(deriveCases([projecao(), projecao({ iniciais: '  ' })])).toHaveLength(1);
  });

  it('a mesma inicial com caixa e espaço diferentes agrupa junto', () => {
    const cases = deriveCases([projecao({ iniciais: 'AB' }), projecao({ iniciais: ' ab ' })]);
    expect(cases).toHaveLength(1);
    expect(cases[0].projections).toHaveLength(2);
  });

  it('"para levar" vazio é pendência; preenchido não é', () => {
    const cases = deriveCases([
      projecao({ paraLevar: '' }),
      projecao({ paraLevar: '   ' }),
      projecao({ paraLevar: 'algo' }),
    ]);
    expect(cases[0]).toMatchObject({ pendingParaLevar: 2, pendingSupervision: 3 });
  });

  it('supervisão registrada zera a pendência do id que ela cita', () => {
    const a = projecao({ id: 'clin-a' });
    const b = projecao({ id: 'clin-b' });
    const cases = deriveCases([a, b], [supervisao({ discussedClinicalIds: ['clin-a'] })]);
    expect(cases[0].pendingSupervision).toBe(1);
  });

  it('supervisão que não cita nada não zera nada', () => {
    const cases = deriveCases([projecao({ id: 'clin-a' })], [supervisao()]);
    expect(cases[0].pendingSupervision).toBe(1);
  });

  it('ordena as projeções do caso por data', () => {
    const cases = deriveCases([
      projecao({ data: '2026-09-09', duracaoMin: 30 }),
      projecao({ data: '2026-08-01', duracaoMin: 60 }),
    ]);
    expect(cases[0].projections.map((p) => p.data)).toEqual(['2026-08-01', '2026-09-09']);
  });
});

describe('a lista fechada de campos', () => {
  it('a projeção não tem nenhum campo sensível', () => {
    expect(CAMPOS_QUE_NAO_ATRAVESSAM).not.toContain('iniciais');
    expect(CAMPOS_QUE_NAO_ATRAVESSAM).not.toContain('duracaoMin');
    expect(CAMPOS_QUE_NAO_ATRAVESSAM).not.toContain('paraLevar');
  });

  it('o registro completo é recusado campo a campo', () => {
    const completo = {
      id: 'clin-1',
      iniciais: 'AB',
      data: '2026-09-02',
      duracaoMin: 60,
      paraLevar: '',
      // tudo abaixo é o que §4.8 linha 466 proíbe
      patient: 'Ana Souza',
      sessionNumber: 12,
      theme: 'luto',
      approach: 'psicanalítica',
      interventionNotes: 'intervenção',
      observations: 'observação',
    };
    expect(temCampoForaDaLista(completo)).toEqual({
      dentro: false,
      campos: expect.arrayContaining(['patient', 'sessionNumber', 'theme']),
    });
  });

  it('a projeção canônica passa', () => {
    expect(temCampoForaDaLista({ ...projecao() })).toEqual({ dentro: true, campos: [] });
  });

  it('a lista de campos que atravessam é exatamente a do contrato', () => {
    expect([...CAMPOS_DA_PROJECAO]).toEqual(['id', 'iniciais', 'data', 'duracaoMin', 'paraLevar']);
  });
});