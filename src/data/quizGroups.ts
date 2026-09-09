import type { StudyQuestion, QuestionGroup, QuizConfig } from '../types';

// --- Cache (1 processamento por visita) ---
let questionsCache: StudyQuestion[] | null = null;
let groupsCache: QuestionGroup[] | null = null;

const DIFICULDADES = ['basica', 'intermediaria', 'avancada'] as const;

function members(arr: unknown[] | undefined | null): string[] {
  return (arr ?? []).filter((v): v is string => typeof v === 'string' && v.trim() !== '');
}

function uniqueSort(arr: string[]): string[] {
  return Array.from(new Set(members(arr))).sort((a, b) => a.localeCompare(b, 'pt-BR'));
}

const APPROACH_ICONS: Record<string, string> = {
  'Psicanálise': '🧠',
  'TCC': '🎯',
  'Humanista': '🌱',
  'Sistêmica': '🔗',
  'Comportamental': '⚡',
  'Cognitiva': '💭',
  'Existencial': '🌅',
  'Junguiana': '🔮',
  'Rogeriana': '🤝',
  Fenomenologia: '👁',
  Psicossomática: '💚',
};

const AREA_ICONS: Record<string, string> = {
  'Psicologia Clínica': '🩺',
  'Psicopatologia': '🔬',
  'Neuropsicologia': '🧠',
  'Psicologia do Desenvolvimento': '🌱',
  'Psicologia Social': '👥',
  'Psicologia Educacional': '📚',
  'Avaliação Psicológica': '📋',
  'Psicologia da Saúde': '💚',
  'Teorias e Sistemas Psicológicos': '📖',
  Ética: '⚖',
};

const DIFF_ICONS: Record<string, string> = {
  basica: '🟢',
  intermediaria: '🟡',
  avancada: '🔴',
};

const DIFF_LABELS: Record<string, string> = {
  basica: 'básica',
  intermediaria: 'intermediária',
  avancada: 'avançada',
};

function pickIcon(escola?: string, area?: string, dificuldade?: string): string {
  if (escola) return APPROACH_ICONS[escola] ?? '📚';
  if (dificuldade) return DIFF_ICONS[dificuldade] ?? '📚';
  return AREA_ICONS[area ?? ''] ?? '📚';
}

function pickDescription(escola?: string, area?: string, dificuldade?: string): string {
  if (escola) return `questões sobre ${escola}`;
  if (dificuldade) return `questões de nível ${DIFF_LABELS[dificuldade] ?? dificuldade}`;
  if (area) return `questões de ${area}`;
  return 'questões variadas';
}

function emptyConfig(): QuizConfig {
  return { areas: [], temas: [], escolas: [], dificuldades: [], count: 20 };
}

function makeGroup(
  id: string,
  name: string,
  description: string,
  icon: string,
  qs: StudyQuestion[],
  filter: Partial<QuizConfig>
): QuestionGroup {
  const filterConfig: QuizConfig = { ...emptyConfig(), ...filter };
  const allAuthors = new Set<string>();
  const allApproaches = new Set<string>();
  const allConcepts = new Set<string>();
  const allAreas = new Set<string>();
  const allDificuldades = new Set<string>();
  const allEscolas = new Set<string>();

  for (const q of qs) {
    members(q.autores).forEach((a) => allAuthors.add(a));
    if (q.escolaOuAbordagem) allApproaches.add(q.escolaOuAbordagem);
    members(q.conceptIds).forEach((c) => allConcepts.add(c));
    if (q.area) allAreas.add(q.area);
    if (q.dificuldade) allDificuldades.add(q.dificuldade);
    if (q.escolaOuAbordagem) allEscolas.add(q.escolaOuAbordagem);
  }

  return {
    id,
    name,
    description,
    icon,
    questionCount: qs.length,
    authors: uniqueSort(Array.from(allAuthors)),
    approaches: uniqueSort(Array.from(allApproaches)),
    concepts: uniqueSort(Array.from(allConcepts)),
    areas: uniqueSort(Array.from(allAreas)),
    dificuldades: Array.from(allDificuldades).filter((d) => DIFICULDADES.includes(d as any)) as ('basica' | 'intermediaria' | 'avancada')[],
    escolas: uniqueSort(Array.from(allEscolas)),
    filterConfig,
  };
}

