import { describe, expect, it } from 'vitest';
import { WEEK_CELL_STYLE, formatDueLabel } from '../homeMeta';

// `SPEC-M-018 D7`: `getGreeting` e `getDailyGoalMessage` saíram daqui — foram
// para `saudacao` e `resumoDoDia`, em `src/lib/voice.ts`, e os testes delas
// estão em `voice.test.ts`. Aqui fica o que **não** é voz: mapa de classe CSS e
// rótulo de prazo (`SPEC-C-014 D9`, camada 2).

describe('WEEK_CELL_STYLE', () => {
  it('cobre os quatro status de célula e nenhum é vazio', () => {
    expect(Object.keys(WEEK_CELL_STYLE).sort()).toEqual(['done', 'today', 'upcoming', 'weekend']);
    for (const [status, classe] of Object.entries(WEEK_CELL_STYLE)) {
      expect(classe.trim(), `status "${status}" sem classe`).not.toBe('');
    }
  });

  it('não é um arquivo de voz: nenhuma classe contém acento nem emoji', () => {
    // Este mapa **é** camada 2. Se alguém colar frase aqui, o teste diz.
    const comFrase = Object.values(WEEK_CELL_STYLE).filter((c) => /[à-ú♡✨🔥☕]/.test(c));
    expect(comFrase).toEqual([]);
  });
});

describe('formatDueLabel', () => {
  const TODAY = new Date('2026-08-22T15:00:00');

  it('sem prazo é neutro', () => {
    expect(formatDueLabel(undefined, TODAY)).toEqual({ label: 'sem prazo', urgency: 'none' });
  });

  it('hoje e amanhã têm urgência própria', () => {
    expect(formatDueLabel('2026-08-22', TODAY)).toEqual({ label: 'vence hoje!', urgency: 'today' });
    expect(formatDueLabel('2026-08-23', TODAY)).toEqual({ label: 'amanhã', urgency: 'tomorrow' });
  });

  it('futuro próximo vira "em N dias"; longe vira data curta', () => {
    expect(formatDueLabel('2026-08-25', TODAY)).toEqual({ label: 'em 3 dias', urgency: 'soon' });
    expect(formatDueLabel('2026-08-29', TODAY)).toEqual({ label: 'em 7 dias', urgency: 'soon' });
    const far = formatDueLabel('2026-09-20', TODAY);
    expect(far.urgency).toBe('later');
    expect(far.label).toMatch(/20 de sep|20 set|set/);
  });

  it('prazo atrasado sinaliza vermelho', () => {
    expect(formatDueLabel('2026-08-21', TODAY)).toEqual({ label: 'atrasada desde ontem', urgency: 'overdue' });
    expect(formatDueLabel('2026-08-15', TODAY)).toEqual({ label: 'atrasada há 7 dias', urgency: 'overdue' });
  });

  it('data inválida cai no neutro com o valor cru', () => {
    expect(formatDueLabel('não-é-data', TODAY)).toEqual({ label: 'não-é-data', urgency: 'none' });
  });
});
