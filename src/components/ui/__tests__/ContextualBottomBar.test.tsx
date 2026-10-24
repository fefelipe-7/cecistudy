import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { ContextualBottomBar } from '../ContextualBottomBar';
import { MotionProfileProvider } from '@/components/motion/MotionProfileProvider';
import type { ContextBarAction, ContextBarConfig } from '@/lib/contextBarConfig';

vi.mock('../../../lib/haptics', () => ({
  hapticTap: vi.fn(),
  hapticSuccess: vi.fn(),
  hapticWarning: vi.fn(),
}));

const acao = (
  id: string,
  label: string,
  onSelect: () => void,
  Icon: React.ComponentType<{ className?: string }> = () => null,
): ContextBarAction => ({
  id,
  label,
  ariaLabel: label,
  Icon,
  onSelect,
});

const config = (primary: ContextBarAction[], contextKey = 'notes'): ContextBarConfig => ({
  contextKey,
  primaryActions: primary,
});

const renderBar = (cfg: ContextBarConfig | null, onBack = vi.fn(), reduced = false) =>
  render(
    <MotionProfileProvider override={reduced}>
      <ContextualBottomBar config={cfg} onBack={onBack} />
    </MotionProfileProvider>,
  );

const bar = () => screen.getByTestId('contextual-bar');
const primary = () => screen.getByTestId('contextual-bar-primary');
const back = () => screen.getByTestId('contextual-bar-back');
const ACTIONS = (re: RegExp) => screen.getAllByRole('button', { name: re });

const SLEEP = (ms: number) =>
  act(async () => {
    await new Promise((resolve) => setTimeout(resolve, ms));
  });

