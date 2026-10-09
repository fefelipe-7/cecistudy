import { describe, it, expect } from 'vitest';
import {
  // datas
  toDateKey,
  todayKey,
  formatDateBR,
  formatDateShortBR,
  dateKeyOrdinal,
  addDays,
  weekStartKey,
  inWeek,
  // estado
  isScheduled,
  isDone,
  buildLinkIndex,
  statusOf,
  reflectionExpectedFor,
  computePendencies,
  proximasPendenciasDePreenchimento,
  camposDeReferencia,
  declinadosDe,
  comDeclinados,
  statusPreenchimento,
  valorCampoReferencia,
  CAMPO_REFERENCIA_LABEL,
  CAMPOS_DE_REFERENCIA,
  TEXTO_NAO_RESPONDER,
  computeStats,
  WEEKS_IN_SERIES,
  // casos
  normalizePatientKey,
  formatPatientLabel,
  deriveCases,
  nextSessionNumber,
  // agrupamento e título
  groupByWeek,
  suggestTitle,
  // escrita
  sanitizeLog,
  planSave,
  planDelete,
  planRenamePatient,
  planSetPatient,
  planLinkNextStep,
  hasLiveNextStepLink,
  legacyNotebookToLog,
} from '../internship';
import type { InternshipLog, DateKey, SupervisionNotebook, CampoPendencia } from '../internship';

const TODAY: DateKey = '2026-09-10'; // quinta-feira

const log = (over: Partial<InternshipLog> = {}): InternshipLog => ({
  id: 'l1',
  type: 'estagio',
  date: '2026-09-02',
  hours: 4,
  activity: 'triagem',
  reflections: '',
  ...over,
});

const clinical = (over: Partial<InternshipLog> = {}): InternshipLog =>
  log({ type: 'atendimento_clinico', patient: 'M.S.', sessionNumber: 1, ...over });

const supervision = (over: Partial<InternshipLog> = {}): InternshipLog =>
  log({ id: 'sup-1', type: 'supervisao', date: '2026-09-08', hours: 0, reflections: '', ...over });

// ---------------------------------------------------------------------------

describe('datas civis', () => {
  it('toDateKey usa getters locais: 23:30 não vira o dia seguinte', () => {
    expect(toDateKey(new Date(2026, 7, 26, 23, 30))).toBe('2026-08-26');
    expect(toDateKey(new Date(2026, 0, 1, 0, 0))).toBe('2026-01-01');
  });

  it('todayKey é toDateKey do argumento', () => {
    expect(todayKey(new Date(2026, 8, 10, 12))).toBe('2026-09-10');
  });

  it('formatDateBR quebra a string — regressão F4', () => {
    expect(formatDateBR('2026-08-26')).toBe('26/08/2026');
    expect(formatDateShortBR('2026-08-26')).toBe('26/08');
  });

  it('entrada inválida volta como veio (dado legado não some)', () => {
    expect(formatDateBR('')).toBe('');
    expect(formatDateBR('amanhã')).toBe('amanhã');
    expect(dateKeyOrdinal('nada')).toBe(Number.NEGATIVE_INFINITY);
  });

  it('addDays atravessa mês, ano e bissexto', () => {
    expect(addDays('2026-08-31', 1)).toBe('2026-09-01');
    expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
    expect(addDays('2028-02-28', 1)).toBe('2028-02-29');
  });

  it('weekStartKey devolve a segunda; domingo volta à segunda anterior', () => {
    expect(weekStartKey('2026-09-10')).toBe('2026-09-07'); // quinta
    expect(weekStartKey('2026-09-07')).toBe('2026-09-07'); // segunda
    expect(weekStartKey('2026-09-13')).toBe('2026-09-07'); // domingo
    expect(weekStartKey('2026-01-01')).toBe('2025-12-29');
  });

  it('inWeek inclui a segunda e exclui a segunda seguinte', () => {
    expect(inWeek('2026-09-07', '2026-09-07')).toBe(true);
    expect(inWeek('2026-09-13', '2026-09-07')).toBe(true);
    expect(inWeek('2026-09-14', '2026-09-07')).toBe(false);
  });
});

