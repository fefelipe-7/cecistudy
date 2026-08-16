// GENERATED FROM cecistudy_banco_745_questoes.json — NÃO EDITAR MANUALMENTE.
import type { StudyQuestion } from '../types';

// Carrega JSON (resolveJsonModule = true no tsconfig)
import questoesJson from './questions/cecistudy_banco_745_questoes.json' assert { type: 'json' };

interface BancoQuestaoRaw {
  id: string;
  texto: string;
  tipo: string;
  alternativas: string[];
  gabarito: string;
  explicacao: string;
  area: string;
  tema: string;
  subtema: string;
  autor_ou_autores: string[];
  escola_ou_abordagem: string;
  dificuldade: string;
  tipo_conhecimento: string;
  referencias_de_apoio: string[];
  origem: string;
  status_revisao: string;
  banca: string | null;
  prova: string | null;
  ano: string | null;
  formato: string;
  resposta_discursiva: string;
  criterios_de_correcao: string[];
  afirmativas: string[];
  itens_de_associacao: string[];
}

function mapToStudyQuestion(raw: BancoQuestaoRaw): StudyQuestion {
  const correctIdx = raw.gabarito.charCodeAt(0) - 65;
  const correctText = raw.alternativas[correctIdx] ?? '';

  return {
    id: raw.id,
    question: raw.texto,
    options: raw.alternativas,
    answer: correctText,
    explanation: raw.explicacao,
    area: raw.area,
    tema: raw.tema,
    subtema: raw.subtema,
    escolaOuAbordagem: raw.escola_ou_abordagem,
    dificuldade: raw.dificuldade as 'basica' | 'intermediaria' | 'avancada',
    tipoConhecimento: raw.tipo_conhecimento,
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