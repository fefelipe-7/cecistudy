import { describe, it, expect } from 'vitest';
import { SCHEMA_VERSION, MIGRATIONS, migrateDatabase } from '../schema';

const mig20 = MIGRATIONS[20];
const run20 = (data: Record<string, unknown>) => mig20(data) as Record<string, any>;

const log = (over: Record<string, unknown> = {}) => ({
  id: 'l1',
  type: 'atendimento_clinico',
  date: '2026-08-26',
  hours: 2,
  activity: 'sessão 1',
  reflections: '',
  ...over,
});

/**
 * Migração 20 (`SPEC-009 §6`): fonte única do vínculo sessão ↔ supervisão.
 *
 * Ela corrige `F3` (vínculo órfão), `F8` (o caderno legado nunca migrou, porque a
 * chave lida não era a contratual) e a ausência de `workspaceId` no log migrado.
 */
describe('MIGRATIONS[20] — vínculo com fonte única', () => {
  it('supervisionLogId vira discussedLogIds na supervisão', () => {
    const next = run20({
      internshipLogs: [
        log({ id: 'at-1', supervisionLogId: 'sup-1' }),
        log({ id: 'sup-1', type: 'supervisao' }),
      ],
    });
    expect(next.internshipLogs.find((l: any) => l.id === 'sup-1').discussedLogIds).toEqual(['at-1']);
  });

  it('converte também quando a supervisão é INTERVISÃO', () => {
    const next = run20({
      internshipLogs: [
        log({ id: 'at-1', supervisionLogId: 'int-1' }),
        log({ id: 'int-1', type: 'intervisao' }),
      ],
    });
    expect(next.internshipLogs.find((l: any) => l.id === 'int-1').discussedLogIds).toEqual(['at-1']);
  });

  it('descarta vínculo órfão e apaga supervisionLogId em TODO caso', () => {
    const next = run20({
      internshipLogs: [
        log({ id: 'at-1', supervisionLogId: 'sup-que-nao-existe' }),
        log({ id: 'at-2', supervisionLogId: 'sup-1' }),
        log({ id: 'sup-1', type: 'supervisao' }),
      ],
    });
    for (const l of next.internshipLogs) expect('supervisionLogId' in l).toBe(false);
    // O órfão não criou vínculo em lugar nenhum.
    expect(next.internshipLogs.find((l: any) => l.id === 'sup-1').discussedLogIds).toEqual(['at-2']);
  });

  it('NÃO converte ponteiro cujo alvo não é supervisão/intervisão', () => {
    const next = run20({
      internshipLogs: [
        log({ id: 'at-1', supervisionLogId: 'est-1' }),
        log({ id: 'est-1', type: 'estagio' }),
      ],
    });
    expect(next.internshipLogs.find((l: any) => l.id === 'est-1').discussedLogIds).toBeUndefined();
  });

  it('é idempotente: rodar 2× dá o mesmo resultado', () => {
    const base = {
      internshipLogs: [
        log({ id: 'at-1', supervisionLogId: 'sup-1' }),
        log({ id: 'sup-1', type: 'supervisao' }),
      ],
      supervision: [{ id: 'nb-1', date: '2026-05-04', questions: [], conceptIds: [], referenceIds: [], nextSteps: [], selfAssessment: {} }],
    };
    const uma = run20(base);
    const duas = run20(JSON.parse(JSON.stringify(uma)));
    expect(duas.internshipLogs).toEqual(uma.internshipLogs);
    expect(duas.supervision).toEqual(uma.supervision);
  });
});