describe('estados derivados', () => {
  it('agendado é date > hoje; hoje conta como feito (D7)', () => {
    expect(isScheduled(log({ date: '2026-09-11' }), TODAY)).toBe(true);
    expect(isScheduled(log({ date: '2026-09-10' }), TODAY)).toBe(false);
    expect(isDone(log({ date: '2026-09-10' }), TODAY)).toBe(true);
  });

  it('reflexão esperada só para clínico e estágio (D11)', () => {
    expect(reflectionExpectedFor('atendimento_clinico')).toBe(true);
    expect(reflectionExpectedFor('estagio')).toBe(true);
    expect(reflectionExpectedFor('supervisao')).toBe(false);
    expect(reflectionExpectedFor('intervisao')).toBe(false);
    expect(reflectionExpectedFor('outro')).toBe(false);
  });

  it('construção do índice ignora id inexistente e supervisão agendada (I2/E2)', () => {
    const index = buildLinkIndex(
      [
        clinical({ id: 'at-1' }),
        clinical({ id: 'at-2' }),
        supervision({ discussedLogIds: ['at-1', 'at-inexistente'] }),
        supervision({ id: 'sup-futura', date: '2026-09-20', discussedLogIds: ['at-2'] }),
      ],
      TODAY
    );
    expect(index.get('at-1')?.supervisionIds).toEqual(['sup-1']);
    expect(index.has('at-inexistente')).toBe(false);
    expect(index.has('at-2')).toBe(false); // só a supervisão agendada a discutia
  });

  it('intervisão NÃO supervisiona, mas marca intervised (D5)', () => {
    const index = buildLinkIndex(
      [clinical({ id: 'at-1' }), log({ id: 'int-1', type: 'intervisao', date: '2026-09-08', discussedLogIds: ['at-1'] })],
      TODAY
    );
    const st = statusOf(clinical({ id: 'at-1' }), index, TODAY);
    expect(st.supervised).toBe(false);
    expect(st.intervised).toBe(true);
  });

  it('uma sessão pode ser discutida em duas supervisões e mostra as duas, em ordem de data', () => {
    const index = buildLinkIndex(
      [
        clinical({ id: 'at-1' }),
        supervision({ id: 'sup-antiga', date: '2026-09-01', discussedLogIds: ['at-1'] }),
        supervision({ id: 'sup-recente', date: '2026-09-09', discussedLogIds: ['at-1'] }),
      ],
      TODAY
    );
    expect(index.get('at-1')?.supervisionIds).toEqual(['sup-antiga', 'sup-recente']);
  });
});

describe('computePendencies', () => {
  it('reflexão só para clínico/estágio; agendado nunca é pendência', () => {
    const { noReflection } = computePendencies(
      [
        clinical({ id: 'at-1' }),
        log({ id: 'est-1', type: 'estagio' }),
        log({ id: 'sup-1', type: 'supervisao', date: '2026-09-08' }),
        clinical({ id: 'at-futura', date: '2026-09-20' }),
      ],
      TODAY
    );
    expect(noReflection).toEqual(['at-1', 'est-1']);
  });

  it('sem supervisão: só clínico done, e não fechado por intervisão (D5)', () => {
    const logs = [
      clinical({ id: 'at-1' }),
      clinical({ id: 'at-2' }),
      supervision({ discussedLogIds: ['at-1'] }),
      log({ id: 'int-1', type: 'intervisao', date: '2026-09-08', discussedLogIds: ['at-2'] }),
      clinical({ id: 'at-3', date: '2026-09-25' }), // agendada
    ];
    expect(computePendencies(logs, TODAY).noSupervision).toEqual(['at-2']);
  });
});

