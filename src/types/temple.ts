// Domínio: templo de conhecimento (catálogo estático + comparações) (MOD-001 / B.3).

// Seções do templo (slugs de navegação) agora vivem em `packages/navigation`
// (fonte única); re-exportamos daqui mantendo os imports via barrel `../types`.
export type { TempleSection } from '../../packages/navigation/src/temple';
export { TEMPLE_SECTION_SLUGS } from '../../packages/navigation/src/temple';

export const COMPARISON_AXES: ReadonlyArray<{
  key: string;
  label: string;
  question: string;
}> = [
  {
    key: 'como_cada_perspectiva_entende_o_ser_humano',
    label: 'conceito do ser humano',
    question: 'como cada perspectiva entende o ser humano?',
  },
  {
    key: 'como_cada_perspectiva_entende_o_sofrimento',
    label: 'conceito de sofrimento',
    question: 'como cada perspectiva entende o sofrimento?',
  },
  {
    key: 'papel_do_passado_e_do_contexto',
    label: 'passado e contexto',
    question: 'que peso têm história, ambiente e relações?',
  },
  {
    key: 'mecanismo_de_mudanca',
    label: 'mecanismo de mudança',
    question: 'como a mudança acontece?',
  },
  {
    key: 'papel_do_terapeuta',
    label: 'papel do terapeuta',
    question: 'que posição o profissional ocupa?',
  },
  {
    key: 'papel_do_paciente',
    label: 'papel do paciente',
    question: 'que participação é esperada?',
  },
  {
    key: 'relacao_terapeutica',
    label: 'relação terapêutica',
    question: 'como a relação participa do tratamento?',
  },
  {
    key: 'diferencas_na_pratica',
    label: 'na prática',
    question: 'como isso aparece em uma sessão?',
  },
  {
    key: 'evidencia_criticas_e_limitacoes',
    label: 'evidência e limites',
    question: 'o que sabemos e o que continua controverso?',
  },
] as const;

export type TempleEntityKind = 'abordagem' | 'autor' | 'conceito' | 'tecnica' | 'fenomeno';

export type TempleEntityReference = {
  tipoEntidade: TempleEntityKind;
  entidadeId: string;
  entidadeNome?: string;
  papel?: 'abordagem';
};

export type TempleComparisonType = 'convergencia' | 'complementaridade' | 'divergencia' | 'perspectivas';

export interface TempleComparisonAxisAnswer {
  entidadeId: string;
  entidadeNome: string;
  conteudo: string;
  fontesIds: string[];
}

export interface TempleComparisonAxis {
  id: string;
  key: string;
  ordem: number;
  titulo: string;
  pergunta: string;
  respostas: TempleComparisonAxisAnswer[];
}

export interface TempleComparisonEvidence {
  ordem: number;
  afirmacao: string;
  populacaoOuContexto: string;
  desfecho: string;
  resultado: string;
  fonteId: string;
}

export interface TempleComparisonSource {
  id: string;
  tipo: string;
  titulo: string;
  autor?: string | null;
  ano?: number | null;
  url?: string | null;
  escopo: string;
  usoNoApp: string;
}

export interface TempleComparison {
  /** Versão do contrato editorial do registro; ausente apenas em fontes legadas. */
  schemaVersion?: number;
  id: string;
  titulo: string;
  slug: string;
  tipo: TempleComparisonType;
  perguntaCentral: string;
  itens: TempleEntityReference[];
  eixosRecomendados: string[];
  eixos?: TempleComparisonAxis[];
  prioridade: 'P1' | 'P2';
  fase: string;
  fontesIniciais: string[];
  fontesDetalhadas?: TempleComparisonSource[];
  observacaoEditorial?: string;
  statusPesquisa: string;
  visaoGeral?: string;
  introducao?: string;
  convergencias?: string[];
  divergencias?: Array<{
    tema: string;
    porEntidade: Record<string, string[]>;
  }>;
  divergenciasResumo?: string[];
  pratica?: string;
  evidenciaNivel?: string;
  evidenciaSintese?: string;
  criticasELimitacoes?: string[];
  evidencias?: TempleComparisonEvidence[];
  dataPesquisa?: string;
  enfases?: Array<{
    dimensao: string;
    porEntidade: Record<string, { level: number; label?: string }>;
  }>;
  paraPensar?: string[];
  fontes?: string[];
  relacionados?: Array<{ tipo: 'abordagem' | 'autor' | 'conceito' | 'tecnica'; id: string }>;
}

