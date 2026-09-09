import path from 'node:path';

const COMPARISON_TYPES = new Set(['convergencia', 'complementaridade', 'divergencia', 'perspectivas']);
const ENTITY_TYPES = new Set(['abordagem', 'autor', 'conceito', 'tecnica', 'fenomeno']);

const AXIS_KEYS = [
  'como_cada_perspectiva_entende_o_ser_humano',
  'como_cada_perspectiva_entende_o_sofrimento',
  'papel_do_passado_e_do_contexto',
  'mecanismo_de_mudanca',
  'papel_do_terapeuta',
  'papel_do_paciente',
  'relacao_terapeutica',
  'diferencas_na_pratica',
  'evidencia_criticas_e_limitacoes',
];

const AXIS_KEY_BY_ID = Object.fromEntries(
  ['01', '02', '03', '04', '05', '06', '07', '08', '09'].map((id, index) => [id, AXIS_KEYS[index]])
);

const SQL_TABLES = {
  comparacao_fonte: ['id', 'tipo', 'titulo', 'autor', 'ano', 'url', 'escopo', 'uso_no_app'],
  comparacao: [
    'id', 'slug', 'titulo', 'tipo', 'prioridade', 'fase', 'introducao', 'pergunta_central',
    'aplicacao_pratica', 'evidencia_nivel', 'evidencia_sintese', 'convergencias_json',
    'divergencias_json', 'criticas_e_limitacoes_json', 'questoes_para_reflexao_json',
    'fontes_principais_json', 'nota_editorial', 'status', 'data_pesquisa',
  ],
  comparacao_item: ['comparacao_id', 'ordem', 'tipo_entidade', 'entidade_id', 'entidade_nome', 'papel'],
  comparacao_eixo: ['comparacao_id', 'eixo_id', 'ordem', 'titulo', 'pergunta'],
  comparacao_eixo_resposta: ['comparacao_id', 'eixo_id', 'entidade_id', 'entidade_nome', 'conteudo', 'fontes_json'],
  comparacao_evidencia_dado: ['comparacao_id', 'ordem', 'afirmacao', 'populacao_ou_contexto', 'desfecho', 'resultado', 'fonte_id'],
};

function toCamelEntity(item) {
  return {
    tipoEntidade: item.tipo_entidade,
    entidadeId: item.entidade_id,
    ...(item.entidade_nome ? { entidadeNome: String(item.entidade_nome) } : {}),
    ...(item.papel ? { papel: String(item.papel) } : {}),
  };
}

function parseJson(value, fallback = []) {
  if (value == null || value === '') return fallback;
  if (Array.isArray(value) || typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    throw new Error(`JSON inválido nas comparações: ${String(value).slice(0, 120)}`);
  }
}

function normalizeDivergences(raw) {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((entry) => entry && typeof entry === 'object' && !Array.isArray(entry))
    .map((entry) => ({
      tema: String(entry.tema ?? ''),
      porEntidade: Object.fromEntries(
        Object.entries(entry.por_entidade ?? entry.porEntidade ?? {}).map(([id, values]) => [
          id,
          Array.isArray(values) ? values.map(String) : [],
        ])
      ),
    }));
}

function normalizeSources(rawSources, sourceMap) {
  const ids = Array.isArray(rawSources) ? rawSources.map(String) : [];
  const detailed = ids.map((id) => sourceMap.get(id)).filter(Boolean);
  const labels = detailed.map((source) => {
    const author = source.autor ? ` — ${source.autor}` : '';
    const year = source.ano ? ` (${source.ano})` : '';
    return `${source.titulo}${author}${year}`;
  });
  return { ids, detailed, labels };
}

function normalizeAxisRows(comparisonId, axes, responses, sourceMap) {
  const responseByAxis = new Map();
  for (const response of responses.filter((row) => row.comparacao_id === comparisonId)) {
    const key = `${response.eixo_id}`;
    const sourceIds = parseJson(response.fontes_json, []).map(String);
    const missing = sourceIds.filter((id) => !sourceMap.has(id));
    if (missing.length > 0) throw new Error(`${comparisonId}: fontes ausentes nas respostas: ${missing.join(', ')}`);
    const list = responseByAxis.get(key) ?? [];
    list.push({
      entidadeId: String(response.entidade_id),
      entidadeNome: String(response.entidade_nome),
      conteudo: String(response.conteudo ?? ''),
      fontesIds: sourceIds,
    });
    responseByAxis.set(key, list);
  }

  return axes
    .filter((row) => row.comparacao_id === comparisonId)
    .sort((a, b) => Number(a.ordem) - Number(b.ordem))
    .map((axis) => ({
      id: String(axis.eixo_id),
      key: AXIS_KEY_BY_ID[String(axis.eixo_id)] ?? `eixo_${axis.eixo_id}`,
      ordem: Number(axis.ordem),
      titulo: String(axis.titulo),
      pergunta: String(axis.pergunta),
      respostas: responseByAxis.get(String(axis.eixo_id)) ?? [],
    }));
}