describe('proximasPendenciasDePreenchimento', () => {
  it('clínico vazio lista os 5 campos na ordem canônica', () => {
    expect(proximasPendenciasDePreenchimento(clinical({}))).toEqual([
      'reflexoes',
      'tema',
      'abordagem',
      'intervencoes',
      'impressoes',
    ]);
  });

  it('campo com só espaços conta como vazio', () => {
    expect(
      proximasPendenciasDePreenchimento(clinical({ reflections: '   ', theme: '  ' }))
    ).toEqual(['reflexoes', 'tema', 'abordagem', 'intervencoes', 'impressoes']);
  });

  it('clínico completo não lista nada', () => {
    expect(
      proximasPendenciasDePreenchimento(
        clinical({
          reflections: 'foi bem',
          theme: 'ansiedade',
          approach: 'TCC',
          interventionNotes: 'reestruturação',
          observations: 'colaborativa',
        })
      )
    ).toEqual([]);
  });

  it('estágio lista os 5 campos (D10)', () => {
    expect(proximasPendenciasDePreenchimento(log({ type: 'estagio' }))).toEqual([
      'reflexoes',
      'tema',
      'abordagem',
      'intervencoes',
      'impressoes',
    ]);
    expect(
      proximasPendenciasDePreenchimento(
        log({
          type: 'estagio',
          reflections: 'ok',
          theme: 'triagem',
          approach: 'TCC',
          interventionNotes: 'escuta',
          observations: 'receptiva',
        })
      )
    ).toEqual([]);
  });

  it('supervisão não lista nada; intervisão/outro listam os 5 (D10)', () => {
    expect(proximasPendenciasDePreenchimento(supervision({}))).toEqual([]);
    expect(proximasPendenciasDePreenchimento(log({ type: 'intervisao' }))).toEqual([
      'reflexoes',
      'tema',
      'abordagem',
      'intervencoes',
      'impressoes',
    ]);
    expect(proximasPendenciasDePreenchimento(log({ type: 'outro' }))).toEqual([
      'reflexoes',
      'tema',
      'abordagem',
      'intervencoes',
      'impressoes',
    ]);
  });

  it('campo declinado sai da lista de pendências (D11)', () => {
    expect(
      proximasPendenciasDePreenchimento(clinical({ declinedFields: ['reflexoes'] }))
    ).toEqual(['tema', 'abordagem', 'intervencoes', 'impressoes']);
  });
});

describe('camposDeReferencia (SPEC-011 D10)', () => {
  it('retorna os 5 para estagio/clínico/intervisão/outro e vazio para supervisão', () => {
    for (const t of ['estagio', 'atendimento_clinico', 'intervisao', 'outro'] as const) {
      expect(camposDeReferencia(t)).toEqual([...CAMPOS_DE_REFERENCIA]);
    }
    expect(camposDeReferencia('supervisao')).toEqual([]);
  });

  it('CAMPOS_DE_REFERENCIA é a ordem canônica e tem rótulo para todo campo', () => {
    expect(CAMPOS_DE_REFERENCIA).toEqual(['reflexoes', 'tema', 'abordagem', 'intervencoes', 'impressoes']);
    for (const c of CAMPOS_DE_REFERENCIA) {
      expect(CAMPO_REFERENCIA_LABEL[c].length).toBeGreaterThan(0);
      expect(TEXTO_NAO_RESPONDER[c].length).toBeGreaterThan(0);
    }
  });
});

describe('declinadosDe / comDeclinados (SPEC-011 D11/D12)', () => {
  it('declinado vazio recebe o texto automático; religar limpa o auto-texto exato', () => {
    const sem = comDeclinados(clinical({}), ['reflexoes']);
    expect(sem.reflections).toBe(TEXTO_NAO_RESPONDER.reflexoes);
    expect(sem.declinedFields).toEqual(['reflexoes']);

    const deVolta = comDeclinados(sem, []);
    expect(deVolta.reflections).toBe('');
    expect(deVolta.declinedFields).toBeUndefined();
  });

  it('declinado preenchido mantém o conteúdo, só esconde no card', () => {
    const log = clinical({ reflections: 'anotação própria', declinedFields: ['reflexoes'] });
    const sem = comDeclinados(log, ['reflexoes']);
    expect(sem.reflections).toBe('anotação própria');
    expect(sem.declinedFields).toEqual(['reflexoes']);
  });

  it('texto próprio é preservado ao religar (só o auto-texto exato é limpo)', () => {
    const religado = comDeclinados(
      clinical({ reflections: 'minha escrita', declinedFields: ['reflexoes'] }),
      []
    );
    expect(religado.reflections).toBe('minha escrita');
    expect(religado.declinedFields).toBeUndefined();
  });

  it('supervisão nunca declina e nunca escreve auto-texto (D10/D12)', () => {
    const sup = comDeclinados(supervision({}), ['reflexoes', 'tema']);
    expect(sup.reflections).toBe('');
    expect(sup.declinedFields).toBeUndefined();
  });

  it('declinados inválidos são limpos; lista vazia vira undefined', () => {
    const x = comDeclinados(clinical({}), ['reflexoes', 'fantasma' as CampoPendencia]);
    expect(x.declinedFields).toEqual(['reflexoes']);
    expect(declinadosDe(x)).toEqual(['reflexoes']);
  });

  it('comDeclinados limpa a ordem para a canônica', () => {
    const x = comDeclinados(clinical({}), ['impressoes', 'tema']);
    expect(x.declinedFields).toEqual(['tema', 'impressoes']);
  });
});

