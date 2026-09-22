import { describe, expect, it } from 'vitest';
import {
  categoryXpOrDefault,
  generalTitle,
  levelFor,
  levelTitle,
  totalXp,
  XP_BY_RARITY,
  xpToNextLevel,
  MAX_LEVEL,
  LEVEL_THRESHOLDS,
} from '../levels';

describe('XP_BY_RARITY', () => {
  it('concede XP por raridade conforme o spec', () => {
    expect(XP_BY_RARITY).toEqual({ semente: 20, broto: 50, raiz: 120, copa: 250, floresta: 500 });
  });
});

describe('levelFor', () => {
  it('level 1 em 0 XP e level 2 exatamente em 50', () => {
    expect(levelFor(0)).toBe(1);
    expect(levelFor(49)).toBe(1);
    expect(levelFor(50)).toBe(2);
    expect(levelFor(116)).toBe(2);
  });

  it('boundaries dos thresholds', () => {
    for (let i = 1; i < LEVEL_THRESHOLDS.length; i++) {
      expect(levelFor(LEVEL_THRESHOLDS[i] - 1)).toBe(i);
      expect(levelFor(LEVEL_THRESHOLDS[i])).toBe(i + 1);
    }
  });

  it('maxlevel acima do último threshold', () => {
    expect(levelFor(LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1])).toBe(MAX_LEVEL);
    expect(levelFor(100000)).toBe(MAX_LEVEL);
  });
});

describe('xpToNextLevel', () => {
  it('retorna progresso até o próximo nível', () => {
    expect(xpToNextLevel(0)).toEqual({ current: 0, needed: 50, isMaxLevel: false });
    expect(xpToNextLevel(50)).toEqual({ current: 0, needed: 67, isMaxLevel: false });
    expect(xpToNextLevel(116)).toEqual({ current: 66, needed: 67, isMaxLevel: false });
  });

  it('isMaxLevel no topo', () => {
    const top = xpToNextLevel(LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1]);
    expect(top.isMaxLevel).toBe(true);
  });
});

describe('títulos', () => {
  it('indexa título por nível e por categoria', () => {
    expect(levelTitle('faculdade', 1)).toBe('calouro perdido no mapa do campus');
    expect(levelTitle('estudo', 5)).toBe('streak guerreira');
    expect(levelTitle('leituras', 10)).toBe('é basicamente uma enciclopédia com crp');
    expect(levelTitle('jornada', 8)).toBe('rumo ao crp com convicção');
  });

  it('géneralTitle em cada nível', () => {
    expect(generalTitle(1)).toBe('novata no cantinho');
    expect(generalTitle(3)).toBe('zona de conforto? não conheço');
    expect(generalTitle(10)).toBe('psicóloga(o) em formação nível mestre jedi da escuta ativa');
  });

  it('clamp de nível fora do range', () => {
    expect(levelTitle('faculdade', 0)).toBe(levelTitle('faculdade', 1));
    expect(levelTitle('faculdade', 99)).toBe(levelTitle('faculdade', MAX_LEVEL));
  });
});

describe('categoryXpOrDefault', () => {
  it('fallback zero quando ausente', () => {
    expect(categoryXpOrDefault({})).toEqual({ faculdade: 0, estudo: 0, leituras: 0, jornada: 0 });
    expect(categoryXpOrDefault({ categoryXp: undefined })).toEqual({
      faculdade: 0,
      estudo: 0,
      leituras: 0,
      jornada: 0,
    });
  });

  it('mescla com o que já existir', () => {
    expect(categoryXpOrDefault({ categoryXp: { estudo: 120 } })).toEqual({
      faculdade: 0,
      estudo: 120,
      leituras: 0,
      jornada: 0,
    });
  });

  it('totalXp soma as categorias', () => {
    expect(totalXp({})).toBe(0);
    expect(totalXp({ categoryXp: { estudo: 50, leituras: 20, jornada: 120, faculdade: 0 } })).toBe(190);
  });
});