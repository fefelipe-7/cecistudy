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