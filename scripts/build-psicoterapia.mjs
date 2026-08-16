#!/usr/bin/env node
/**
 * Gera `src/data/psicoterapiaFamilies.ts` (famílias) e
 * `src/data/psicoterapiaApproaches.ts` (abordagens, ~1MB, lazy) a partir das
 * entregas de `library/cecistudy_base_psicoterapias/entregas/`.
 *
 * A lista canônica (97) é a fonte de verdade para seleção e ordem das
 * abordagens (mesma do audit `library/auditar_97_canonico.py`). O parser
 * lida com os formatos A/B/C/D dos arquivos.
 *
 * Uso: node scripts/build-psicoterapia.mjs
 * Saída: src/data/psicoterapiaFamilies.ts + src/data/psicoterapiaApproaches.ts (gerados, commitados).
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ENTREGAS_DIR = path.join(ROOT, 'library', 'cecistudy_base_psicoterapias', 'entregas');
const OUT_FILE = path.join(ROOT, 'src', 'data', 'psicoterapiaBase.ts');

// ---------------------------------------------------------------------------
// Lista canônica das 97 abordagens, por família (ordem de exibição).
// ---------------------------------------------------------------------------
const CANONICAL = {
  '01_psicanalitica_psicodinamica': [
    'Psicanálise Freudiana Clássica', 'Psicologia do Ego', 'Teoria das Relações Objetais',
    'Psicologia do Self (Kohut)', 'Psicanálise Relacional', 'Terapia Psicodinâmica Breve',
    'Psicologia Analítica Junguiana', 'Psicologia Individual Adleriana',
    'Psicanálise Interpessoal (Sullivan)', 'Psicoterapia Psicodinâmica Contemporânea (integrativa)',
  ],
  '02_existencial_humanista': [
    'Terapia Centrada na Pessoa (Rogers)', 'Gestalt-terapia', 'Terapia Existencial-Humanista',
    'Terapia Focada nas Emoções', 'Logoterapia', 'Terapia Experiencial', 'Daseinsanalyse',
    'Terapia Existencial Britânica', 'Psicologia Humanista', 'Terapia Transpessoal',
  ],
  '03_comportamental': [
    'Behaviorismo Metodológico/Radical', 'Terapia Comportamental Clássica',
    'Análise do Comportamento Aplicada (ABA)', 'Dessensibilização Sistemática',
    'Terapia de Exposição', 'Terapia Comportamental Dialética (DBT)', 'Ativação Comportamental',
    'Treinamento de Habilidades Sociais', 'Modificação de Comportamento Infantil',
    'Terapia Comportamental de Casais',
  ],
  '04_cognitiva_tcc': [
    'Terapia Cognitiva (Beck)', 'Terapia Racional-Emotiva Comportamental (REBT)',
    'TCC Integrada/Geral', 'Terapia do Esquema',
    'Terapia Cognitiva Baseada em Mindfulness (MBCT)',
    'Terapia de Aceitação e Compromisso (ACT)', 'Terapia Focada na Compaixão',
    'Terapia Metacognitiva', 'Terapia do Processamento Cognitivo',
    'Terapia Cognitivo-Comportamental Baseada em Protocolo Transdiagnóstico',
  ],
  '05_sistemica_familiar_casais': [
    'Terapia Familiar Estrutural', 'Terapia Familiar Estratégica', 'Terapia Familiar Boweniana',
    'Escola de Milão', 'Terapia Centrada em Soluções', 'Terapia Familiar Geral',
    'Terapia de Casais Integrativa', 'Terapia Familiar Experiencial',
    'Terapia Familiar Baseada em Apego', 'Terapia Multissistêmica',
  ],
  '06_construtivista_narrativa': [
    'Terapia Narrativa', 'Psicoterapias Construtivas', 'Terapia de Construção Pessoal',
    'Terapia Colaborativa', 'Terapia Pós-moderna', 'Construcionismo Social',
    'Coherence Therapy', 'Terapia Ericksoniana', 'Terapia Centrada em Soluções',
    'Prática Baseada em Resposta', 'Terapia de Renegociação de Identidade',
  ],
  '07_interpessoal_relacional': [
    'Psicoterapia Interpessoal (IPT)', 'Terapia Relacional-Cultural',
    'Psicanálise Interpessoal (Sullivan)', 'Terapia Baseada em Mentalização',
    'Teoria dos Sistemas Intersubjetivos', 'Psicodinâmica Cíclica',
    'Terapia de Casais Baseada em Apego', 'Método Gottman de Terapia de Casais',
    'Terapia Familiar Focada nas Emoções',
  ],
  '08_integrativa_ecletica': [
    'Psicoterapia Integrativa Geral', 'Ecletismo Técnico', 'Integração Assimilativa',
    'Terapia Multimodal', 'Psicodinâmica Cíclica', 'Terapia de Aceitação e Compromisso (ACT)',
    'Formulação de Caso em Psicoterapia', 'Modelo Transteórico de Mudança',
    'Prática Baseada em Evidências em Psicologia',
  ],
  '09_social_cultural_genero': [
    'Terapia Feminista', 'Terapia Multicultural', 'Terapia Afirmativa LGBTQ+',
    'Terapia Antirracista', 'Terapia Interseccional', 'Terapia Comunitária',
    'Abordagens Transculturais e Internacionais', 'Terapia Feminista Psicanalítica',
    'Terapia Familiar Feminista',
  ],
  '10_pragmaticos_objetivo': [
    'Terapia Focada em Soluções', 'Entrevista Motivacional', 'Terapia da Realidade',
    'Terapia de Resolução de Problemas', 'Terapia Breve Orientada a Metas', 'Terapia Breve',
    'Aconselhamento de Carreira', 'Terapia Baseada em Forças',
    'Terapia de Casal e Família de Curto Prazo',
  ],
};

// Família → cor (dados, usados via style em runtime — não são classes Tailwind).
const FAMILY_COLOR = {
  '01_psicanalitica_psicodinamica': '#BFDDED',
  '02_existencial_humanista': '#DCCBB8',
  '03_comportamental': '#C9E0D2',
  '04_cognitiva_tcc': '#E8AFC0',
  '05_sistemica_familiar_casais': '#F0D9B4',
  '06_construtivista_narrativa': '#C9D3E8',
  '07_interpessoal_relacional': '#E2C9E0',
  '08_integrativa_ecletica': '#D6D0E8',
  '09_social_cultural_genero': '#E8C9CD',
  '10_pragmaticos_objetivo': '#CDE4E8',
};

// Abordagens com classificação cruzada entre famílias → relações "próximas".
const CROSS_FAMILY_RELATIONS = [
  'Psicanálise Interpessoal (Sullivan)',
  'Psicodinâmica Cíclica',
  'Terapia de Aceitação e Compromisso (ACT)',
  'Terapia Centrada em Soluções',
  'Terapia Focada em Soluções',
];

const FIELDS = [
  'nome', 'name', 'descricao_curta', 'definicao', 'ideia_central', 'origem',
  'periodo_historico', 'contexto_historico', 'visao_ser_humano', 'visao_psique',
  'visao_desenvolvimento', 'visao_sofrimento', 'teoria_da_mudanca',
  'apresentacao_pratica', 'papel_terapeuta', 'papel_paciente', 'relacao_terapeutica',
  'foco_clinico', 'perspectiva_academica', 'evidencias', 'debates',
  'criticas_limitacoes', 'leituras_fundamentais',
];
const FIELD_SET = new Set(FIELDS);

// ---- normalização (mesma do audit) ----
function norm(s) {
  let t = s
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
  t = t.replace(/[–—‑]/g, '-');
  t = t.replace(/\([^)]*\)/g, ' ');
  t = t.replace(/[^a-z0-9]+/g, ' ');
  return t.trim().replace(/\s+/g, ' ');
}

function aliases(name) {
  const n = norm(name);
  const out = new Set([n]);
  const replacements = {
    'behaviorismo metodologico radical': 'behaviorismo metodologico radical base teorica',
    'terapia psicodinamica breve': 'terapia psicodinamica breve theories of psychotherapy brief dynamic therapy',
    'psicologia individual adleriana': 'psicologia individual adleriana theories of psychotherapy adlerian psychotherapy',
    'terapia centrada na pessoa': 'terapia centrada na pessoa rogers theories of psychotherapy person centered psychotherapies',
    'gestalt terapia': 'gestalt terapia theories of psychotherapy gestalt therapy',
    'terapia focada nas emocoes': 'terapia focada nas emocoes emotion focused therapy vertente de leslie greenberg',
    'terapia existencial britanica': 'terapia existencial britanica vertente clinica contemporanea',
    'psicoterapia interpessoal ipt': 'psicoterapia interpessoal ipt klerman weissman',
    'terapia baseada em mentalizacao': 'tratamento baseado em mentalizacao',
    'terapia relacional cultural': 'terapia relacional cultural relational cultural therapy rct',
    'terapia familiar focada nas emocoes': 'terapia familiar focada nas emocoes efft eft familiar',
    'psicodinamica ciclica': 'psicodinamica ciclica wachtel terapia ciclica psicodinamica',
    'metodo gottman de terapia de casais': 'metodo gottman de terapia de casais gottman method couples therapy',
    'terapia de aceitacao e compromisso': 'terapia de aceitacao e compromisso act como modelo integrativo contextual',
    'pratica baseada em evidencias em psicologia': 'pratica baseada em evidencias em psicologia pbe',
    'terapia multicultural': 'aconselhamento multicultural',
    'terapia focada em solucoes': 'terapia centrada em solucoes tcs enquadramento construtivista narrativo',
    'terapia de casal e familia de curto prazo': 'terapia de casal e familia de curto prazo modelo mri mental research institute modelo estrategico',
  };
  if (replacements[n]) out.add(norm(replacements[n]));
  return out;
}

// ---------------------------------------------------------------------------
// Parser dos arquivos de entregas → blocos { name, fields, file, family }.
// ---------------------------------------------------------------------------
const EDITORIAL = /Diferenciação|Explicação das diferenças|Qualificação das evidências|Formato de importação|Referências de pesquisa|Referencias de pesquisa|Observações finais|Observação final|Observações gerais|Nota sobre|Em resumo/i;

function parseFile(filePath, fileName) {
  const familyKey = Object.keys(CANONICAL).find((f) => fileName.startsWith(f)) ?? null;
  const lines = fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, '').split(/\r?\n/);
  const blocks = [];
  let cur = null;
  let inFamily = false;
  let seen = new Set();
  let skip = false;

  const flush = () => {
    if (cur) {
      if (cur.pend) {
        cur.fields[cur.pend] = cur.valbuf.filter((l) => l.trim()).join('\n').trim();
        cur.pend = null;
        cur.valbuf = [];
      }
      if (Object.keys(cur.fields).length > 0 || cur.name) blocks.push(cur);
    }
    cur = null;
  };

  const newBlock = () => ({ name: null, fields: {}, file: fileName, family: familyKey, pend: null, valbuf: [] });

  for (let i = 0; i < lines.length; i++) {
    const s = lines[i].trim();

    if (skip) {
      if (s.startsWith('#') || s === '---') skip = false;
      continue;
    }
    if (s === '## Registro `familia`') {
      flush();
      inFamily = true;
      seen = new Set();
      cur = newBlock();
      continue;
    }
    const mAb = s.match(/^## Registro `abordagem`\s*[—-]\s*(.+)$/);
    if (mAb) {
      flush();
      inFamily = false;
      cur = newBlock();
      cur.name = mAb[1].trim().replace(/\*+$/g, '').trim();
      continue;
    }
    if (inFamily) {
      if (s === '---') {
        if (cur && cur.pend) {
          cur.fields[cur.pend] = cur.valbuf.filter((l) => l.trim()).join('\n').trim();
          cur.pend = null;
          cur.valbuf = [];
        }
        continue;
      }
      const mf = s.match(/^### (nome|name|descricao_curta|ordem_exibicao)$/);
      if (mf) {
        if (seen.has(mf[1])) {
          // fim do bloco de família (campo repetido, ex.: `### nome` da 1ª abordagem):
          // encerra o bloco e abre um novo para a abordagem seguinte.
          if (cur && cur.pend) {
            cur.fields[cur.pend] = cur.valbuf.filter((l) => l.trim()).join('\n').trim();
            cur.pend = null;
            cur.valbuf = [];
          }
          if (cur && (Object.keys(cur.fields).length > 0 || cur.name)) blocks.push(cur);
          inFamily = false;
          cur = newBlock();
          cur.pend = mf[1];
          cur.valbuf = [];
          continue;
        }
        seen.add(mf[1]);
        if (cur && cur.pend) {
          cur.fields[cur.pend] = cur.valbuf.filter((l) => l.trim()).join('\n').trim();
        }
        cur.pend = mf[1];
        cur.valbuf = [];
        continue;
      }
      if (s.startsWith('### ') || s.startsWith('## ')) {
        // outra seção → fim do bloco de família; o heading segue o fluxo normal
        if (cur && cur.pend) {
          cur.fields[cur.pend] = cur.valbuf.filter((l) => l.trim()).join('\n').trim();
          cur.pend = null;
          cur.valbuf = [];
        }
        inFamily = false;
      } else if (cur && cur.pend) {
        cur.valbuf.push(s);
        continue;
      }
    }

    if (s.startsWith('#') && EDITORIAL.test(s.replace(/^#+\s*/, ''))) {
      flush();
      skip = true;
      continue;
    }

    const mReg = s.match(/^### Registro\s+\d+(.*)$/);
    if (mReg) {
      flush();
      const rest = mReg[1].replace(/^\s*[—-]\s*/, '').trim();
      cur = newBlock();
      if (rest) cur.name = rest.replace(/\*+$/g, '').trim();
      continue;
    }

    const mField = s.match(/^### ([a-z_]+)$/);
    if (mField && FIELD_SET.has(mField[1])) {
      const f = mField[1];
      if (f === 'nome' || f === 'name') {
        if (!cur || Object.keys(cur.fields).length > 0) {
          flush();
          cur = newBlock();
        }
        cur.pend = f;
        cur.valbuf = [];
        continue;
      }
      // Gatilho p/ blocos malformados (sem `### nome`): campo novo quando o
      // último campo do bloco atual era `leituras_fundamentais`.
      if (!cur || (Object.keys(cur.fields).length > 0 && cur.fields._last === 'leituras_fundamentais')) {
        flush();
        cur = newBlock();
      }
      if (cur.pend) {
        cur.fields[cur.pend] = cur.valbuf.filter((l) => l.trim()).join('\n').trim();
      }
      cur.pend = f;
      cur.fields._last = f;
      cur.valbuf = [];
      continue;
    }

    const mTitle = s.match(/^### (.+)$/);
    if (mTitle) {
      const t = mTitle[1].trim();
      if (FIELD_SET.has(t)) continue;
      if (EDITORIAL.test(t)) {
        skip = true;
        continue;
      }
      flush();
      cur = newBlock();
      cur.name = t.replace(/\*+$/g, '').trim();
      continue;
    }

    let inline = false;
    for (const pat of [/^\*\*([a-z_]+):\*\*\s*(.*)$/, /^([a-z_]+):\s*(.*)$/]) {
      const mi = s.match(pat);
      if (mi && FIELD_SET.has(mi[1])) {
        const f = mi[1];
        if (!cur || ((f === 'nome' || f === 'name') && Object.keys(cur.fields).length > 0)) {
          flush();
          cur = newBlock();
        }
        if (cur.pend) {
          cur.fields[cur.pend] = cur.valbuf.filter((l) => l.trim()).join('\n').trim();
        }
        cur.fields[f] = mi[2].trim();
        cur.fields._last = f;
        cur.pend = null;
        cur.valbuf = [];
        inline = true;
        break;
      }
    }
    if (inline) continue;

    if (s === '---') {
      if (cur && cur.pend) {
        cur.fields[cur.pend] = cur.valbuf.filter((l) => l.trim()).join('\n').trim();
        cur.pend = null;
        cur.valbuf = [];
      }
    } else if (cur && cur.pend) {
      cur.valbuf.push(s);
    }
  }
  flush();
  return blocks;
}

function loadAllBlocks() {
  const files = fs.readdirSync(ENTREGAS_DIR).filter((f) => f.endsWith('.md'));
  files.sort();
  const blocks = [];
  for (const f of files) blocks.push(...parseFile(path.join(ENTREGAS_DIR, f), f));
  return blocks;
}

// ---------------------------------------------------------------------------
// Seleção canônica: para cada abordagem, escolhe o melhor bloco da família.
// ---------------------------------------------------------------------------
/** Nome "matável" de um bloco: valor do campo `nome`/`name` ou o título do bloco. */
function blockName(b) {
  return b?.fields?.nome || b?.fields?.name || b?.name || null;
}

function pickCanonical(blocks, familyKey, canonicalName) {
  const wanted = aliases(canonicalName);
  const hits = blocks.filter((b) => {
    if (b.family !== familyKey) return false;
    const nm = blockName(b);
    if (!nm) return false;
    const n = norm(nm);
    return [...wanted].some((a) => n === a || n.startsWith(a + ' ') || a.startsWith(n + ' '));
  });
  // desempate: prefere arquivo de registros; depois nome mais próximo do canônico
  hits.sort((a, b) => {
    const ra = a.file.includes('_registros') ? 0 : 1;
    const rb = b.file.includes('_registros') ? 0 : 1;
    if (ra !== rb) return ra - rb;
    return a.file.localeCompare(b.file);
  });
  return hits[0] ?? null;
}

// Autores fundamentais: sobrenomes conhecidos presentes no nome ou origem.
const KNOWN_AUTHORS = [
  'Freud', 'Klein', 'Winnicott', 'Kohut', 'Fairbairn', 'Sullivan', 'Jung', 'Adler',
  'Beck', 'Ellis', 'Linehan', 'Wolpe', 'Skinner', 'Watson', 'Bandura', 'Meichenbaum',
  'Minuchin', 'Haley', 'Bowen', 'Selvini', 'Palazzoli', 'Boscolo', 'Cecchin', 'Prata',
  'Watzlawick', 'Satir', 'Whitaker', 'Minuchin', 'Ackerman', 'Johnson', 'Greenberg',
  'Rogers', 'Perls', 'Maslow', 'Frankl', 'May', 'Yalom', 'Bugental', 'Gendlin',
  'Binswanger', 'Boss', 'Heidegger', 'Sartre', 'Merleau-Ponty', 'Buber',
  'White', 'Epston', 'Anderson', 'Goolishian', 'Neimeyer', 'Kelly', 'Erickson',
  'Gottman', 'Linehan', 'Hayes', 'Segal', 'Teasdale', 'Kabat-Zinn', 'Gilbert',
  'Wells', 'Resick', 'Klerman', 'Weissman', 'Wachtel', 'Prochaska', 'DiClemente',
  'Lazarus', 'Norcross', 'Beutler', 'Stricker', 'Gold', 'Anchin', 'Fruzzetti',
];

function extractAuthors(name, origem) {
  // Autores principais: parêntese do nome + primeira frase da origem (fundadores).
  const firstSentence = (origem ?? '').split(/(?<=[.!?])\s+/)[0] ?? '';
  const hay = `${name} ${firstSentence}`;
  const found = new Set();
  for (const a of KNOWN_AUTHORS) {
    if (new RegExp(`\\b${a}\\b`, 'i').test(hay)) found.add(a);
  }
  return [...found];
}

// tags: derivadas da família + palavras-chave do nome.
function deriveTags(name, familyName) {
  const tags = [norm(familyName)];
  for (const kw of ['psicanalise', 'behaviorismo', 'cognitiv', 'humanista', 'existencial', 'sistemica', 'narrativa', 'interpessoal', 'integrativa', 'feminista']) {
    if (norm(name).includes(kw)) tags.push(kw);
  }
  return tags;
}

function shortNameFrom(name) {
  const clean = name.replace(/\s*\(.*\)$/, '').trim();
  const words = clean.split(/\s+/).filter((w) => w.length > 2);
  if (words.length === 1) return clean;
  return clean;
}

function relationIds(approachIdByName, canonicalName) {
  const ids = [];
  for (const [fk, names] of Object.entries(CANONICAL)) {
    for (const n of names) {
      const a = norm(canonicalName);
      const b = norm(n);
      if (a === b || b.startsWith(a + ' ') || a.startsWith(b + ' ')) {
        const id = approachIdByName.get(n);
        if (id && !ids.includes(id)) ids.push(id);
      }
    }
  }
  return ids;
}

// ---------------------------------------------------------------------------
// Geração do arquivo.
// ---------------------------------------------------------------------------
function main() {
  const blocks = loadAllBlocks();
  const families = [];
  const approachIdByName = new Map();
  const rows = [];

  for (const [familyKey, names] of Object.entries(CANONICAL)) {
    // Bloco da família (`## Registro familia`) está no *_registros.md
    const regBlocks = blocks.filter((b) => b.file.includes('_registros') && b.family === familyKey);
    const famBlock = regBlocks.find((b) => b.fields.ordem_exibicao !== undefined);
    const familyName = famBlock?.fields?.nome || famBlock?.fields?.name || familyKey.split('_').slice(1).join(' ').replace(/-/g, ' ');
    const familyDesc = famBlock?.fields?.descricao_curta ?? '';
    const order = Number(famBlock?.fields?.ordem_exibicao ?? familyKey.slice(0, 2));

    families.push({
      id: `fam-${familyKey.slice(0, 2)}`,
      order,
      name: familyName,
      description: familyDesc,
      color: FAMILY_COLOR[familyKey] ?? '#E9DFDC',
    });

    names.forEach((canonicalName, idx) => {
      const block = pickCanonical(blocks, familyKey, canonicalName);
      const id = `psic-${familyKey.slice(0, 2)}-${String(idx + 1).padStart(2, '0')}`;
      if (!block) {
        console.warn(`⚠️  sem bloco para ${familyKey}: ${canonicalName}`);
      }
      const fields = block?.fields ?? {};
      const name = fields.nome || fields.name || block?.name || canonicalName;
      const origem = fields.origem ?? '';
      const detail = {};
      for (const f of FIELDS) if (f !== 'nome' && f !== 'name' && fields[f]) detail[f] = fields[f];

      const approach = {
        id,
        name,
        shortName: shortNameFrom(name),
        description: fields.descricao_curta ?? '',
        foundingAuthors: extractAuthors(name, origem),
        color: FAMILY_COLOR[familyKey] ?? '#E9DFDC',
        family: familyName,
        familyId: `fam-${familyKey.slice(0, 2)}`,
        historicalPeriod: fields.periodo_historico,
        tags: deriveTags(name, familyName),
        summary: fields.descricao_curta,
        definition: fields.definicao,
        centralIdea: fields.ideia_central,
        humanUnderstanding: fields.visao_ser_humano,
        sufferingUnderstanding: fields.visao_sofrimento,
        changeMechanism: fields.teoria_da_mudanca,
        practicePresentation: fields.apresentacao_pratica,
        therapistObservation: fields.papel_terapeuta,
        academicView: {
          historicalPosition: fields.contexto_historico,
          currentState: fields.perspectiva_academica,
          evidence: fields.evidencias,
          debates: fields.debates,
          limitations: fields.criticas_limitacoes,
        },
        criticismsAndControversies: fields.criticas_limitacoes,
        applications: fields.foco_clinico,
        detail,
      };
      rows.push(approach);
      approachIdByName.set(canonicalName, id);
    });
  }

  // relações cruzadas ("conversando com outras abordagens")
  const canonicalOfRow = new Map();
  for (const [fk, names] of Object.entries(CANONICAL)) {
    names.forEach((n, idx) => canonicalOfRow.set(`psic-${fk.slice(0, 2)}-${String(idx + 1).padStart(2, '0')}`, n));
  }
  for (const row of rows) {
    const canonicalName = canonicalOfRow.get(row.id);
    if (!canonicalName) continue;
    const rel = [];
    for (const cross of CROSS_FAMILY_RELATIONS) {
      if (norm(canonicalName) === norm(cross) || norm(canonicalName).startsWith(norm(cross))) {
        const others = relationIds(approachIdByName, canonicalName).filter((oid) => oid !== row.id);
        rel.push(...others);
      }
    }
    if (rel.length) {
      row.relationsWithOtherApproaches = { similar: [...new Set(rel)] };
    }
  }

  const total = rows.length;
  const perFamily = {};
  for (const r of rows) perFamily[r.familyId] = (perFamily[r.familyId] ?? 0) + 1;

  const famType = families.map((f, i) => {
    const count = rows.filter((r) => r.familyId === f.id).length;
    return { ...f, approachCount: count };
  });

  const HEADER = `// GENERATED BY scripts/build-psicoterapia.mjs — NÃO EDITAR MANUALMENTE.\n// Fonte: library/cecistudy_base_psicoterapias/entregas/*.md (97 abordagens, 10 famílias).\n`;

  // Módulo pequeno das famílias (fica no bundle principal; usado pelo AppContext).
  const familiesTs = `${HEADER}import type { PsicoterapiaFamily } from '../types';\n\nexport const PSICOTERAPIA_FAMILIES: PsicoterapiaFamily[] = ${JSON.stringify(famType, null, 2)};\n`;
  const familiesOut = path.join(ROOT, 'src', 'data', 'psicoterapiaFamilies.ts');

  // Módulo grande das abordagens (~1MB) — carregado de forma lazy (fora do bundle inicial).
  const approachesTs = `${HEADER}import type { PsychologyApproach } from '../types';\n\nexport const PSICOTERAPIA_APPROACHES: PsychologyApproach[] = ${JSON.stringify(rows, null, 2)};\n`;
  const approachesOut = path.join(ROOT, 'src', 'data', 'psicoterapiaApproaches.ts');

  fs.writeFileSync(familiesOut, familiesTs, 'utf-8');
  fs.writeFileSync(approachesOut, approachesTs, 'utf-8');
  fs.rmSync(OUT_FILE, { force: true });
  console.log(`✅ gerado ${path.relative(ROOT, familiesOut)} e ${path.relative(ROOT, approachesOut)} — ${total} abordagens`);
  for (const [f, c] of Object.entries(perFamily)) console.log(`   ${f}: ${c}`);
}

main();
