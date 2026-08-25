// GENERATED FROM cecistudy_banco_3004_questoes.json (via content/build-questions-bank.mjs) — NÃO EDITAR MANUALMENTE.
import type { StudyQuestion } from '../types';

// Carrega JSON (resolveJsonModule = true no tsconfig)
import questoesJson from './questions/cecistudy_banco_3004_questoes.json' with { type: 'json' };

interface BancoQuestaoRaw {
  id: string;
  texto: string;
  tipo: string;
  alternativas: string[];
  gabarito: string;
  explicacao: string;
  area: string | null;
  tema: string | null;
  subtema: string | null;
  autor_ou_autores: string[];
  escola_ou_abordagem: string | null;
  dificuldade: string | null;
  tipo_conhecimento: string | null;
  referencias_de_apoio: string[];
  origem: string;
  status_revisao: string | null;
  banca: string | null;
  prova: string | null;
  ano: string | null;
  formato: string;
  resposta_discursiva: string;
  criterios_de_correcao: string[];
  afirmativas: string[];
  itens_de_associacao: string[];
}

const DIFICULDADES = ['basica', 'intermediaria', 'avancada'] as const;

function mapToStudyQuestion(raw: BancoQuestaoRaw): StudyQuestion {
  const correctIdx = raw.gabarito.charCodeAt(0) - 65;
  const correctText = raw.alternativas[correctIdx] ?? '';
  const dificuldade =
    raw.dificuldade && (DIFICULDADES as readonly string[]).includes(raw.dificuldade)
      ? (raw.dificuldade as (typeof DIFICULDADES)[number])
      : undefined;

  return {
    id: raw.id,
    question: raw.texto,
    options: raw.alternativas,
    answer: correctText,
    explanation: raw.explicacao,
    area: raw.area ?? undefined,
    tema: raw.tema ?? undefined,
    subtema: raw.subtema ?? undefined,
    escolaOuAbordagem: raw.escola_ou_abordagem ?? undefined,
    dificuldade,
    tipoConhecimento: raw.tipo_conhecimento ?? undefined,
    autores: raw.autor_ou_autores,
    referencias: raw.referencias_de_apoio,
    formato: raw.formato,
    origem: raw.origem,
    gabarito: raw.gabarito,
    respostaDiscursiva: raw.resposta_discursiva,
    criteriosDeCorrecao: raw.criterios_de_correcao,
    afirmativas: raw.afirmativas,
    itensDeAssociacao: raw.itens_de_associacao,
  };
}

export const BANCO_QUESTOES: StudyQuestion[] = (questoesJson as BancoQuestaoRaw[]).map(mapToStudyQuestion);