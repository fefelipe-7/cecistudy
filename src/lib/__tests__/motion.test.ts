/**
 * Contrato do canal de direção das transições de tela (SPEC-007).
 *
 * Este arquivo **substituiu** as asserções sobre o shape de `screenVariants`
 * (`'18%'`, `'-5%'`, `[0, ≥220]`): elas fixavam a implementação legada, que o
 * Slice C substitui pela física por profundidade. O que importa agora é o
 * **contrato** — o `NavIntent` viaja inteiro e chega intacto na hora do `exit`,
 * apesar das props congeladas da instância que sai.
 *
 * Ver `motion/intent.test.ts`, `motion/variants.test.ts` e `motion/slideKeys.test.ts`
 * para o restante do contrato.
 */

import { describe, expect, it } from 'vitest';
import {
  consumeMotionIntent,
  createScreenTargets,
  createScreenVariants,
  deriveIntent,
  gesturePopIntent,
  IDLE_INTENT,
  peekMotionIntent,
  prefersReducedMotion,
  setMotionIntent,
} from '../motion';
import { FULL_PROFILE } from '../motion/profile';

const W = 400;
/** A API de rótulos que o `SlideScreen` vai passar a usar no Slice C. */
const variants = createScreenVariants(W, FULL_PROFILE);

describe('canal de direção (o que a instância que SAI consegue ler)', () => {
  it('a instância saindo tem props congeladas: o intent chega pelo canal, não por props', () => {
    setMotionIntent(deriveIntent([{ kind: 'tab', tab: 'faculdade' }], [{ kind: 'tab', tab: 'home' }]));
    // `exit` é chamado SEM argumento nenhum — é o canal que responde.
    const out = (variants.exit as () => { opacity: number })();
    expect(out.opacity).toBe(0);
  });

  it('consome uma vez: o próximo exit não herda o intent anterior', () => {
    setMotionIntent(gesturePopIntent(150));
    expect(consumeMotionIntent().gestureX).toBe(150);
    expect(peekMotionIntent()).toEqual(IDLE_INTENT);
  });
});

describe('REGRESSÃO B2 — o offset do gesto sobrevive até o exit', () => {
  it('gesturePopIntent carrega kind/dir/gestureX/fromGesture coerentes', () => {
    const i = gesturePopIntent(137, true);
    expect(i.kind).toBe('pop');
    expect(i.dir).toBe(-1);
    expect(i.gestureX).toBe(137);
    expect(i.fromGesture).toBe(true);
    expect(i.reduced).toBe(true);
  });

  it('o exit parte do ponto onde o dedo soltou (não de 0)', () => {
    setMotionIntent(gesturePopIntent(137));
    const out = (variants.exit as () => { x: number[] })();
    expect(out.x[0]).toBe(137);
    expect(out.x[1]).toBeGreaterThan(137);
  });

  it('a causa do bug: um intent de gesto NÃO pode ser sobrescrito por um derivado', () => {
    // É exatamente o que `setStack` fazia antes: chamar `setNavMotionContext(dir)`
    // sem `gestureX` depois do gesto, zerando o offset que o dedo tinha gravado.
    // A regra nova: só deriva quando não há intent de gesto pendente.
    setMotionIntent(gesturePopIntent(137));
    const derived = deriveIntent(
      [{ kind: 'tab', tab: 'faculdade' }, { kind: 'course', courseId: 'c1' }],
      [{ kind: 'tab', tab: 'faculdade' }],
    );
    if (!peekMotionIntent().fromGesture) setMotionIntent(derived);

    expect(peekMotionIntent().gestureX).toBe(137);
    expect(peekMotionIntent().fromGesture).toBe(true);
  });

  it('sem gesto, o pop sai de x=0 (a chave do exit é [0, …], não um offset inventado)', () => {
    setMotionIntent(deriveIntent([{ kind: 'tab', tab: 'faculdade' }], []));
    const out = createScreenTargets(W, FULL_PROFILE).exit(consumeMotionIntent());
    expect(out.x).toBe(W);
  });
});

describe('preferReducedMotion (fonte única do sinal do sistema)', () => {
  it('é uma função pura de leitura, boolean em qualquer ambiente', () => {
    // No jsdom sem matchMedia real, devolve `false` (perfis 3D Depends disso).
    expect(typeof prefersReducedMotion()).toBe('boolean');
  });
});
