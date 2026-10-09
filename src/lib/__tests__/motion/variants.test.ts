/**
 * Fábrica de variantes de tela (SPEC-007 §5.3).
 *
 * Cobre a regra que resolve o problema difícil: **a direção de saída é a mesma
 * `dir` da entrada, com o sinal trocado.** E o fato de que um push **não pode
 * fazer fade** (`opacity: 1` explícito nos alvos de push/pop).
 */

import { describe, expect, it } from 'vitest';
import { createScreenTargets, createScreenVariants, SHADE_OPACITY } from '../../motion/variants';
import { FULL_PROFILE, REDUCED_PROFILE } from '../../motion/profile';
import { PARALLAX } from '../../motion/tokens';
import { IDLE_INTENT, type NavIntent } from '../../motion/intent';
import { consumeMotionIntent, setMotionIntent } from '../../motion/intent';

const W = 400;

const intent = (over: Partial<NavIntent> = {}): NavIntent => ({
  ...IDLE_INTENT,
  kind: 'push',
  dir: 1,
  ...over,
});

const t = createScreenTargets(W, FULL_PROFILE);

describe('posicao de repouso (funcao da profundidade — §D3)', () => {
  it('front: x = 0', () => {
    expect(t.front.x).toBe(0);
  });

  it('behind(1) = -PARALLAX * width (parallax de uma camada coberta)', () => {
    expect(t.behind(1).x).toBeCloseTo(-PARALLAX * W, 5);
  });

  it('behind(2) = o dobro — pilha de 3 sem caso especial', () => {
    expect(t.behind(2).x).toBeCloseTo(-2 * PARALLAX * W, 5);
  });

  it('behind(0) = front (coerência)', () => {
    expect(t.behind(0).x).toBe(t.front.x);
  });
});

describe('direcao de entrada e saida sao o MESMO dir, com sinal trocado (§D2)', () => {
  it('push: entra de +W', () => {
    expect(t.enter(intent({ kind: 'push', dir: 1 })).x).toBe(W);
  });

  it('push: a tela coberta sai para -W', () => {
    expect(t.exit(intent({ kind: 'push', dir: 1 })).x).toBe(-W);
  });

  it('pop: a tela revelada entra de -W', () => {
    expect(t.enter(intent({ kind: 'pop', dir: -1 })).x).toBe(-W);
  });

  it('pop: a tela do topo sai para +W', () => {
    expect(t.exit(intent({ kind: 'pop', dir: -1 })).x).toBe(W);
  });

  it('a soma entering + exiting é sempre 0 (saída é o espelho exato)', () => {
    for (const dir of [1, -1] as const) {
      const i = intent({ dir, kind: dir === 1 ? 'push' : 'pop' });
      expect(t.enter(i).x).toBe(-(t.exit(i).x as number));
    }
  });
});

describe('push NAO faz fade (o maior sinal de "web app fingindo ser nativo")', () => {
  it('enter de push e pop tem opacity 1 explícito', () => {
    expect(t.enter(intent({ kind: 'push', dir: 1 })).opacity).toBe(1);
    expect(t.enter(intent({ kind: 'pop', dir: -1 })).opacity).toBe(1);
  });

  it('exit de push tem opacity 1 (a tela sendo coberta nao desvanece)', () => {
    expect(t.exit(intent({ kind: 'push', dir: 1 })).opacity).toBe(1);
  });
});

describe('pop vindo do gesto de borda: continuidade (bug B2)', () => {
  it('parte do ponto onde o dedo soltou', () => {
    const i = intent({ kind: 'pop', dir: -1, fromGesture: true, gestureX: 137 });
    const out = t.exit(i) as { x: number[] };
    expect(out.x[0]).toBe(137);
    expect(out.x[1]).toBeGreaterThan(137);
  });

  it('sem gesto, o pop sai de x=0 (não inventa offset)', () => {
    const out = t.exit(intent({ kind: 'pop', dir: -1 })) as { x: number };
    expect(out.x).toBe(W);
  });

  it('o gesto só muda o ponto de partida, nunca a duração', () => {
    const comGesto = t.exit(intent({ kind: 'pop', dir: -1, fromGesture: true, gestureX: 200 }));
    const semGesto = t.exit(intent({ kind: 'pop', dir: -1 }));
    expect(comGesto.transition).toEqual(semGesto.transition);
  });
});

describe('tab / replace: sem slide', () => {
  it('tab e replace entram com fade em x=0', () => {
    for (const kind of ['tab', 'replace'] as const) {
      const out = t.enter(intent({ kind, dir: 0 }));
      expect(out.x).toBe(0);
      expect(out.opacity).toBe(0);
    }
  });

  it('tab e replace saem com fade em x=0', () => {
    for (const kind of ['tab', 'replace'] as const) {
      const out = t.exit(intent({ kind, dir: 0 }));
      expect(out.x).toBe(0);
      expect(out.opacity).toBe(0);
    }
  });

  it('none não move nada (atualização de payload, não navegação)', () => {
    const out = t.enter(intent({ kind: 'none', dir: 0 }));
    expect(out.x).toBe(0);
  });
});