describe('statusPreenchimento (SPEC-011 D13)', () => {
  it('tudo preenchido → success "tudo preenchido"', () => {
    const st = statusPreenchimento(
      clinical({
        reflections: 'x',
        theme: 'x',
        approach: 'x',
        interventionNotes: 'x',
        observations: 'x',
      })
    );
    expect(st).toEqual({ tone: 'success', label: 'tudo preenchido' });
  });

  it('um faltando → warning "falta <campo>"', () => {
    expect(
      statusPreenchimento(
        clinical({ reflections: 'x', theme: 'x', approach: 'x', interventionNotes: 'x' })
      )
    ).toEqual({ tone: 'warning', label: 'falta impressões clínicas' });
  });

  it('dois ou mais faltando → numeral por extenso', () => {
    expect(statusPreenchimento(clinical({}))).toEqual({
      tone: 'warning',
      label: 'ainda falta preencher cinco',
    });
    expect(
      statusPreenchimento(clinical({ reflections: 'x', theme: 'x', approach: 'x' }))
    ).toEqual({ tone: 'warning', label: 'ainda falta preencher dois' });
  });

  it('supervisão não tem chip', () => {
    expect(statusPreenchimento(supervision({}))).toBeNull();
  });

  it('campo declinado com auto-texto conta como preenchido no chip', () => {
    const log = comDeclinados(clinical({}), ['reflexoes', 'tema']);
    expect(statusPreenchimento(log)).toEqual({
      tone: 'warning',
      label: 'ainda falta preencher três',
    });
  });
});

describe('sanitizeLog e declinedFields (SPEC-011 D11/D12)', () => {
  it('sanitize preserva a lista limpa e nunca fabrica o auto-texto sozinho', () => {
    // passou por comDeclinados antes: auto-texto presente, lista salva
    const com = comDeclinados(clinical({}), ['reflexoes']);
    const clean = sanitizeLog(com, []);
    expect(clean.declinedFields).toEqual(['reflexoes']);
    expect(clean.reflections).toBe(TEXTO_NAO_RESPONDER.reflexoes);

    // sanitize sozinho não escreve auto-texto nem declara declínio
    const sem = sanitizeLog(clinical({ reflections: '' }), []);
    expect(sem.reflections).toBe('');
    expect(sem.declinedFields).toBeUndefined();
  });

  it('sanitize remove declinedFields de supervisão e limpa inválidos', () => {
    const clean = sanitizeLog(
      { ...supervision({}), declinedFields: ['reflexoes'] as CampoPendencia[] },
      []
    );
    expect(clean.declinedFields).toBeUndefined();
    const limpo = sanitizeLog(
      { ...clinical({}), declinedFields: ['reflexoes', 'nada' as CampoPendencia] },
      []
    );
    expect(limpo.declinedFields).toEqual(['reflexoes']);
  });
});

