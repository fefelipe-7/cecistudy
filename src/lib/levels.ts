import type { Sticker, StickerRarity } from '../types';

/**
 * Sistema de XP, níveis e títulos (spec stickers v2 §5).
 *
 * XP é derivado da raridade de cada sticker desbloqueado (`XP_BY_RARITY`) e
 * acumulado por categoria em `UserProfile.categoryXp` (opcional — retrocompatível).
 * A curva (LEVEL_THRESHOLDS) e os títulos são os mesmos para as 4 categorias;
 * o nível geral é a mesma curva escalada 4x (soma das categorias).
 */

export const XP_BY_RARITY: Record<StickerRarity, number> = {
  semente: 20,
  broto: 50,
  raiz: 120,
  copa: 250,
  floresta: 500,
};

/** XP acumulado necessário para cada nível (10 níveis). */
export const LEVEL_THRESHOLDS = [0, 50, 117, 207, 328, 491, 711, 1008, 1408, 1948];

export const MAX_LEVEL = LEVEL_THRESHOLDS.length;

/** Nível (1..10) a partir do XP acumulado da categoria. */
export function levelFor(xp: number): number {
  let level = 1;
  for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) level = i + 1;
  }
  return level;
}

/** Progresso para o próximo nível (para a barra da UI). */
export function xpToNextLevel(xp: number): {
  current: number;
  needed: number;
  isMaxLevel: boolean;
} {
  const level = levelFor(xp);
  if (level >= LEVEL_THRESHOLDS.length) {
    return { current: xp, needed: xp, isMaxLevel: true };
  }
  return {
    current: xp - LEVEL_THRESHOLDS[level - 1],
    needed: LEVEL_THRESHOLDS[level] - LEVEL_THRESHOLDS[level - 1],
    isMaxLevel: false,
  };
}

/** Títulos temáticos por categoria (10 níveis cada). */
export const TITLES_BY_CATEGORY: Record<Sticker['category'], string[]> = {
  faculdade: [
    'calouro perdido no mapa do campus',
    'aprendiz de powerpoint',
    'caçadora de slide no classroom',
    'fluente em "profa, vai cair na prova?"',
    'sobrevivente de sexta-feira com 3 provas',
    'ctrl+f em prontuário mental próprio',
    'citação abnt sem ansiedade',
    'terapeuta dos colegas de sala (não remunerada)',
    'quase formada, moralmente exausta',
    'veterana que já viu de tudo (inclusive a si mesma)',
  ],
  estudo: [
    'pomodoro de boa vontade',
    'flashcard iniciante',
    'destruidora de deck',
    'leitora de bula de remédio por hábito clínico',
    'streak guerreira',
    '3h de foco, 0h de sono',
    'mestre do "só mais uma revisão"',
    'vidão de estudo espaçado',
    'ninja do resumo esquematizado',
    'chat, é real? nível deusa do cronograma',
  ],
  leituras: [
    'leitora de orelha de livro',
    'pdf piratinha organizado(a)',
    'grifadora compulsiva',
    'sabe a diferença entre tcc e psicanálise de cabeça',
    'bibliófila em recuperação financeira',
    'freud já não assusta mais',
    'dsm debaixo do braço',
    'segunda cabeça externa (cognitive offloading com estilo)',
    'estante que pesa mais que a mochila',
    'é basicamente uma enciclopédia com crp',
  ],
  jornada: [
    'estagiária com o coração na mão',
    'analisando a fila do mercado sem querer',
    '"e você, como se sente sobre isso?" (modo automático ligado)',
    'supervisão, chat é sério',
    'diário de campo com plot twist toda semana',
    'quase-psicóloga em construção',
    'tcc: capítulo escrito, alma parcialmente intacta',
    'rumo ao crp com convicção',
    'reta final, café e resiliência',
    'formada (ou quase) — freud ficaria orgulhoso',
  ],
};

/** Nível geral (combinado): mesma curva escalada 4x (soma das 4 categorias). */
export const GENERAL_THRESHOLDS = LEVEL_THRESHOLDS.map((t) => t * 4);

export const GENERAL_TITLES = [
  'novata no cantinho',
  'estudante de primeiro contato terapêutico',
  'zona de conforto? não conheço',
  'rapport com o próprio cronograma',
  'vínculo terapêutico com a cafeteira',
  'insight tem hora, mas a sua vem sempre',
  'supervisionada oficial da vida acadêmica',
  'quase-crp, alma de veterana',
  'formação sólida, ansiedade administrável',
  'psicóloga(o) em formação nível mestre jedi da escuta ativa',
];

/** Título do nível (1..10) de uma categoria. */
export function levelTitle(category: Sticker['category'], level: number): string {
  const titles = TITLES_BY_CATEGORY[category];
  return titles[Math.min(MAX_LEVEL, Math.max(1, level)) - 1];
}

/** Título do nível geral (1..10). */
export function generalTitle(level: number): string {
  return GENERAL_TITLES[Math.min(MAX_LEVEL, Math.max(1, level)) - 1];
}

/** XP por categoria com fallback para perfis salvos antes dos níveis. */
export function categoryXpOrDefault(
  profile: { categoryXp?: Partial<Record<Sticker['category'], number>> }
): Record<Sticker['category'], number> {
  return { faculdade: 0, estudo: 0, leituras: 0, jornada: 0, ...(profile.categoryXp ?? {}) };
}

/** XP total (soma das categorias) para o nível geral. */
export function totalXp(
  profile: { categoryXp?: Partial<Record<Sticker['category'], number>> }
): number {
  const xp = categoryXpOrDefault(profile);
  return xp.faculdade + xp.estudo + xp.leituras + xp.jornada;
}