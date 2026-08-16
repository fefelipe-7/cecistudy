import type { Sticker, StickerCondition } from '../types';

/**
 * Catálogo fixo de stickers (conquistas) do cecistudy.
 *
 * Cada sticker tem uma condição de desbloqueio avaliada contra o estado real
 * do app por `src/lib/stickers.ts`. O que é persistido é apenas o progresso
 * (`unlocked` / `unlockedAt`); as definições vivem aqui no código.
 */
export interface StickerDefinition {
  id: string;
  name: string;
  emoji: string;
  description: string;
  category: Sticker['category'];
  condition: StickerCondition;
}

export const STICKER_CATALOG: StickerDefinition[] = [
  {
    id: 'st-1',
    name: 'primeira leitura concluída',
    emoji: '📚',
    description: 'você terminou de ler um livro ou capítulo acadêmico importante!',
    category: 'leituras',
    condition: { type: 'reading-done' },
  },
  {
    id: 'st-2',
    name: 'cantinho organizado',
    emoji: '🌷',
    description: 'complete o seu perfil e o cantinho fica todo seu.',
    category: 'faculdade',
    condition: { type: 'profile-set' },
  },
  {
    id: 'st-3',
    name: 'mestre dos flashcards',
    emoji: '🧠',
    description: 'revise mais de 10 conceitos fundamentais de psicologia.',
    category: 'estudo',
    condition: { type: 'flashcards-reviewed', min: 10 },
  },
  {
    id: 'st-4',
    name: 'primeiro dia de estágio',
    emoji: '🩺',
    description: 'registre o primeiro relatório de supervisão no diário de campo.',
    category: 'jornada',
    condition: { type: 'internship-first' },
  },
  {
    id: 'st-5',
    name: 'semana do café & livros',
    emoji: '☕',
    description: 'mantenha constância de 5 dias seguidos estudando.',
    category: 'estudo',
    condition: { type: 'streak', min: 5 },
  },
  {
    id: 'st-6',
    name: 'rumo ao CRP!',
    emoji: '🎓',
    description: 'alcance mais da metade da graduação em psicologia.',
    category: 'jornada',
    condition: { type: 'degree-half' },
  },
  {
    id: 'st-7',
    name: 'análise de autor',
    emoji: '✨',
    description: 'conecte 3 conceitos aos seus autores no seu mapa de conhecimento.',
    category: 'faculdade',
    condition: { type: 'concepts-with-authors', min: 3 },
  },
  {
    id: 'st-8',
    name: 'defesa do tcc',
    emoji: '🏆',
    description: 'conclua a revisão final e apresentação do seu tcc de psicologia.',
    category: 'jornada',
    condition: { type: 'tcc-done' },
  },
  {
    id: 'st-9',
    name: 'foco de verdade',
    emoji: '⏱️',
    description: 'registre 5 sessões de foco no seu study corner.',
    category: 'estudo',
    condition: { type: 'sessions', min: 5 },
  },
  {
    id: 'st-10',
    name: 'caderno caprichado',
    emoji: '✍️',
    description: 'anote 10 aulas para manter o diário da faculdade em dia.',
    category: 'faculdade',
    condition: { type: 'class-notes', min: 10 },
  },
  {
    id: 'st-11',
    name: 'devoradora de livros',
    emoji: '📖',
    description: 'acumule 500 páginas lidas entre todas as suas leituras.',
    category: 'leituras',
    condition: { type: 'pages-read', min: 500 },
  },
  {
    id: 'st-12',
    name: 'maratona de foco',
    emoji: '🔥',
    description: 'mantenha uma ofensiva de 14 dias seguidos de estudo.',
    category: 'estudo',
    condition: { type: 'streak', min: 14 },
  },
  {
    id: 'st-13',
    name: 'missões cumpridas',
    emoji: '✅',
    description: 'conclua 15 tarefas do seu plano de estudos.',
    category: 'faculdade',
    condition: { type: 'tasks-done', min: 15 },
  },
  {
    id: 'st-14',
    name: 'biblioteca pessoal',
    emoji: '🔖',
    description: 'salve 5 livros na sua biblioteca do cantinho.',
    category: 'leituras',
    condition: { type: 'saved-books', min: 5 },
  },
  // ---- faculdade ----
  {
    id: 'st-15',
    name: 'primeira avaliação registrada',
    emoji: '📝',
    description: 'anote a primeira prova ou avaliação do semestre.',
    category: 'faculdade',
    condition: { type: 'exams-added', min: 1 },
  },
  {
    id: 'st-16',
    name: 'frente nas provas',
    emoji: '🏅',
    description: 'conclua 3 provas e sinta o alívio de chegar lá.',
    category: 'faculdade',
    condition: { type: 'exams-done', min: 3 },
  },
  {
    id: 'st-17',
    name: 'conceitos na bagagem',
    emoji: '🎒',
    description: 'guarde 10 conceitos de psicologia no seu cantinho.',
    category: 'faculdade',
    condition: { type: 'concepts-known', min: 10 },
  },
  {
    id: 'st-18',
    name: 'galeria de autores',
    emoji: '👥',
    description: 'registre 5 autores e suas ideias.',
    category: 'faculdade',
    condition: { type: 'authors-known', min: 5 },
  },
  {
    id: 'st-19',
    name: 'materiais em dia',
    emoji: '📂',
    description: 'adicione 5 materiais de apoio nas suas disciplinas.',
    category: 'faculdade',
    condition: { type: 'materials-added', min: 5 },
  },
  {
    id: 'st-20',
    name: 'grade montada',
    emoji: '🗓️',
    description: 'crie 3 disciplinas para organizar o semestre.',
    category: 'faculdade',
    condition: { type: 'courses', min: 3 },
  },
  // ---- estudo ----
  {
    id: 'st-21',
    name: 'primeiro foco',
    emoji: '🍅',
    description: 'registre a sua primeira sessão de estudo.',
    category: 'estudo',
    condition: { type: 'sessions', min: 1 },
  },
  {
    id: 'st-22',
    name: 'deck de cartas',
    emoji: '🃏',
    description: 'crie 10 flashcards para revisar a matéria.',
    category: 'estudo',
    condition: { type: 'flashcards-count', min: 10 },
  },
  {
    id: 'st-23',
    name: 'perguntas no cantinho',
    emoji: '❓',
    description: 'registre 5 questões de estudo para praticar.',
    category: 'estudo',
    condition: { type: 'questions-created', min: 5 },
  },
  {
    id: 'st-24',
    name: 'técnicas na manga',
    emoji: '🛠️',
    description: 'aprenda 3 técnicas de estudo no seu cantinho.',
    category: 'estudo',
    condition: { type: 'techniques-used', min: 3 },
  },
  {
    id: 'st-25',
    name: 'duas horinhas de foco',
    emoji: '⏰',
    description: 'acumule 120 minutos de estudo focado.',
    category: 'estudo',
    condition: { type: 'study-minutes', min: 120 },
  },
  {
    id: 'st-26',
    name: 'constância real',
    emoji: '📅',
    description: 'registre 15 dias ativos de estudo no cantinho.',
    category: 'estudo',
    condition: { type: 'streak-total', min: 15 },
  },
  // ---- leituras ----
  {
    id: 'st-27',
    name: 'primeira leitura registrada',
    emoji: '📖',
    description: 'adicione a primeira leitura à sua estante.',
    category: 'leituras',
    condition: { type: 'reading-count', min: 1 },
  },
  {
    id: 'st-28',
    name: 'livro na cabeceira',
    emoji: '🛏️',
    description: 'tenha uma leitura em andamento no seu cantinho.',
    category: 'leituras',
    condition: { type: 'reading-in-progress', min: 1 },
  },
  {
    id: 'st-29',
    name: 'cem páginas',
    emoji: '📄',
    description: 'acumule 100 páginas lidas entre as suas leituras.',
    category: 'leituras',
    condition: { type: 'pages-read', min: 100 },
  },
  {
    id: 'st-30',
    name: 'leitora assídua',
    emoji: '📚',
    description: 'tenha 5 leituras registradas na sua estante.',
    category: 'leituras',
    condition: { type: 'reading-count', min: 5 },
  },
  {
    id: 'st-31',
    name: 'anotações soltas',
    emoji: '🗒️',
    description: 'registre 5 notas avulsas de pensamentos e ideias.',
    category: 'leituras',
    condition: { type: 'loose-notes', min: 5 },
  },
  {
    id: 'st-32',
    name: 'estante querida',
    emoji: '🏷️',
    description: 'salve 10 livros na sua biblioteca pessoal.',
    category: 'leituras',
    condition: { type: 'saved-books', min: 10 },
  },
  {
    id: 'st-33',
    name: 'maratona literária',
    emoji: '🏃‍♀️',
    description: 'acumule 1000 páginas lidas no seu cantinho.',
    category: 'leituras',
    condition: { type: 'pages-read', min: 1000 },
  },
  // ---- jornada ----
  {
    id: 'st-34',
    name: 'hora na clínica',
    emoji: '🕐',
    description: 'registre 1 hora de estágio no seu diário de campo.',
    category: 'jornada',
    condition: { type: 'internship-hours', min: 1 },
  },
  {
    id: 'st-35',
    name: 'diário de campo em dia',
    emoji: '📔',
    description: 'registre 3 relatórios de estágio no diário.',
    category: 'jornada',
    condition: { type: 'internship-logs', min: 3 },
  },
  {
    id: 'st-36',
    name: 'tcc germinando',
    emoji: '🌱',
    description: 'crie o seu tcc com um título e uma pergunta de pesquisa.',
    category: 'jornada',
    condition: { type: 'tcc-created' },
  },
  {
    id: 'st-37',
    name: 'primeiro capítulo do tcc',
    emoji: '📑',
    description: 'conclua o primeiro capítulo do seu tcc.',
    category: 'jornada',
    condition: { type: 'tcc-chapters-done', min: 1 },
  },
  {
    id: 'st-38',
    name: 'reta final da graduação',
    emoji: '🏁',
    description: 'chegue ao penúltimo semestre da sua graduação.',
    category: 'jornada',
    condition: { type: 'penultimate-semester' },
  },
  {
    id: 'st-39',
    name: 'ofensiva de mestre',
    emoji: '🏆',
    description: 'alcance uma ofensiva de 21 dias de estudos seguidos.',
    category: 'jornada',
    condition: { type: 'streak-longest', min: 21 },
  },
  {
    id: 'st-40',
    name: 'formatura!',
    emoji: '🎓',
    description: 'complete o último semestre da sua graduação em psicologia.',
    category: 'jornada',
    condition: { type: 'graduation' },
  },
];

/** Condição de desbloqueio por id (fallback: nunca desbloqueia). */
export function stickerConditionFor(id: string): StickerCondition | undefined {
  return STICKER_CATALOG.find((s) => s.id === id)?.condition;
}

/** Constroi um sticker do catálogo a partir do progresso persistido (ou novo). */
export function stickerFromCatalog(
  def: StickerDefinition,
  progress?: Sticker
): Sticker {
  return {
    id: def.id,
    name: def.name,
    emoji: def.emoji,
    description: def.description,
    category: def.category,
    condition: def.condition,
    unlocked: progress?.unlocked ?? false,
    unlockedAt: progress?.unlocked ? progress.unlockedAt : undefined,
  };
}

/** Catálogo completo, todo bloqueado (modo vazio — conquistas a buscar). */
export function lockedStickerCatalog(): Sticker[] {
  return STICKER_CATALOG.map((def) => stickerFromCatalog(def, undefined));
}