function normalizeEvidenceRows(comparisonId, rows, sourceMap) {
  return rows
    .filter((row) => row.comparacao_id === comparisonId)
    .sort((a, b) => Number(a.ordem) - Number(b.ordem))
    .map((row) => {
      if (!sourceMap.has(row.fonte_id)) throw new Error(`${comparisonId}: fonte de evidência ausente: ${row.fonte_id}`);
      return {
        ordem: Number(row.ordem),
        afirmacao: String(row.afirmacao),
        populacaoOuContexto: String(row.populacao_ou_contexto),
        desfecho: String(row.desfecho),
        resultado: String(row.resultado),
        fonteId: String(row.fonte_id),
      };
    });
}

function normalizeSqlComparison(row, items, axes, responses, evidence, sourceMap) {
  if (!row.id || !row.slug || !row.titulo) throw new Error('comparação SQL sem id, slug ou título');
  if (!COMPARISON_TYPES.has(row.tipo)) throw new Error(`${row.id}: tipo de comparação inválido: ${row.tipo}`);
  const comparisonItems = items
    .filter((item) => item.comparacao_id === row.id)
    .sort((a, b) => Number(a.ordem) - Number(b.ordem));
  if (comparisonItems.length < 2) throw new Error(`${row.id}: são necessárias pelo menos duas entidades`);
  if (comparisonItems.some((item) => !ENTITY_TYPES.has(item.tipo_entidade) || !item.entidade_id)) {
    throw new Error(`${row.id}: referência de entidade inválida`);
  }

  const sourceIds = parseJson(row.fontes_principais_json, []).map(String);
  const sourceRefs = normalizeSources(sourceIds, sourceMap);
  const axesData = normalizeAxisRows(row.id, axes, responses, sourceMap);
  if (axesData.length !== AXIS_KEYS.length) throw new Error(`${row.id}: esperado 9 eixos, recebido ${axesData.length}`);

  const referencedSourceIds = new Set(sourceIds);
  for (const axis of axesData) for (const answer of axis.respostas) for (const sourceId of answer.fontesIds) referencedSourceIds.add(sourceId);
  for (const item of normalizeEvidenceRows(row.id, evidence, sourceMap)) referencedSourceIds.add(item.fonteId);
  const detailedSources = [...referencedSourceIds].map((id) => sourceMap.get(id)).filter(Boolean);

  const convergencias = parseJson(row.convergencias_json, []).map(String);
  const divergenciasRaw = parseJson(row.divergencias_json, []);
  const divergencias = normalizeDivergences(divergenciasRaw);
  const divergenciasResumo = divergenciasRaw.filter((entry) => typeof entry === 'string').map(String);
  const criticasELimitacoes = parseJson(row.criticas_e_limitacoes_json, []).map(String);
  const paraPensar = parseJson(row.questoes_para_reflexao_json, []).map(String);

  return {
    schemaVersion: 2,
    id: String(row.id),
    titulo: String(row.titulo),
    slug: String(row.slug),
    tipo: row.tipo,
    perguntaCentral: String(row.pergunta_central ?? ''),
    itens: comparisonItems.map(toCamelEntity),
    eixosRecomendados: axesData.map((axis) => axis.key),
    eixos: axesData,
    prioridade: row.prioridade === 'P2' ? 'P2' : 'P1',
    fase: String(row.fase ?? ''),
    fontesIniciais: sourceRefs.ids,
    fontes: sourceRefs.labels,
    fontesDetalhadas: detailedSources,
    observacaoEditorial: row.nota_editorial ? String(row.nota_editorial) : undefined,
    statusPesquisa: String(row.status ?? ''),
    visaoGeral: String(row.introducao ?? ''),
    introducao: String(row.introducao ?? ''),
    convergencias,
    divergencias,
    divergenciasResumo,
    pratica: String(row.aplicacao_pratica ?? ''),
    evidenciaNivel: String(row.evidencia_nivel ?? ''),
    evidenciaSintese: String(row.evidencia_sintese ?? ''),
    criticasELimitacoes,
    evidencias: normalizeEvidenceRows(row.id, evidence, sourceMap),
    dataPesquisa: String(row.data_pesquisa ?? ''),
    paraPensar,
    relacionados: comparisonItems
      .filter((item) => ['abordagem', 'autor', 'conceito', 'tecnica'].includes(item.tipo_entidade))
      .map((item) => ({ tipo: item.tipo_entidade, id: String(item.entidade_id) })),
  };
}