describe('MIGRATIONS[20] — dreno do caderno legado (F8)', () => {
  const notebook = (id: string) => ({
    id,
    date: '2026-05-04',
    supervisor: 'D. Ana',
    questions: ['transferência'],
    conceptIds: ['c1'],
    referenceIds: ['r1'],
    nextSteps: ['ler o caso'],
    selfAssessment: { confidence: 'mais segura' },
  });

  it('converte supervision — a chave CONTRATUAL (F8)', () => {
    const next = run20({ internshipLogs: [], supervision: [notebook('nb-1')] });
    const l = next.internshipLogs.find((x: any) => x.id === 'nb-1');
    expect(l.type).toBe('supervisao');
    expect(l.supervisor).toBe('D. Ana');
    expect(l.topics).toEqual(['transferência']);
  });

  it('converte também supervisionNotebook — a chave que o código lia por engano (F8)', () => {
    const next = run20({ internshipLogs: [], supervisionNotebook: [notebook('nb-2')] });
    expect(next.internshipLogs.find((x: any) => x.id === 'nb-2')).toBeDefined();
  });

  it('o log migrado RECEBE workspaceId — antes entrava fora do escopo (F8)', () => {
    const next = run20({ internshipLogs: [], supervision: [notebook('nb-3')] });
    expect(next.internshipLogs.find((x: any) => x.id === 'nb-3').workspaceId).toBe('ws-academico');
  });

  it('não duplica por id (idempotência do dreno)', () => {
    const next = run20({ internshipLogs: [], supervision: [notebook('nb-1'), notebook('nb-1')] });
    expect(next.internshipLogs.filter((x: any) => x.id === 'nb-1')).toHaveLength(1);
  });

  it('não converte caderno cujo id já existe como log', () => {
    const next = run20({
      internshipLogs: [log({ id: 'nb-1', type: 'supervisao' })],
      supervision: [notebook('nb-1')],
    });
    expect(next.internshipLogs.filter((x: any) => x.id === 'nb-1')).toHaveLength(1);
  });

  it('esvazia supervision mas mantém a chave — backupDataSchema exige o array', () => {
    const next = run20({ internshipLogs: [], supervision: [notebook('nb-1')] });
    expect(next.supervision).toEqual([]);
  });
});

describe('MIGRATIONS[20] — normalização', () => {
  it('type ausente vira estagio (I7)', () => {
    const next = run20({ internshipLogs: [{ id: 'antigo', date: '2026-01-01', hours: 1 }] });
    expect(next.internshipLogs[0].type).toBe('estagio');
  });

  it('discussedLogIds fora de supervisão/intervisão é removido (I1)', () => {
    const next = run20({ internshipLogs: [log({ id: 'at-1', discussedLogIds: ['at-2'] })] });
    expect(next.internshipLogs[0].discussedLogIds).toBeUndefined();
  });

  it('discussedLogIds só aponta para atendimento existente (I2) e sem duplicata (I3)', () => {
    const next = run20({
      internshipLogs: [
        log({ id: 'at-1' }),
        log({ id: 'sup-1', type: 'supervisao', discussedLogIds: ['at-1', 'at-1', 'fantasma'] }),
      ],
    });
    expect(next.internshipLogs.find((l: any) => l.id === 'sup-1').discussedLogIds).toEqual(['at-1']);
  });

  it('discussedLogIds vazio remove o campo em vez de deixar array vazio', () => {
    const next = run20({ internshipLogs: [log({ id: 'sup-1', type: 'supervisao', discussedLogIds: ['fantasma'] })] });
    expect(next.internshipLogs[0].discussedLogIds).toBeUndefined();
  });

  it('selfAssessment vazio é removido (I8)', () => {
    const next = run20({
      internshipLogs: [log({ id: 'sup-1', type: 'supervisao', selfAssessment: { confidence: '  ' } })],
    });
    expect(next.internshipLogs[0].selfAssessment).toBeUndefined();
  });

  it('tolerante a coleção ausente', () => {
    expect(run20({})).toEqual({ internshipLogs: [], supervision: [] });
  });

  it('não muta o payload de entrada', () => {
    const before = { internshipLogs: [log({ id: 'at-1', supervisionLogId: 'sup-1' })] };
    const snapshot = JSON.stringify(before);
    mig20(before);
    expect(JSON.stringify(before)).toBe(snapshot);
  });
});

describe('cadeia de migração', () => {
  it('a cadeia 19 → 20 roda', () => {
    const next = migrateDatabase(19, { internshipLogs: [], supervision: [] });
    expect(next).not.toBeNull();
    expect(next!.internshipLogs).toEqual([]);
  });

  it('nenhuma versão falta entre 2 e SCHEMA_VERSION (F17)', () => {
    const missing: number[] = [];
    for (let v = 2; v <= SCHEMA_VERSION; v++) if (!MIGRATIONS[v]) missing.push(v);
    expect(missing).toEqual([]);
  });

  it('buraco na numeração é erro, não silêncio (F17)', () => {
    const original = MIGRATIONS[15];
    try {
      // Remoção temporária para provar que o gate pega (F17).
      delete MIGRATIONS[15];
      expect(() => migrateDatabase(14, {})).toThrow(/buraco/i);
    } finally {
      MIGRATIONS[15] = original;
    }
  });

  it('rejeita versão de origem acima da atual', () => {
    expect(migrateDatabase(SCHEMA_VERSION + 1, {})).toBeNull();
  });
});