describe('computeStats', () => {
  it('agendado fora das horas; hoje conta', () => {
    const s = computeStats(
      [
        clinical({ id: 'at-1', hours: 2, date: '2026-09-10' }),
        clinical({ id: 'at-2', hours: 5, date: '2026-09-25' }),
      ],
      TODAY
    );
    expect(s.doneHours).toBe(2);
    expect(s.weekHours).toBe(2);
    expect(s.doneCount).toBe(1);
    expect(s.clinicalDoneCount).toBe(1);
    expect(s.scheduledCount).toBe(1);
    expect(s.nextScheduled).toBe('2026-09-25');
  });

  it('a semana começa na segunda: domingo anterior está fora', () => {
    const s = computeStats(
      [log({ id: 'a', hours: 3, date: '2026-09-06' }), log({ id: 'b', hours: 4, date: '2026-09-07' })],
      TODAY
    );
    expect(s.weekHours).toBe(4);
  });

  it('weeklySeries tem 8 posições, do mais antigo ao mais novo', () => {
    const s = computeStats(
      [
        log({ id: 'hje', hours: 1, date: '2026-09-10' }),
        log({ id: 'sem', hours: 2, date: '2026-09-08' }),
        log({ id: 'old', hours: 4, date: '2026-08-19' }), // 3 semanas atrás
      ],
      TODAY
    );
    expect(s.weeklySeries).toHaveLength(WEEKS_IN_SERIES);
    expect(s.weeklySeries[WEEKS_IN_SERIES - 1]).toBe(3); // corrente
    expect(s.weeklySeries[WEEKS_IN_SERIES - 4]).toBe(4); // 3 semanas atrás
    expect(s.weeksWithData).toBe(2); // duas semanas com dado (posição 4 e 7)
  });

  it('registro com data inválida conta como feito e não entra na série (E7)', () => {
    const s = computeStats([log({ id: 'x', hours: 3, date: '' })], TODAY);
    expect(s.doneHours).toBe(3);
    expect(s.weeksWithData).toBe(0);
  });
});

describe('deriveCases', () => {
  it('agrupa por chave normalizada; "José P." e "Jose P." caem no mesmo caso (E15)', () => {
    const { cases } = deriveCases(
      [
        clinical({ id: 'a', patient: 'José P.', sessionNumber: 1 }),
        clinical({ id: 'b', patient: 'Jose P.', sessionNumber: 2, date: '2026-09-09' }),
      ],
      TODAY
    );
    expect(cases).toHaveLength(1);
    expect(cases[0].patientKey).toBe('josep');
  });

  it('rótulo vem do atendimento mais recente', () => {
    const { cases } = deriveCases(
      [
        clinical({ id: 'a', patient: 'm.s', sessionNumber: 1 }),
        clinical({ id: 'b', patient: 'M.S.', sessionNumber: 2, date: '2026-09-09' }),
      ],
      TODAY
    );
    expect(cases[0].patientLabel).toBe('M.S.'); // grafia do atendimento mais recente
  });

  it('latestAge e latestApproach vêm do atendimento mais recente que os tenha', () => {
    const { cases } = deriveCases(
      [
        clinical({ id: 'a', patientAge: '28', approach: 'TCC' }),
        clinical({ id: 'b', sessionNumber: 2, date: '2026-09-09' }),
      ],
      TODAY
    );
    expect(cases[0].latestAge).toBe('28');
    expect(cases[0].latestApproach).toBe('TCC');
  });

  it('nextSessionNumber é max + 1; 1 sem sessões numeradas', () => {
    const { cases } = deriveCases(
      [
        clinical({ id: 'a', sessionNumber: 3 }),
        clinical({ id: 'b', sessionNumber: 7 }),
        clinical({ id: 'c', sessionNumber: 2, date: '2026-09-09' }),
      ],
      TODAY
    );
    expect(nextSessionNumber(cases[0])).toBe(8);
    expect(nextSessionNumber()).toBe(1);
  });
});

describe('normalizePatientKey / formatPatientLabel', () => {
  it('normaliza pontuação, espaço, caixa e acento', () => {
    expect(normalizePatientKey('M. S.')).toBe('ms');
    expect(normalizePatientKey('ms')).toBe('ms');
    expect(normalizePatientKey(' M.S ')).toBe('ms');
    expect(normalizePatientKey('João P.')).toBe('joaop');
    expect(normalizePatientKey('..')).toBe('');
    expect(normalizePatientKey(undefined)).toBe('');
  });

  it('label só limpa espaço, não mexe na pontuação', () => {
    expect(formatPatientLabel('  M.  S. ')).toBe('M. S.');
  });
});

