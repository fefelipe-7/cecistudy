import { describe, expect, it } from 'vitest';
import {
  ROLLOVER_UNDO_WINDOW_MS,
  TOAST_DEFAULT_MS,
  remainingUndoWindowMs,
} from '../termUndoWindow';

describe('termUndoWindow — janela de desfazer da virada (SPEC-006 D8)', () => {
  it('a janela é a mesma que o toast com ação (8s)', () => {
    // Se esses dois números divergirem, uma metade da affordance morre antes
    // da outra: o botão fica morto na tela, ou o "desfazer" sobrevive invisível.
    expect(ROLLOVER_UNDO_WINDOW_MS).toBe(8000);
    expect(TOAST_DEFAULT_MS).toBe(2600);
  });

  it('no commit a janela inteira está aberta', () => {
    expect(remainingUndoWindowMs(1_000, 1_000)).toBe(ROLLOVER_UNDO_WINDOW_MS);
  });

  it('conta o que resta do relógio', () => {
    expect(remainingUndoWindowMs(0, 0)).toBe(8000);
    expect(remainingUndoWindowMs(0, 3000)).toBe(5000);
    expect(remainingUndoWindowMs(0, 7999)).toBe(1);
  });

  it('fecha em 0 no instante limite (e nunca fica negativa)', () => {
    expect(remainingUndoWindowMs(0, ROLLOVER_UNDO_WINDOW_MS)).toBe(0);
    // `Date.now()` acima do `appliedAt` (clock adjust) não pode abrir a janela
    // de novo nem devolver negativo para o `setTimeout`.
    expect(remainingUndoWindowMs(0, 20_000)).toBe(0);
  });
});
