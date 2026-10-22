/**
 * Contrato do rótulo acessível da tela (SPEC-007 §E / D9).
 *
 * A regra é: quando a tela muda, quem navega por leitor de tela ouve **o nome da
 * tela**. O rótulo vem do que a interface já mostra (título do header dinâmico),
 * com o nome da aba como reserva — nunca de uma tabela nova de nomes.
 */
import { describe, expect, it } from 'vitest';

import {
  TAB_LABELS,
  screenAnnouncement,
  tabLabel,
} from '../../../lib/motion/screenAnnounce';

describe('tabLabel', () => {
  it('nomeia as quatro abas raiz', () => {
    expect(Object.keys(TAB_LABELS)).toEqual(['home', 'faculdade', 'estudos', 'biblioteca']);
    for (const tab of Object.keys(TAB_LABELS)) {
      expect(tabLabel(tab)).toBe(tab);
    }
  });

  it('aba desconhecida devolve o próprio id em vez de undefined', () => {
    // Uma aba nova não pode deixar a região viva falando "undefined".
    expect(tabLabel('futuro')).toBe('futuro');
    expect(tabLabel('')).toBe('');
  });
});

describe('screenAnnouncement', () => {
  it('prefere o título do header — é o nome que está na tela', () => {
    expect(screenAnnouncement('faculdade', 'Psicologia')).toBe('Psicologia');
  });

  it('cai no nome da aba quando não há título (raiz de aba)', () => {
    expect(screenAnnouncement('estudos', undefined)).toBe('estudos');
  });

  it('ignora título vazio ou só com espaços', () => {
    expect(screenAnnouncement('home', '   ')).toBe('home');
    expect(screenAnnouncement('home', '')).toBe('home');
  });

  it('devolve null sem nenhum rótulo — o shell não renderiza região vazia', () => {
    // Falar uma string vazia faz o leitor anunciar uma tela em branco, que é
    // pior que não anunciar nada.
    expect(screenAnnouncement('', undefined)).toBeNull();
  });

  it('o título do header ganha do nome da aba mesmo quando os dois existem', () => {
    // Empate resolvido a favor do header: é a informação mais específica.
    expect(screenAnnouncement('biblioteca', 'Comparações')).toBe('Comparações');
  });
});