/**
 * ===== Templo de Conhecimento (catálogo estático) =====
 * Entidades somente-leitura da pipeline editorial (`content/`): conceitos,
 * autores curados e técnicas canônicas. Na web vêm dos facades lazy
 * (`src/data/temple/`); no nativo, do `.db` embutido (`catalogDb.ts`).
 */

/**
 * Autor canônico do acervo editorial — entidade de CONSULTA, separada das
 * questões. Fonte: 139 fichas editoriais (`content/authors-curated/`),
 * parseadas por `content/build-authors-fichas.mjs`.
 */
export interface TempleAuthorSection {
  /** título original da seção (ex.: "A grande ideia", "Principais obras") */
  title: string;
  /** corpo em markdown (parágrafos, tabelas, listas, diagramas em code block) */
  body: string;
}

export interface TempleAuthor {
  id: string; // author-<slug>
  name: string;
  slug: string;
  /** ordem canônica do corpus editorial */
  order: number;
  /** famílias teóricas (1+ por autor, ex.: "Psicanalítica e Psicodinâmica") */
  families: string[];
  aliases: string[];
  /** "Em uma frase" do topo da ficha */
  oneLiner?: string | null;
  fullName?: string;
  born?: string;
  died?: string;
  origin?: string;
  family?: string;
  mainWork?: string;
  sections: TempleAuthorSection[];
}

/** Conceito oficial (fonte: content/concepts/, 12 domínios). */
export interface TempleConcept {
  id: string; // concept-01-fundamentos-psicologicos-<slug>
  name: string;
  slug?: string | null;
  domainId: string; // domain-01-…
  domainName?: string | null;
  definition: string;
  sections?: Record<string, string>;
  authorIds: string[];
  approachIds: string[];
  topicIds: string[];
  relatedConceptIds: string[];
  relationStatus?: string | null;
  status?: string | null;
  reviewStatus?: string | null;
}

/** Entrada leve do índice de conceitos (fica no chunk inicial do templo). */
export interface TempleConceptIndexEntry {
  id: string;
  name: string;
  domainId: string;
  domainName: string | null;
  definition: string; // resumo curto p/ lista
}

/** Domínio de conceitos ("fundamentos psicológicos", "cognição"…). */
export interface TempleConceptDomain {
  id: string;
  name: string;
}

/** Categoria de técnicas clínicas (10 domínios editoriais). */
export interface TempleTechniqueCategory {
  id: string; // domain-cognitivas…
  nome: string;
  slug?: string;
  descricaoCurta?: string | null;
  ordemExibicao?: number;
}

/** Técnica clínica canônica (135, fonte oficial content/techniques/). */
export interface TempleTechnique {
  id: string; // tec-…
  nome: string;
  emUmaFrase?: string | null;
  definicao?: string | null;
  objetivo?: string | null;
  comoFunciona?: string | null;
  quandoEUtilizada?: string | null;
  comoEAplicada?: string | null;
  origem?: string | null;
  exemploPratico?: string | null;
  evidencias?: string | null;
  limitacoes?: string | null;
  slug?: string;
  dominioId: string;
  dominioNomes?: string[];
  ordemExibicao?: number;
  abordagemIds?: string[];
  modeloIds?: string[];
  fonteIds?: string[];
  tecnicasRelacionadasIds?: string[];
  status?: string;
}
