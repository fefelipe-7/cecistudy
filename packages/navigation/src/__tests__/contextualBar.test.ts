/**
 * Regras da barra contextual (SPEC-M-018 D1/I6).
 *
 * Testa a função **pura**, sem React e sem renderizar: é o que torna a regra
 * verificável por comando (`npm run test -- packages/navigation/src/__tests__/contextualBar.test.ts`)
 * sem depender de jsdom, e é a razão de a regra morar em `packages/navigation`
 * em vez de dentro do componente.
 */

import { describe, expect, it } from 'vitest';

import {
  isBarVisible,
  planContextualBar,
  type BarActionRef,
  type ContextualBarInput,
} from '../contextualBar';

const acao = (id: string, role?: 'primary' | 'secondary'): BarActionRef =>
  role ? { id, role } : { id };

const base = (over: Partial<ContextualBarInput> = {}): ContextualBarInput => ({
  kind: 'course',
  canGoBack: true,
  actions: [acao('nova-anotacao')],
  ...over,
});

describe('planContextualBar — presença (D13)', () => {
  it('não existe em tela de aba: quem mora no rodapé é a pílula', () => {
    const plan = planContextualBar(
      base({ kind: 'tab', actions: [acao('a'), acao('b')] }),
    );
    expect(plan).toEqual({ visible: false, reason: 'aba' });
  });

  it('não existe sem nada para voltar: botão morto é pior que botão ausente', () => {
    const plan = planContextualBar(base({ canGoBack: false }));
    expect(plan).toEqual({ visible: false, reason: 'sem-voltar' });
  });

  it('não existe sem ações declaradas', () => {
    const plan = planContextualBar(base({ actions: [] }));
    expect(plan).toEqual({ visible: false, reason: 'sem-opcoes' });
  });

  it('a tela de aba ganha a precedência mesmo declarando ações', () => {
    // O motivo reportado precisa ser honesto: se devolvesse 'sem-opcoes', o
    // diagnóstico da ausência seria errado.
    const plan = planContextualBar(base({ kind: 'tab', canGoBack: false }));
    expect(plan).toEqual({ visible: false, reason: 'aba' });
  });

  it('existe em tela empilhada com voltar e ao menos uma ação', () => {
    const plan = planContextualBar(base({ kind: 'classNote' }));
    expect(plan.visible).toBe(true);
  });
});

describe('planContextualBar — divisão primária/secundária', () => {
  it('separa por papel, preservando a ordem de declaração', () => {
    const plan = planContextualBar(
      base({
        actions: [
          acao('editar-aula', 'primary'),
          acao('nova-prova', 'secondary'),
          acao('excluir', 'secondary'),
        ],
      }),
    );
    expect(plan.visible && plan.primary).toEqual(['editar-aula']);
    expect(plan.visible && plan.secondary).toEqual(['nova-prova', 'excluir']);
  });

  it('mais de uma primária: a primeira entra como principal, as outras viram secundárias', () => {
    const plan = planContextualBar(
      base({
        actions: [acao('a', 'primary'), acao('b', 'primary'), acao('c', 'secondary')],
      }),
    );
    expect(plan.visible && plan.defaultPrimaryId).toBe('a');
    expect(plan.visible && plan.primary).toEqual(['a', 'b']);
    expect(plan.visible && plan.secondary).toEqual(['c']);
  });

  it('sem primária declarada: não há cápsula, e o `⋯` vira a única via da ação', () => {
    // Estado real hoje enquanto A3 está aberta: toda ação é secundária, então
    // não há o que pôr na cápsula. Esconder o `⋯` aqui deixaria a ação
    // **inalcançável** — o `⋯` não é redundante, é o acesso.
    const plan = planContextualBar(base({ actions: [acao('editar-aula')] }));
    expect(plan.visible && plan.hasCenterCapsule).toBe(false);
    expect(plan.visible && plan.hasOptionsButton).toBe(true);
    expect(plan.visible && plan.defaultPrimaryId).toBe('editar-aula');
  });

  it('sem secundária: o botão de opções não é montado (§5.1, seção vazia)', () => {
    const plan = planContextualBar(base({ actions: [acao('editar-aula', 'primary')] }));
    expect(plan.visible && plan.hasOptionsButton).toBe(false);
    expect(plan.visible && plan.hasCenterCapsule).toBe(true);
  });
});

describe('planContextualBar — invariantes (I6)', () => {
  it('defaultPrimaryId sempre pertence a alguma lista', () => {
    for (const actions of [
      [acao('a')],
      [acao('a', 'primary')],
      [acao('a'), acao('b', 'primary')],
      [acao('a', 'secondary'), acao('b', 'primary'), acao('c', 'secondary')],
    ]) {
      const plan = planContextualBar(base({ actions }));
      if (!isBarVisible(plan)) throw new Error('plano deveria estar visível');
      const known = [...plan.primary, ...plan.secondary];
      expect(known).toContain(plan.defaultPrimaryId);
      // Toda ação declarada chega em exatamente uma lista — nada some.
      expect(known.length).toBe(new Set(known).size);
      expect(known.length).toBe(actions.length);
    }
  });

  it('back é sempre true quando a barra existe (A2 rejeitou o botão condicional)', () => {
    const plan = planContextualBar(base());
    expect(isBarVisible(plan) && plan.back).toBe(true);
  });

  it('hasCenterCapsule e hasOptionsButton derivam das listas, sem estado próprio', () => {
    const plan = planContextualBar(
      base({ actions: [acao('a', 'primary'), acao('b')] }),
    );
    if (!isBarVisible(plan)) throw new Error('plano deveria estar visível');
    expect(plan.hasCenterCapsule).toBe(plan.primary.length > 0);
    expect(plan.hasOptionsButton).toBe(plan.secondary.length > 0);
  });
});

describe('planContextualBar — totalidade', () => {
  it('devolve plano para qualquer combinação, sem lançar', () => {
    const kinds = ['tab', 'course', 'classNote', 'tcc', 'notes'] as const;
    for (const kind of kinds) {
      for (const canGoBack of [true, false]) {
        for (const actions of [[], [acao('a')], [acao('a', 'primary'), acao('b')]]) {
          const plan = planContextualBar({ kind, canGoBack, actions });
          expect(plan).toHaveProperty('visible');
        }
      }
    }
  });

  it('não muta a entrada', () => {
    const actions = [acao('a', 'primary'), acao('b')];
    const snapshot = JSON.stringify(actions);
    planContextualBar(base({ actions }));
    expect(JSON.stringify(actions)).toBe(snapshot);
  });
});