// Seções do templo de conhecimento — puros (slugs de navegação na pilha).
// Movidos para packages/navigation por serem navegáveis pela rota; src/types/temple
// re-exporta daqui (fonte única) mantendo os imports existentes via barrel.

/** Seções do templo de conhecimento acessíveis pela pilha (`#/biblioteca/templo/<slug>`). */
export type TempleSection = 'conceitos' | 'autores' | 'tecnicas' | 'comparacoes';

export const TEMPLE_SECTION_SLUGS: Record<TempleSection, string> = {
  conceitos: 'conceitos',
  autores: 'autores',
  tecnicas: 'tecnicas',
  comparacoes: 'comparacoes',
};