function parseScalar(raw) {
  const value = raw.trim();
  if (value.toUpperCase() === 'NULL') return null;
  if (/^-?\d+$/.test(value)) return Number(value);
  if (value.startsWith("'") && value.endsWith("'")) {
    const inner = value.slice(1, -1);
    let output = '';
    for (let index = 0; index < inner.length; index += 1) {
      if (inner[index] === '\\' && index + 1 < inner.length) {
        output += inner[index + 1];
        index += 1;
      } else if (inner[index] === "'" && inner[index + 1] === "'") {
        output += "'";
        index += 1;
      } else {
        output += inner[index];
      }
    }
    return output;
  }
  return value;
}

function splitTuple(body) {
  const fields = [];
  let start = 0;
  let quote = false;
  let escaped = false;
  for (let index = 0; index < body.length; index += 1) {
    const char = body[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === "'") {
        if (body[index + 1] === "'") index += 1;
        else quote = false;
      }
    } else if (char === "'") quote = true;
    else if (char === ',') {
      fields.push(parseScalar(body.slice(start, index)));
      start = index + 1;
    }
  }
  if (quote) throw new Error('aspas SQL não fechadas em uma tupla de comparação');
  fields.push(parseScalar(body.slice(start)));
  return fields;
}

function extractSqlRows(sql, table) {
  const columns = SQL_TABLES[table];
  const marker = `INSERT INTO ${table} (${columns.join(',')}) VALUES\n`;
  const start = sql.indexOf(marker);
  if (start < 0) throw new Error(`bloco INSERT não encontrado: ${table}`);
  const valuesStart = start + marker.length;
  const end = sql.indexOf('\nON DUPLICATE KEY UPDATE', valuesStart);
  if (end < 0) throw new Error(`fim do bloco INSERT não encontrado: ${table}`);
  const values = sql.slice(valuesStart, end);
  const rows = [];
  let tupleStart = -1;
  let depth = 0;
  let quote = false;
  let escaped = false;
  for (let index = 0; index < values.length; index += 1) {
    const char = values[index];
    if (quote) {
      if (escaped) escaped = false;
      else if (char === '\\') escaped = true;
      else if (char === "'") {
        if (values[index + 1] === "'") index += 1;
        else quote = false;
      }
      continue;
    }
    if (char === "'") quote = true;
    else if (char === '(') {
      if (depth === 0) tupleStart = index + 1;
      depth += 1;
    } else if (char === ')') {
      depth -= 1;
      if (depth === 0 && tupleStart >= 0) {
        const row = splitTuple(values.slice(tupleStart, index));
        if (row.length !== columns.length) throw new Error(`${table}: número de campos inválido`);
        rows.push(Object.fromEntries(columns.map((column, position) => [column, row[position]])));
        tupleStart = -1;
      }
    }
  }
  return rows;
}

