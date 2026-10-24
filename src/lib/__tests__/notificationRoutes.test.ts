import { describe, expect, it } from 'vitest';
import { resolveNotificationRoute } from '../notificationRoutes';

describe('resolveNotificationRoute (SPEC-M-025 D8)', () => {
  it('TCC: família nova, com alvo e foco', () => {
    expect(
      resolveNotificationRoute({ family: 'thesis', target: { tab: 'capitulos', entityId: 'cap-1' } })
    ).toEqual({ kind: 'tcc', tab: 'capitulos', focusId: 'cap-1' });
  });

  it('TCC: formato legado (sem family) continua navegando', () => {
    expect(resolveNotificationRoute({ thesis: { tab: 'orientacao' } })).toEqual({
      kind: 'tcc',
      tab: 'orientacao',
    });
  });

  it('prova abre o calendário no dia da prova', () => {
    expect(
      resolveNotificationRoute({ family: 'exam', target: { tab: 'calendario', day: '2026-11-10' } })
    ).toEqual({ kind: 'calendar', day: '2026-11-10' });
  });

  it('aula abre Faculdade; estágio abre o diário; tarefa e resumo abrem a Home', () => {
    expect(resolveNotificationRoute({ family: 'class', target: { tab: 'faculdade' } })).toEqual({
      kind: 'tab',
      tab: 'faculdade',
    });
    expect(resolveNotificationRoute({ family: 'internship', target: { tab: 'estagio' } })).toEqual({
      kind: 'internship',
    });
    expect(resolveNotificationRoute({ family: 'task', target: { tab: 'home' } })).toEqual({
      kind: 'tab',
      tab: 'home',
    });
    expect(resolveNotificationRoute({ family: 'daily', target: { tab: 'home' } })).toEqual({
      kind: 'tab',
      tab: 'home',
    });
  });

  it('extra inválido não navega', () => {
    expect(resolveNotificationRoute(undefined)).toBeNull();
    expect(resolveNotificationRoute(null)).toBeNull();
    expect(resolveNotificationRoute('x')).toBeNull();
    expect(resolveNotificationRoute({})).toBeNull();
    expect(resolveNotificationRoute({ family: 'thesis', target: { tab: 'home' } })).toBeNull();
  });
});
