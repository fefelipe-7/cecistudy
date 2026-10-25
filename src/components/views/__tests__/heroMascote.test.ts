import { describe, expect, it } from 'vitest';
import { saudacao, saudacaoTurno } from '../../../lib/voice';
import { HERO_MASCOTES, heroMascote } from '../home/heroMascote';

// Protege o que nenhum outro gate cobre: a fronteira de hora que escolhe o
// turno (e, com ele, a arte do hero) e a garantia de que as oito artes entram.
describe('turno do dia', () => {
  it.each([
    [4, 59, 'madrugada'],
    [5, 0, 'manha'],
    [11, 59, 'manha'],
    [12, 0, 'tarde'],
    [17, 59, 'tarde'],
    [18, 0, 'noite'],
    [23, 59, 'noite'],
  ])('às %i:%i o turno é %s', (hora, minuto, turno) => {
    expect(saudacaoTurno(new Date(2026, 0, 1, hora, minuto))).toBe(turno);
  });

  it('a saudação continua saindo do mesmo turno', () => {
    expect(saudacao(new Date(2026, 0, 1, 9, 0))).toBe('bom dia');
    expect(saudacao(new Date(2026, 0, 1, 20, 0))).toBe('boa noite');
  });
});

describe('arte do hero', () => {
  it('alterna entre as duas artes do turno conforme o dia', () => {
    expect(heroMascote('manha', 2)).toBe('breakfast-happy');
    expect(heroMascote('manha', 3)).toBe('jump-hello');
    expect(heroMascote('noite', 2)).not.toBe(heroMascote('noite', 3));
  });

  it('mostra as oito artes nos dois dias de cada turno', () => {
    const vistas = (['madrugada', 'manha', 'tarde', 'noite'] as const).flatMap((turno) => [
      heroMascote(turno, 2),
      heroMascote(turno, 3),
    ]);
    expect(new Set(vistas).size).toBe(Object.keys(HERO_MASCOTES).length);
    expect(new Set(vistas).size).toBe(8);
  });
});
