import { describe, expect, it } from 'vitest';
import { COMPARISON_AXES } from '../../types';
import { comparisonsFile } from '../../data/temple/index';
import { getTempleComparison, getTempleComparisons } from '../templeData';

describe('comparações do Templo', () => {
  it('expõe a coleção editorial normalizada com slugs únicos', () => {
    const comparisons = comparisonsFile.comparacoes;
    expect(comparisons).toHaveLength(130);
    expect(new Set(comparisons.map((comparison) => comparison.id)).size).toBe(130);
    expect(new Set(comparisons.map((comparison) => comparison.slug)).size).toBe(130);
    expect(comparisonsFile.fontes).toHaveLength(21);
    expect(comparisons.every((comparison) => comparison.itens.length >= 2)).toBe(true);
  });

  it('converte campos editoriais para o contrato camelCase', () => {
    const comparison = comparisonsFile.comparacoes[0];
    expect(comparison.perguntaCentral).toBeTruthy();
    expect(comparison.eixosRecomendados).toEqual(COMPARISON_AXES.map((axis) => axis.key));
    expect(comparison.fontesIniciais).toBeInstanceOf(Array);
    expect('pergunta_central' in comparison).toBe(false);
  });

  it('preserva o conteúdo estruturado por eixo, evidência e fonte', () => {
    const comparison = comparisonsFile.comparacoes.find((item) => item.id === 'cmp-001');
    expect(comparison?.eixos).toHaveLength(9);
    expect(comparison?.eixos.reduce((total, axis) => total + axis.respostas.length, 0)).toBe(18);
    expect(comparison?.evidencias.length).toBeGreaterThan(0);
    expect(comparison?.fontesDetalhadas.length).toBeGreaterThan(0);
    expect(comparison?.fontesDetalhadas[0].titulo).toBeTruthy();
  });

  it('preserva comparações com múltiplas perspectivas e fenômenos', () => {
    const comparison = comparisonsFile.comparacoes.find((item) => item.id === 'cmp-048');
    expect(comparison).toBeTruthy();
    expect(comparison!.itens.length).toBeGreaterThan(2);
    expect(comparison!.itens[0]).toMatchObject({
      tipoEntidade: 'fenomeno',
      entidadeId: 'fenomeno-ansiedade',
      papel: 'abordagem',
    });
    expect(comparison!.eixos.reduce((total, axis) => total + axis.respostas.length, 0)).toBe(54);
  });

  it('resolve a técnica canônica adicionada pela migração', () => {
    const comparison = comparisonsFile.comparacoes.find((item) => item.id === 'cmp-122');
    expect(comparison?.itens).toContainEqual(expect.objectContaining({
      tipoEntidade: 'tecnica',
      entidadeId: 'tec-psicoeducacao',
    }));
  });

  it('lista e abre pelo slug através do loader público', async () => {
    const comparisons = await getTempleComparisons();
    expect(comparisons).toHaveLength(130);
    const comparison = await getTempleComparison('psicanalise-terapia-cognitiva-beck');
    expect(comparison?.id).toBe('cmp-002');
  });
});