describe('groupByWeek', () => {
  it('"próximos" vem primeiro, com hours 0', () => {
    const groups = groupByWeek(
      [log({ id: 'a', date: '2026-09-25', hours: 5 }), log({ id: 'b', date: '2026-09-09', hours: 2 })],
      TODAY
    );
    expect(groups[0].id).toBe('upcoming');
    expect(groups[0].hours).toBe(0);
    expect(groups[0].logs.map((l) => l.id)).toEqual(['a']);
  });

  it('rótulos: esta semana, semana passada, e intervalo', () => {
    const groups = groupByWeek(
      [
        log({ id: 'hje', date: '2026-09-09' }),
        log({ id: 'sem', date: '2026-09-02' }),
        log({ id: 'velha', date: '2026-08-12' }),
      ],
      TODAY
    );
    const labels = groups.map((g) => g.label);
    expect(labels).toContain('esta semana');
    expect(labels).toContain('semana passada');
    expect(labels).toContain('10/08 – 16/08'); // semana de 2026-08-12
  });

  it('dentro da semana: data desc', () => {
    const groups = groupByWeek(
      [
        log({ id: 'antigo', date: '2026-09-07' }),
        log({ id: 'novo', date: '2026-09-09' }),
      ],
      TODAY
    );
    expect(groups[0].logs.map((l) => l.id)).toEqual(['novo', 'antigo']);
  });

  it('data inválida vai para o grupo "sem data", no fim (E7)', () => {
    const groups = groupByWeek([log({ id: 'x', date: '' })], TODAY);
    expect(groups[groups.length - 1].id).toBe('sem-data');
  });
});

describe('suggestTitle', () => {
  it('por tipo', () => {
    expect(suggestTitle(clinical({ sessionNumber: 3 }))).toBe('sessão 3 · M.S.');
    expect(suggestTitle(clinical({ sessionNumber: undefined }))).toBe('atendimento · M.S.');
    expect(suggestTitle(clinical({ patient: undefined, sessionNumber: undefined }))).toBe('atendimento clínico');
    expect(suggestTitle(supervision({ supervisor: 'D.' }))).toBe('supervisão com D.');
    expect(suggestTitle(supervision())).toBe('supervisão');
    expect(suggestTitle(log({ id: 'i', type: 'intervisao', supervisor: 'colegas' }))).toBe(
      'intervisão com colegas'
    );
    expect(suggestTitle(log({ type: 'estagio' }))).toBe('dia de estágio');
    expect(suggestTitle(log({ type: 'outro' }))).toBe('registro de campo');
  });
});

