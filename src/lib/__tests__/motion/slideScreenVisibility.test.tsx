/**
 * Regressão do bug "troco de aba e só o fundo aparece" (SPEC-007 §5.3).
 *
 * Este é o teste que **pega o bug de verdade**, no nível do DOM — os testes de
 * `variants.ts` conferem os alvos, mas quem quebra a tela é o par
 * `initial`/`animate` aplicado pelo `AnimatePresence`.
 *
 * ## Anatomia do defeito
 *
 * `enter` de `tab`/`replace` nasce em `opacity: 0` (é o crossfade). O alvo
 * `animate` é `front`. O `framer-motion` escreve no DOM **só as chaves presentes
 * no alvo**, então um `front` sem `opacity` **não anima de volta**: o `0` do
 * `initial` fica lá para sempre. O elemento está montado, com filhos reais e
 * conteúdo real — mas transparente. Aparece só o fundo do app.
 *
 * ## Por que o boot não denuncia
 *
 * `AnimatePresence initial={false}` bloqueia o `initial` **na primeira montagem**
 * (`isInitialRender.current === true`), então o Home monta direto no alvo
 * `animate`, nunca passa pelo 0, e fica visível. O defeito só aparece a partir
 * da **segunda** navegação, quando `initial` passa a valer.
 *
 * ## Por que relógio real, e não fake timers
 *
 * O `framer-motion` conduz a animação por `requestAnimationFrame`. Com
 * `vi.useFakeTimers()` o loop congela no meio do caminho e o `opacity` fica
 * preso num valor fracionário (ex.: `0.0065`) — o teste passaria por acidente no
 * caminho certo e falharia por motivo errado no caminho quebrado. Aqui o teste
 * **espera a animação terminar de verdade**.
 */

import { cleanup, render, screen } from '@testing-library/react';
import { AnimatePresence } from 'framer-motion';
import { afterEach, describe, expect, it } from 'vitest';
import { MotionProfileProvider } from '../../../components/motion/MotionProfileProvider';
import { SlideScreen } from '../../../shells/SlideScreen';
import { IDLE_INTENT, type NavIntent } from '../../motion/intent';

/** Duração máxima de qualquer transição de tela (SPEC-007 §5.1: ≤ 0.26 s). */
const SETTLE_MS = 600;

const intent = (over: Partial<NavIntent> = {}): NavIntent => ({
  ...IDLE_INTENT,
  kind: 'push',
  dir: 1,
  ...over,
});

/**
 * Reproduz a topologia real de `MobileAppShell`: `AnimatePresence` com
 * `initial={false}`, `custom={navIntent}` e **um `key` por camada de slide**
 * (`tab-home-0` → `tab-faculdade-1`), trocado a cada navegação.
 */
const SlideLayer = ({ tabKey, navIntent }: { tabKey: string; navIntent: NavIntent }) => (
  <MotionProfileProvider override={false}>
    <AnimatePresence initial={false} custom={navIntent}>
      <SlideScreen key={tabKey} intent={navIntent}>
        <p>tela de {tabKey}</p>
      </SlideScreen>
    </AnimatePresence>
  </MotionProfileProvider>
);

const settle = () => new Promise((resolve) => setTimeout(resolve, SETTLE_MS));

/**
 * Opacidade efetivamente acumulada no DOM até o texto.
 *
 * Sobe do texto até a raiz e multiplica. Precisa ser a cadeia **inteira**, não
 * só o pai: o `motion.div` do `SlideScreen` é um ancestral, e é nele que o
 * `opacity` do crossfade é escrito — medir só o pai daria sempre 1 e o teste
 * passaria mesmo com o bug.
 */
const visibleOpacityOf = (text: string): number => {
  let el: HTMLElement | null = screen.getByText(text);
  let acc = 1;
  while (el && el !== document.body) {
    acc *= Number(getComputedStyle(el).opacity || '1');
    el = el.parentElement;
  }
  return acc;
};

afterEach(() => {
  cleanup();
});

describe('a tela que entra fica visível depois de trocar de aba', () => {
  it('a primeira tela (boot) monta visível', async () => {
    render(<SlideLayer tabKey="tab-home-0" navIntent={intent({ kind: 'none', dir: 0 })} />);
    await settle();

    expect(screen.getByText('tela de tab-home-0')).toBeInTheDocument();
    expect(visibleOpacityOf('tela de tab-home-0')).toBe(1);
  });

  it('trocar de aba entrega a nova tela com opacity 1, não com o 0 do crossfade', async () => {
    const { rerender } = render(
      <SlideLayer tabKey="tab-home-0" navIntent={intent({ kind: 'none', dir: 0 })} />,
    );
    await settle();

    // Troca de aba: novo `key`, novo `NavIntent` com kind `tab`.
    rerender(<SlideLayer tabKey="tab-faculdade-1" navIntent={intent({ kind: 'tab', dir: 0 })} />);
    await settle();

    // O conteúdo está montado...
    expect(screen.getByText('tela de tab-faculdade-1')).toBeInTheDocument();
    // ...e **visível**. Com `front` sem `opacity`, isto daria 0 e o teste falharia.
    expect(visibleOpacityOf('tela de tab-faculdade-1')).toBe(1);
  });

  it('vale para `replace` também (não só `tab`)', async () => {
    const { rerender } = render(
      <SlideLayer tabKey="tab-home-0" navIntent={intent({ kind: 'none', dir: 0 })} />,
    );
    await settle();

    rerender(<SlideLayer tabKey="tab-estudos-1" navIntent={intent({ kind: 'replace', dir: 0 })} />);
    await settle();

    expect(visibleOpacityOf('tela de tab-estudos-1')).toBe(1);
  });

  it('e para uma segunda troca de aba seguida (o defeito não se auto-cura)', async () => {
    const { rerender } = render(
      <SlideLayer tabKey="tab-home-0" navIntent={intent({ kind: 'none', dir: 0 })} />,
    );
    await settle();

    rerender(<SlideLayer tabKey="tab-faculdade-1" navIntent={intent({ kind: 'tab', dir: 0 })} />);
    await settle();

    rerender(<SlideLayer tabKey="tab-biblioteca-2" navIntent={intent({ kind: 'tab', dir: 0 })} />);
    await settle();

    expect(visibleOpacityOf('tela de tab-biblioteca-2')).toBe(1);
  });

  it('perfil de movimento reduzido também entrega opacity 1', async () => {
    const { rerender } = render(
      <MotionProfileProvider override={true}>
        <AnimatePresence initial={false} custom={intent({ kind: 'none', dir: 0 })}>
          <SlideScreen key="tab-home-0" intent={intent({ kind: 'none', dir: 0 })}>
            <p>tela reduzida</p>
          </SlideScreen>
        </AnimatePresence>
      </MotionProfileProvider>,
    );
    await settle();

    rerender(
      <MotionProfileProvider override={true}>
        <AnimatePresence initial={false} custom={intent({ kind: 'tab', dir: 0 })}>
          <SlideScreen key="tab-faculdade-1" intent={intent({ kind: 'tab', dir: 0 })}>
            <p>tela reduzida nova</p>
          </SlideScreen>
        </AnimatePresence>
      </MotionProfileProvider>,
    );
    await settle();

    expect(visibleOpacityOf('tela reduzida nova')).toBe(1);
  });
});