function sourceFromLegacy(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('comparação inválida');
  if (!raw.id || !raw.slug || !raw.titulo) throw new Error('comparação sem id, slug ou título');
  if (!COMPARISON_TYPES.has(raw.tipo)) throw new Error(`tipo de comparação inválido: ${raw.tipo}`);
  if (!Array.isArray(raw.itens) || raw.itens.length < 2) throw new Error(`${raw.id}: são necessárias pelo menos duas entidades`);
  return {
    ...raw,
    id: String(raw.id),
    titulo: String(raw.titulo),
    slug: String(raw.slug),
    perguntaCentral: String(raw.perguntaCentral ?? raw.pergunta_central ?? ''),
    itens: raw.itens.map((item) => ({
      tipoEntidade: item.tipoEntidade ?? item.tipo_entidade,
      entidadeId: String(item.entidadeId ?? item.entidade_id),
      ...(item.entidadeNome ?? item.entidade_nome ? { entidadeNome: String(item.entidadeNome ?? item.entidade_nome) } : {}),
      ...(item.papel ? { papel: String(item.papel) } : {}),
    })),
    eixosRecomendados: (raw.eixosRecomendados ?? raw.eixos_recomendados ?? []).map(String),
    fontesIniciais: (raw.fontesIniciais ?? raw.fontes_iniciais ?? []).map(String),
    prioridade: raw.prioridade === 'P2' ? 'P2' : 'P1',
    fase: String(raw.fase ?? ''),
    statusPesquisa: String(raw.statusPesquisa ?? raw.status_pesquisa ?? ''),
  };
}

export function loadComparisonSources(filePath, readFile) {
  const raw = JSON.parse(readFile(filePath, 'utf8'));
  return {
    schemaVersion: Number(raw.schema_version ?? raw.schemaVersion ?? 1),
    generatedAt: String(raw.generated_at ?? raw.generatedAt ?? ''),
    scope: String(raw.scope ?? ''),
    counts: raw.counts ?? {},
    canonicalAxes: Array.isArray(raw.canonical_axes) ? raw.canonical_axes.map(String) : (raw.canonicalAxes ?? AXIS_KEYS),
    schemaNotes: Array.isArray(raw.schema_notes) ? raw.schema_notes.map(String) : (raw.schemaNotes ?? []),
    comparacoes: (raw.comparacoes ?? []).map(sourceFromLegacy),
  };
}

export function loadComparisonSqlSources(sqlPath, readFile) {
  const sql = readFile(sqlPath, 'utf8');
  const baseDir = path.dirname(sqlPath);
  const sourcesPath = path.join(baseDir, 'fontes_referencias.json');
  const sourceFile = JSON.parse(readFile(sourcesPath, 'utf8'));
  const sourceRows = sourceFile.sources ?? extractSqlRows(sql, 'comparacao_fonte');
  const sourceMap = new Map(sourceRows.map((source) => [String(source.id), {
    id: String(source.id),
    tipo: String(source.tipo ?? ''),
    titulo: String(source.titulo ?? ''),
    autor: source.autor ? String(source.autor) : null,
    ano: source.ano == null ? null : Number(source.ano),
    url: source.url ? String(source.url) : null,
    escopo: String(source.escopo ?? ''),
    usoNoApp: String(source.uso_no_app ?? source.usoNoApp ?? ''),
  }]));
  const tables = Object.fromEntries(
    Object.entries(SQL_TABLES).map(([table]) => [table, extractSqlRows(sql, table)])
  );
  const comparisons = tables.comparacao.map((row) => normalizeSqlComparison(
    row,
    tables.comparacao_item,
    tables.comparacao_eixo,
    tables.comparacao_eixo_resposta,
    tables.comparacao_evidencia_dado,
    sourceMap,
  ));
  const ids = new Set(comparisons.map((comparison) => comparison.id));
  const slugs = new Set(comparisons.map((comparison) => comparison.slug));
  if (ids.size !== comparisons.length) throw new Error('IDs duplicados no seed SQL de comparações');
  if (slugs.size !== comparisons.length) throw new Error('slugs duplicados no seed SQL de comparações');
  return {
    schemaVersion: 2,
    generatedAt: String(sourceFile.generated_at ?? new Date().toISOString().slice(0, 10)),
    scope: 'comparações editoriais importadas do seed MySQL/MariaDB',
    counts: {
      total: comparisons.length,
      fontes: sourceMap.size,
      eixos: tables.comparacao_eixo.length,
      respostas: tables.comparacao_eixo_resposta.length,
      evidencias: tables.comparacao_evidencia_dado.length,
    },
    canonicalAxes: AXIS_KEYS,
    schemaNotes: [
      'Fonte editorial: content/comparations/migrations/comparacoes_seed_completo.sql.',
      'As respostas dos eixos são preservadas por entidade e por eixo.',
      'O app não conecta em MySQL em runtime; o seed é convertido durante o build para web e SQLite.',
    ],
    fontes: [...sourceMap.values()],
    comparacoes: comparisons,
  };
}

export { AXIS_KEYS };