describe('sanitizeLog (I1–I8)', () => {
  const all = [clinical({ id: 'at-1' }), supervision()];

  it('NUNCA altera reflections (I4) e nunca fabrica texto', () => {
    expect(sanitizeLog(log({ reflections: '' }), all).reflections).toBe('');
    expect(sanitizeLog(log({ reflections: '  ' }), all).reflections).toBe('');
    expect(sanitizeLog(log({ reflections: 'olhar a transferência' }), all).reflections).toBe(
      'olhar a transferência'
    );
  });

  it('clamps horas em 0–24 com passo 0,25; NaN vira 0 (I5/E8/E9)', () => {
    expect(sanitizeLog(log({ hours: 1.5 }), all).hours).toBe(1.5);
    expect(sanitizeLog(log({ hours: 99 }), all).hours).toBe(24);
    expect(sanitizeLog(log({ hours: -3 }), all).hours).toBe(0);
    expect(sanitizeLog(log({ hours: NaN }), all).hours).toBe(0);
    expect(sanitizeLog(log({ hours: 1.7 }), all).hours).toBe(1.75);
  });

  it('preenche activity vazio com suggestTitle, mas não mexe se já existe (D10)', () => {
    expect(sanitizeLog(log({ activity: '' }), all).activity).toBe('dia de estágio');
    expect(sanitizeLog(log({ activity: '  campo  ' }), all).activity).toBe('campo');
  });

  it('discussedLogIds só em supervisão/intervisão, e só para clínico existente (I1/I2/I3)', () => {
    expect(sanitizeLog(clinical({ discussedLogIds: ['at-1'] }), all).discussedLogIds).toBeUndefined();
    expect(sanitizeLog(supervision({ discussedLogIds: ['at-1'] }), all).discussedLogIds).toEqual(['at-1']);
    expect(
      sanitizeLog(supervision({ discussedLogIds: ['sup-1'] }), all).discussedLogIds // não é clínico
    ).toBeUndefined();
    expect(
      sanitizeLog(supervision({ id: 'sup-1', discussedLogIds: ['sup-1'] }), all).discussedLogIds
    ).toBeUndefined(); // auto-referência
  });

  it('remove duplicata de discussedLogIds', () => {
    expect(
      sanitizeLog(supervision({ discussedLogIds: ['at-1', 'at-1'] }), all).discussedLogIds
    ).toEqual(['at-1']);
  });

  it('remove selfAssessment vazio (I8)', () => {
    expect(sanitizeLog(supervision({ selfAssessment: {} }), all).selfAssessment).toBeUndefined();
    expect(
      sanitizeLog(supervision({ selfAssessment: { confidence: '  ' } }), all).selfAssessment
    ).toBeUndefined();
    expect(
      sanitizeLog(supervision({ selfAssessment: { confidence: 'mais segura' } }), all).selfAssessment
    ).toEqual({ confidence: 'mais segura' });
  });

  it('NUNCA escreve supervisionLogId (D3)', () => {
    expect('supervisionLogId' in sanitizeLog(clinical({ supervisionLogId: 'x' }), all)).toBe(false);
  });

  it('type ausente vira estagio (I7); date inválida vira hoje (I6)', () => {
    const legacy = { ...log(), type: undefined } as unknown as InternshipLog;
    expect(sanitizeLog(legacy, all).type).toBe('estagio');
    expect(sanitizeLog(log({ date: 'ontem' }), all).date).toBe(todayKey());
  });

  it('poda nextStepLinks cujo texto saiu de nextSteps (D17/E19)', () => {
    const withLink = planLinkNextStep(
      supervision({ nextSteps: ['ler a ata'] }),
      'ler a ata',
      'task',
      't1',
      '2026-09-09T12:00:00.000Z'
    );
    expect(sanitizeLog(withLink, all).nextStepLinks).toHaveLength(1);
    expect(sanitizeLog({ ...withLink, nextSteps: ['outro texto'] }, all).nextStepLinks).toBeUndefined();
  });
});

describe('planSave / planDelete', () => {
  it('planSave substitui por id ou anexa, e é a ÚNICA escrita', () => {
    const logs = [clinical({ id: 'at-1' })];
    const appended = planSave(logs, clinical({ id: 'at-2', sessionNumber: 2 }));
    expect(appended).toHaveLength(2);
    const replaced = planSave(appended, clinical({ id: 'at-1', hours: 9 }));
    expect(replaced).toHaveLength(2);
    expect(replaced.find((l) => l.id === 'at-1')?.hours).toBe(9);
  });

  it('planSave não tem efeito colateral nos outros registros (D3: vínculo é derivado)', () => {
    const logs = [clinical({ id: 'at-1' })];
    const next = planSave(logs, supervision({ discussedLogIds: ['at-1'] }));
    expect(next.find((l) => l.id === 'at-1')).toEqual(logs[0]);
  });

  it('planDelete: apagar atendimento tira o id órfão da supervisão (E3)', () => {
    const logs = [clinical({ id: 'at-1' }), clinical({ id: 'at-2' }), supervision({ discussedLogIds: ['at-1', 'at-2'] })];
    const next = planDelete(logs, 'at-2');
    expect(next.find((l) => l.id === 'sup-1')?.discussedLogIds).toEqual(['at-1']);
  });

  it('planDelete: apagar a última discutida remove o campo, e a supervisão some sem tocar nas sessões (E4)', () => {
    const logs = [clinical({ id: 'at-1' }), supervision({ discussedLogIds: ['at-1'] })];
    const next = planDelete(logs, 'at-1');
    expect(next.find((l) => l.id === 'sup-1')?.discussedLogIds).toBeUndefined();
    const semSup = planDelete(logs, 'sup-1');
    expect(semSup.map((l) => l.id)).toEqual(['at-1']);
  });
});