beforeEach(() => {
  vi.useRealTimers();
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('ContextualBottomBar', () => {
  it('sem config não renderiza nada (tela primária)', () => {
    renderBar(null);
    expect(screen.queryByTestId('contextual-bar')).toBeNull();
  });

  it('o botão principal executa a ação contextual', () => {
    const run = vi.fn();
    renderBar(config([acao('nova-nota', 'nova nota', run)]));
    fireEvent.click(primary());
    expect(run).toHaveBeenCalledTimes(1);
  });

  it('a barra de voltar sempre navega (curto = navegação real)', () => {
    const onBack = vi.fn();
    renderBar(config([acao('nova-nota', 'nova nota', vi.fn())]), onBack);
    fireEvent.click(back());
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('com múltiplas ações principais, a setinha expande para cima e mostra as outras', async () => {
    const primeira = vi.fn();
    const segunda = vi.fn();
    renderBar(config([acao('a', 'anotar aula', primeira), acao('b', 'nova prova', segunda)]));

    expect(primary()).toHaveTextContent('anotar aula');

    // clicar na setinha de expansão
    const expandir = screen.getAllByRole('button', {
      name: /ver outras ações principais/,
    })[0];
    act(() => {
      fireEvent.click(expandir);
    });

    // a segunda ação aparece na expansão (aguarda animação de entrada)
    const segundaAcao = await screen.findByRole('button', { name: /nova prova/ });
    fireEvent.click(segundaAcao);
    expect(segunda).toHaveBeenCalledTimes(1);
    expect(primeira).not.toHaveBeenCalled();
  });

  it('cliques repetidos não duplicam uma operação assíncrona em andamento', async () => {
    let resolve!: () => void;
    const run = vi.fn(
      () =>
        new Promise<void>((r) => {
          resolve = r;
        }),
    );
    renderBar(config([acao('a', 'buscar', run)]));
    fireEvent.click(primary());
    fireEvent.click(primary());
    fireEvent.click(primary());
    expect(run).toHaveBeenCalledTimes(1);
    await act(async () => {
      resolve();
    });
    fireEvent.click(primary());
    expect(run).toHaveBeenCalledTimes(2);
  });

  it('ação que recusa volta ao normal (sem aparência de sucesso)', async () => {
    const run = vi.fn(() => Promise.reject(new Error('cancelado')));
    renderBar(config([acao('a', 'buscar', run)]));
    await act(async () => {
      fireEvent.click(primary());
    });
    expect(primary()).toHaveAttribute('aria-busy', 'false');
    expect(primary()).not.toBeDisabled();
  });

  it('funciona sob movimento reduzido (mesmo estado, sem interpolação)', () => {
    renderBar(config([acao('a', 'buscar', vi.fn())]), vi.fn(), true);
    expect(primary()).toHaveTextContent('buscar');
    expect(back()).toHaveTextContent('voltar');
    fireEvent.click(back());
    expect(screen.getByTestId('contextual-bar-back')).toBeInTheDocument();
  });

  it('troca de contexto reinicia a ação principal', () => {
    const { rerender } = renderBar(
      config([acao('a', 'anotar aula', vi.fn()), acao('b', 'nova prova', vi.fn())]),
      vi.fn(),
    );
    expect(primary()).toHaveTextContent('anotar aula');

    rerender(
      <MotionProfileProvider override={false}>
        <ContextualBottomBar
          config={config([acao('c', 'buscar', vi.fn())], 'streak')}
          onBack={vi.fn()}
        />
      </MotionProfileProvider>,
    );
    expect(primary()).toHaveTextContent('buscar');
  });
});

/**
 * SPEC-022 D4/D5/D6 — o comportamento da peça.
 */
describe('ContextualBottomBar — fade, inércia e forma (SPEC-022)', () => {
  /** Move a rolagem da janela e dispara o evento que o app escuta. */
  const scrollTo = async (value: number) => {
    Object.defineProperty(window, 'scrollY', { value, configurable: true, writable: true });
    await act(async () => {
      window.dispatchEvent(new Event('scroll'));
      await new Promise((resolve) => setTimeout(resolve, 40));
    });
  };

  beforeEach(() => {
    Object.defineProperty(window, 'scrollY', { value: 0, configurable: true, writable: true });
  });

  it('some ao rolar para baixo e volta ao rolar para cima', async () => {
    renderBar(config([acao('nova-nota', 'nova nota', vi.fn())]));
    expect(bar()).not.toHaveAttribute('inert');

    await scrollTo(500);
    expect(bar()).toHaveAttribute('inert');

    await scrollTo(200);
    expect(bar()).not.toHaveAttribute('inert');
  });

  it('a barra invisível não recebe toque e não é anunciada', async () => {
    renderBar(config([acao('nova-nota', 'nova nota', vi.fn())]));
    await scrollTo(500);
    // `inert` tira da árvore de leitura e do foco; `pointer-events-none`
    // tira do hit-test — invisível não é clicável.
    expect(bar()).toHaveAttribute('inert');
    expect(bar().className).toContain('pointer-events-none');
  });

  it('trocar de contexto reabre a barra visível', async () => {
    const { rerender } = renderBar(config([acao('nova-nota', 'nova nota', vi.fn())]));
    await scrollTo(500);
    expect(bar()).toHaveAttribute('inert');

    rerender(
      <MotionProfileProvider override={false}>
        <ContextualBottomBar
          config={config([acao('outra', 'outra ação', vi.fn())], 'streak')}
          onBack={vi.fn()}
        />
      </MotionProfileProvider>,
    );
    expect(bar()).not.toHaveAttribute('inert');
  });

  it('a expansão fecha quando o contexto muda', async () => {
    const { rerender } = renderBar(
      config([acao('a', 'anotar aula', vi.fn()), acao('b', 'nova prova', vi.fn())]),
    );

    act(() => {
      fireEvent.click(screen.getByTestId('contextual-bar-expand'));
    });
    expect(await screen.findByTestId('contextual-bar-expanded')).toBeInTheDocument();

    rerender(
      <MotionProfileProvider override={false}>
        <ContextualBottomBar
          config={config([acao('c', 'buscar', vi.fn()), acao('d', 'outra', vi.fn())], 'streak')}
          onBack={vi.fn()}
        />
      </MotionProfileProvider>,
    );
    // O painel sai com a animação de exit — o que importa é que ele some.
    await waitFor(() => {
      expect(screen.queryByTestId('contextual-bar-expanded')).toBeNull();
    });
  });

  it('a peça da esquerda não aninha botões e a setinha é focável', () => {
    const { container } = renderBar(
      config([acao('a', 'anotar aula', vi.fn()), acao('b', 'nova prova', vi.fn())]),
    );
    // HTML válido: nada de botão dentro de botão.
    expect(container.querySelectorAll('button button').length).toBe(0);
    const expand = screen.getByTestId('contextual-bar-expand');
    expect(expand.tagName).toBe('BUTTON');
    expect(expand).toHaveAttribute('aria-expanded', 'false');
  });

  it('a falha da ação é avisada (quem mostra é a casca)', async () => {
    const onError = vi.fn();
    const run = vi.fn(() => Promise.reject(new Error('cancelado')));
    render(
      <MotionProfileProvider override={false}>
        <ContextualBottomBar
          config={config([acao('a', 'buscar', run)])}
          onBack={vi.fn()}
          onError={onError}
        />
      </MotionProfileProvider>,
    );
    await act(async () => {
      fireEvent.click(primary());
    });
    expect(onError).toHaveBeenCalledTimes(1);
    expect(primary()).toHaveAttribute('aria-busy', 'false');
  });

  it('a barra entra e sai com o envelope da barra de abas (nunca coexistem)', async () => {
    const { rerender } = renderBar(null);
    expect(screen.queryByTestId('contextual-bar-host')).toBeNull();

    rerender(
      <MotionProfileProvider override={false}>
        <ContextualBottomBar config={config([acao('a', 'buscar', vi.fn())])} onBack={vi.fn()} />
      </MotionProfileProvider>,
    );
    expect(screen.getByTestId('contextual-bar-host')).toBeInTheDocument();

    rerender(
      <MotionProfileProvider override={false}>
        <ContextualBottomBar config={null} onBack={vi.fn()} />
      </MotionProfileProvider>,
    );
    // A saída é animada: o host sai do DOM quando o envelope termina.
    await waitFor(() => {
      expect(screen.queryByTestId('contextual-bar-host')).toBeNull();
    });
  });

  it('o teclado virtual levanta a barra em vez de cobrir o campo', async () => {
    const listeners: Record<string, () => void> = {};
    const vv = {
      height: 800,
      offsetTop: 0,
      addEventListener: (event: string, fn: () => void) => {
        listeners[event] = fn;
      },
      removeEventListener: (event: string) => {
        delete listeners[event];
      },
    };
    Object.defineProperty(window, 'visualViewport', { value: vv, configurable: true });
    Object.defineProperty(window, 'innerHeight', { value: 800, configurable: true });

    renderBar(config([acao('a', 'buscar', vi.fn())]));
    expect(screen.getByTestId('contextual-bar-host').style.bottom).toBe('');

    // O teclado toma 300 px da janela: a barra sobe 300 px.
    vv.height = 500;
    await act(async () => {
      listeners.resize?.();
    });
    expect(screen.getByTestId('contextual-bar-host').style.bottom).toContain('300px');
  });
});
