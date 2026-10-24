/**
 * SPEC-015 — o pager de abas é uma regra com um dono só.
 *
 * A **decisão** de gesto (quando o arrasto vira troca, o que ignora o gesto, a
 * precedência da borda de voltar) é pura e tem teste em `lib/__tests__/swipe.test.ts`.
 * Aqui o que se garante é a **casca**: que o arrasto troca a aba na direção certa,
 * respeita o limite da lista, entende flick rápido e não troca quando o gesto não
 * chegou lá.
 *
 * Sem estes testes, cada tela podia passar a trocar de aba ao contrário no arrasto
 * para trás sem ninguém perceber — o gesto é invisível no teste de render comum.
 */
import React from 'react';
import { describe, expect, it } from 'vitest';
import { act, render, renderHook, screen } from '@testing-library/react';
import { SwipeableTabPanel, useTabPager } from '../SwipeableTabPanel';

const TABS = ['disciplinas', 'calendario', 'estagio'] as const;
type Tab = (typeof TABS)[number];

/**
 * Harness do hook: é o que as telas fazem de verdade — a aba é estado **deles**,
 * e o pager recebe por prop. Então o `active` precisa ser controlado aqui, senão
 * o arrasto troque duas vezes a partir do mesmo id.
 */
function montarPager(initial: Tab) {
  const seen: Tab[] = [];
  const view = renderHook(
    ({ active }: { active: Tab }) => {
      const [tab, setTab] = React.useState(active);
      const pager = useTabPager<Tab>({
        tabIds: TABS,
        active: tab,
        onChange: (id) => {
          seen.push(id);
          setTab(id);
        },
      });
      return pager;
    },
    { initialProps: { active: initial } },
  );
  return { result: view.result, seen };
}

/**
 * Chama o fim do arrasto com offset e velocidade dados.
 *
 * Dentro de `act`: o gesto troca a aba **e** o dono dela re-renderiza. Sem o
 * act, o segundo arrasto do mesmo teste leria a aba antiga e contaria como
 * "voltou" quando na verdade nem partiu do lugar.
 */
const arrasta = (
  result: { current: ReturnType<typeof useTabPager<Tab>> },
  offsetX: number,
  velocityX = 0,
) =>
  act(() => {
    result.current.onDragEnd(null, {
      offset: { x: offsetX },
      velocity: { x: velocityX },
    });
  });

describe('useTabPager — o arrasto troca de aba (SPEC-015)', () => {
  it('arrastar para a esquerda avança, para a direita volta', () => {
    const { result, seen } = montarPager('disciplinas');

    arrasta(result, -120);
    expect(seen.at(-1)).toBe('calendario');

    arrasta(result, 120);
    expect(seen.at(-1)).toBe('disciplinas');
  });

  it('no limite da lista o arrasto não troca nem quebra', () => {
    const { result, seen } = montarPager('estagio');

    arrasta(result, -120); // já na última aba: nada acontece
    expect(seen).toHaveLength(0);

    arrasta(result, 120);
    expect(seen.at(-1)).toBe('calendario');
  });

  it('flick rápido troca mesmo com pouco deslocamento', () => {
    const { result, seen } = montarPager('disciplinas');

    arrasta(result, -30, -900);
    expect(seen.at(-1)).toBe('calendario');
  });

  it('arrasto curto demais não troca', () => {
    const { result, seen } = montarPager('disciplinas');

    arrasta(result, -20);
    expect(seen).toHaveLength(0);
  });

  it('goTo move na direção do destino, não da ordem alfabética', () => {
    const { result, seen } = montarPager('calendario');

    act(() => {
      result.current.goTo('estagio');
    });
    expect(seen.at(-1)).toBe('estagio');
    expect(result.current.direction).toBe(1);

    act(() => {
      result.current.goTo('disciplinas');
    });
    expect(result.current.direction).toBe(-1);
  });

  it('goTo para a aba atual não é troca nem direção nova', () => {
    const { result, seen } = montarPager('calendario');

    result.current.goTo('calendario');
    expect(seen).toHaveLength(0);
  });
});

describe('SwipeableTabPanel — a casca (SPEC-015)', () => {
  const Painel: React.FC<{ tab: Tab }> = ({ tab }) => {
    const pager = useTabPager<Tab>({ tabIds: TABS, active: tab, onChange: () => {} });
    return (
      <SwipeableTabPanel active={tab} pager={pager} label={tab}>
        <p>painel de {tab}</p>
      </SwipeableTabPanel>
    );
  };

  it('expõe a região como tabpanel, com o nome legível da aba', () => {
    render(<Painel tab="calendario" />);
    const painel = screen.getByRole('tabpanel');
    expect(painel.getAttribute('aria-label')).toBe('aba calendario');
  });

  it('o scroll vertical continua liberado (touchAction pan-y)', () => {
    render(<Painel tab="disciplinas" />);
    // O wrapper do gesto é o pai do tabpanel; sem `pan-y` a página trava.
    const wrapper = screen.getByRole('tabpanel').parentElement;
    expect(wrapper?.style.touchAction).toBe('pan-y');
  });

  it('com uma aba só o gesto não engaja — não há para onde ir', () => {
    const { result } = renderHook(() =>
      useTabPager<'unica'>({ tabIds: ['unica'] as const, active: 'unica', onChange: () => {} }),
    );
    expect(result.current.enabled).toBe(false);
  });
});