describe('planRenamePatient / planSetPatient', () => {
  const logs = [
    clinical({ id: 'a', patient: 'MS' }),
    clinical({ id: 'b', patient: 'MS', sessionNumber: 2, date: '2026-09-09' }),
    clinical({ id: 'c', patient: 'JP' }),
  ];

  it('renomeia o caso inteiro', () => {
    const { logs: next, merged } = planRenamePatient(logs, 'ms', 'M. S.');
    expect(merged).toBe(false); // mesma chave, outra grafia: não é juntar com ninguém
    expect(next.filter((l) => l.patient === 'M. S.')).toHaveLength(2);
  });

  it('destino já existente reporta merged=true (E5)', () => {
    const { merged } = planRenamePatient(logs, 'ms', 'JP');
    expect(merged).toBe(true);
  });

  it('label vazio é rejeitado', () => {
    expect(planRenamePatient(logs, 'ms', '   ').logs).toBe(logs);
  });

  it('órfão NÃO é renomeado em bloco (D9)', () => {
    const comOrfao = [...logs, clinical({ id: 'o', patient: '' })];
    const { logs: next } = planRenamePatient(comOrfao, '', 'M. S.');
    expect(next.find((l) => l.id === 'o')?.patient).toBe('');
  });

  it('planSetPatient define registros específicos (o caminho dos órfãos)', () => {
    const next = planSetPatient(logs, ['a', 'b'], 'M.S.');
    expect(next.find((l) => l.id === 'a')?.patient).toBe('M.S.');
    expect(next.find((l) => l.id === 'c')?.patient).toBe('JP');
    expect(planSetPatient(logs, ['a'], '')).toBe(logs);
  });
});

describe('nextStepLinks (D17)', () => {
  it('converte uma vez; o mesmo passo substitui o vínculo', () => {
    let l = supervision({ nextSteps: ['ler a ata'] });
    l = planLinkNextStep(l, 'ler a ata', 'task', 't1', '2026-09-09T12:00:00.000Z');
    l = planLinkNextStep(l, 'ler a ata', 'reading', 'r1', '2026-09-09T13:00:00.000Z');
    expect(l.nextStepLinks).toHaveLength(1);
    expect(l.nextStepLinks?.[0].entityId).toBe('r1');
  });

  it('hasLiveNextStepLink é falso quando o texto mudou ou a entidade sumiu (E19/E20)', () => {
    const l = planLinkNextStep(supervision({ nextSteps: ['ler a ata'] }), 'ler a ata', 'task', 't1', 'x');
    expect(hasLiveNextStepLink(l, 'ler a ata', () => true)).toBe(true);
    expect(hasLiveNextStepLink(l, 'ler a ata', () => false)).toBe(false);
    expect(hasLiveNextStepLink({ ...l, nextSteps: ['mudou'] }, 'ler a ata', () => true)).toBe(false);
  });
});

describe('legacyNotebookToLog (F8)', () => {
  const nb: SupervisionNotebook = {
    id: 'nb-1',
    date: '2026-05-04',
    supervisor: 'D. Ana',
    questions: ['transferência'],
    conceptIds: ['c1'],
    referenceIds: ['r1'],
    nextSteps: ['ler o caso'],
    selfAssessment: { confidence: 'mais segura' },
    beforeNotes: 'ansiosa',
    afterNotes: 'mais leve',
  };

  it('converte e RECEBE workspaceId — o caderno legado nunca recebeu (regressão F8)', () => {
    const l = legacyNotebookToLog(nb);
    expect(l.id).toBe('nb-1');
    expect(l.type).toBe('supervisao');
    expect(l.workspaceId).toBe('ws-academico');
    expect(l.hours).toBe(0);
    expect(l.reflections).toBe('');
    expect(l.topics).toEqual(['transferência']);
    expect(l.activity).toBe('supervisão com D. Ana');
  });

  it('preserva o workspaceId que o caderno já tinha', () => {
    expect(legacyNotebookToLog({ ...nb, workspaceId: 'ws-x' }).workspaceId).toBe('ws-x');
  });
});