describe('shade (dim sobre a camada coberta)', () => {
  it('sobe no push/pop, desce no tab/replace', () => {
    expect(t.shade(intent({ kind: 'push', dir: 1 })).opacity).toBe(1);
    expect(t.shade(intent({ kind: 'tab', dir: 0 })).opacity).toBe(0);
  });

  it('respeita o orcamento de contraste (WCAG 1.4.3): no maximo 0.14', () => {
    expect(SHADE_OPACITY).toBeLessThanOrEqual(0.14);
  });
});

describe('perfil reduzido: TODO alvo horizontal e 0', () => {
  const r = createScreenTargets(W, REDUCED_PROFILE);

  it('enter de push vira fade puro, sem x e sem parallax', () => {
    const out = r.enter(intent({ kind: 'push', dir: 1 }));
    expect(out.x).toBe(0);
    expect(out.opacity).toBe(1);
  });

  it('exit de pop vira fade puro', () => {
    const out = r.exit(intent({ kind: 'pop', dir: -1 }));
    expect(out.x).toBe(0);
    expect(out.opacity).toBe(0);
  });

  it('behind() e front() coincidem — não há parallax reduzido', () => {
    expect(r.behind(1).x).toBe(0);
    expect(r.behind(2).x).toBe(0);
  });

  it('gesto de borda é ignorado: não há keyframe para gestureX', () => {
    const out = r.exit(intent({ kind: 'pop', dir: -1, fromGesture: true, gestureX: 200 }));
    expect(out.x).toBe(0);
  });

  it('shade nao escurece NADA sob movimento reduzido', () => {
    expect(r.shade(intent({ kind: 'push', dir: 1 })).opacity).toBe(0);
  });
});

describe('createScreenVariants (API de rotulos, para o wrapper declarativo)', () => {
  it('initial = enter, animate = front', () => {
    const v = createScreenVariants(W, FULL_PROFILE);
    expect((v.initial as (i: NavIntent) => { x: number })(intent({ dir: 1 })).x).toBe(W);
    expect((v.animate as (i: NavIntent) => { x: number })(intent({ dir: 1 })).x).toBe(0);
  });

  it('exit lê o intent do canal de módulo (props congeladas nao chegam)', () => {
    const v = createScreenVariants(W, FULL_PROFILE);
    setMotionIntent(intent({ kind: 'pop', dir: -1, fromGesture: true, gestureX: 111 }));
    const out = (v.exit as () => { x: number[] })();
    expect(out.x[0]).toBe(111);
    // consome uma vez: o proximo exit nao herda o offset velho
    consumeMotionIntent();
  });

  // Regressão do bug "troco de aba e a tela fica vazia, só com o fundo do app".
  // O `enter` de `tab`/`replace` nasce em `opacity: 0`; o `animate` precisa declarar
  // `opacity: 1` explicitamente, porque o framer-motion só anima as keys presentes no
  // alvo — omitting-la deixava a camada transparente para sempre.
  it('animate devolve opacity 1 para TODA intenção (senão a tela fica invisível)', () => {
    const v = createScreenVariants(W, FULL_PROFILE);
    const kinds: NavIntent['kind'][] = ['push', 'pop', 'tab', 'replace', 'none'];
    for (const kind of kinds) {
      const animate = (v.animate as (i: NavIntent) => { opacity?: number })(
        intent({ kind, dir: 1 })
      );
      expect(animate.opacity, `animate.kind=${kind}`).toBe(1);
    }
  });

  it('initial só é transparente para tab/replace — push e pop nunca fazem fade', () => {
    const v = createScreenVariants(W, FULL_PROFILE);
    const initial = (i: NavIntent) => (v.initial as (x: NavIntent) => { opacity?: number })(i);
    expect(initial(intent({ kind: 'push', dir: 1 })).opacity).toBe(1);
    expect(initial(intent({ kind: 'pop', dir: -1 })).opacity).toBe(1);
    expect(initial(intent({ kind: 'tab', dir: 0 })).opacity).toBe(0);
    expect(initial(intent({ kind: 'replace', dir: 0 })).opacity).toBe(0);
  });

  it('todo alvo de repouso declara opacity 1 — nenhum devolve a camada ao valor herdado', () => {
    const t = createScreenTargets(W, FULL_PROFILE);
    expect(t.front.opacity).toBe(1);
    for (const depth of [0, 1, 3]) expect(t.behind(depth).opacity).toBe(1);
  });

  it('sob movimento reduzido o animate também é opaco (o perfil reduzido é o caminho que funcionava)', () => {
    const v = createScreenVariants(W, REDUCED_PROFILE);
    for (const kind of ['push', 'pop', 'tab', 'replace'] as NavIntent['kind'][]) {
      expect((v.animate as (i: NavIntent) => { opacity?: number })(intent({ kind, dir: 1 })).opacity).toBe(1);
    }
  });
});
