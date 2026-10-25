import { describe, expect, it, vi } from 'vitest';

/**
 * O que este teste protege que outro gate não protege: **o háptico não pode
 * ser um risco no web** (SPEC-M-027 D15 · I13). Se o guard de plataforma sair,
 * todo toque numa PWA chama a ponte nativa e a promise rejeitada vira ruído no
 * console — ou pior, exceção em handler de toque.
 *
 * "Háptico nunca é o único sinal" não é testável aqui: é revisão de cada
 * chamada (sempre acompanhada de toast, mudança de rótulo ou fechamento).
 */
vi.mock('@capacitor/haptics', () => ({
  Haptics: { impact: vi.fn(), notification: vi.fn() },
  ImpactStyle: { Light: 'LIGHT' },
  NotificationType: { Success: 'SUCCESS', Warning: 'WARNING' },
}));

vi.mock('../storage', () => ({ isNativePlatform: false }));

import { Haptics } from '@capacitor/haptics';
import { hapticSuccess, hapticTap, hapticWarning } from '../haptics';

describe('haptics (SPEC-M-027 D15)', () => {
  it('no web não lança e não chama a ponte nativa', () => {
    expect(() => {
      hapticTap();
      hapticSuccess();
      hapticWarning();
    }).not.toThrow();

    expect(Haptics.impact).not.toHaveBeenCalled();
    expect(Haptics.notification).not.toHaveBeenCalled();
  });
});