export async function buildQuizGroups(): Promise<QuestionGroup[]> {
  if (groupsCache) return groupsCache;

  const questions = await loadQuestions();
  questionsCache = questions;

  const groups: QuestionGroup[] = [];

  // 1. Grupos por escola/abordagem
  const byEscola = new Map<string | undefined, StudyQuestion[]>();
  for (const q of questions) {
    const key = q.escolaOuAbordagem ?? '__outra__';
    if (!byEscola.has(key)) byEscola.set(key, []);
    byEscola.get(key)!.push(q);
  }
  const sortedEscolas = [...byEscola.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  for (const escola of sortedEscolas) {
    if (escola === '__outra__') continue;
    const qs = byEscola.get(escola)!;
    groups.push(
      makeGroup(
        `escola-${escola.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-')}`,
        escola,
        pickDescription(escola),
        pickIcon(escola),
        qs,
        { escolas: [escola] }
      )
    );
  }

  // 2. Grupos por área
  const byArea = new Map<string | undefined, StudyQuestion[]>();
  for (const q of questions) {
    const key = q.area ?? '__outra__';
    if (!byArea.has(key)) byArea.set(key, []);
    byArea.get(key)!.push(q);
  }
  const sortedAreas = [...byArea.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  for (const area of sortedAreas) {
    if (area === '__outra__') continue;
    const qs = byArea.get(area)!;
    groups.push(
      makeGroup(
        `area-${area.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-')}`,
        area,
        pickDescription(undefined, area),
        pickIcon(undefined, area),
        qs,
        { areas: [area] }
      )
    );
  }

  // 3. Grupos por dificuldade
  for (const dif of DIFICULDADES) {
    const qs = questions.filter((q) => q.dificuldade === dif);
    if (qs.length > 0) {
      groups.push(
        makeGroup(
          `dificuldade-${dif}`,
          DIFF_LABELS[dif] ?? dif,
          pickDescription(undefined, undefined, dif),
          pickIcon(undefined, undefined, dif),
          qs,
          { dificuldades: [dif] }
        )
      );
    }
  }

  // 4. Grupos por banca (origem do exame)
  const byBanca = new Map<string, StudyQuestion[]>();
  for (const q of questions) {
    const key = q.origem ?? '__nenhuma__';
    if (!byBanca.has(key)) byBanca.set(key, []);
    byBanca.get(key)!.push(q);
  }
  const sortedBancas = [...byBanca.keys()].sort((a, b) => a.localeCompare(b, 'pt-BR'));
  for (const banca of sortedBancas) {
    if (banca === '__nenhuma__' || banca.trim() === '') continue;
    const qs = byBanca.get(banca)!;
    groups.push(
      makeGroup(
        `banca-${banca.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-')}`,
        banca,
        `questões da banca ${banca}`,
        '📝',
        qs,
        { escolas: [...new Set(members(qs.map((q) => q.escolaOuAbordagem).filter(Boolean)))], areas: [...new Set(members(qs.map((q) => q.area).filter(Boolean)))] }
      )
    );
  }

  // 5. Grupo "tudo" — pool geral do banco
  groups.push(
    makeGroup(
      'all',
      'banco completo',
      'todas as questões do acervo',
      '📚',
      questions,
      {}
    )
  );

  groupsCache = groups;
  return groups;
}

export async function loadQuestions(): Promise<StudyQuestion[]> {
  if (questionsCache) return questionsCache;
  const mod = await import('../data/bancoQuestoes');
  questionsCache = mod.BANCO_QUESTOES;
  return questionsCache;
}