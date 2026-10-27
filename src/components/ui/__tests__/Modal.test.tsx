import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { Modal } from '../Modal';
import { resetOverlayStackForTests } from '@/lib/overlayStack';
import { resetMorphForTests } from '@/lib/motion';

beforeEach(() => {
  resetOverlayStackForTests();
  resetMorphForTests();
});

afterEach(() => {
  cleanup();
  resetOverlayStackForTests();
  resetMorphForTests();
});

describe('Modal', () => {
  it('não renderiza quando fechado', () => {
    render(
      <Modal open={false} onClose={() => {}}>
        <p>conteúdo do modal</p>
      </Modal>,
    );
    expect(screen.queryByText('conteúdo do modal')).not.toBeInTheDocument();
  });

  it('fecha com Escape', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        <p>conteúdo</p>
      </Modal>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fecha ao clicar no backdrop quando closeOnBackdrop', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        <p>conteúdo</p>
      </Modal>,
    );
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('não fecha ao clicar no painel (stopPropagation)', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        <p>conteúdo</p>
      </Modal>,
    );
    const panel = screen.getByText('conteúdo').closest('.relative');
    fireEvent.click(panel!);
    expect(onClose).not.toHaveBeenCalled();
  });

  it('replica labelledBy em aria-labelledby no diálogo', () => {
    render(
      <Modal open onClose={() => {}} labelledBy="titulo-modal">
        <h2 id="titulo-modal">título</h2>
        <p>conteúdo</p>
      </Modal>,
    );
    expect(screen.getByRole('dialog')).toHaveAttribute('aria-labelledby', 'titulo-modal');
  });

  it('move o foco para o painel ao abrir e devolve ao disparador ao fechar', () => {
    const { rerender } = render(
      <>
        <button>abrir modal</button>
        <Modal open={false} onClose={() => {}}>
          <button>dentro</button>
        </Modal>
      </>,
    );
    const trigger = screen.getByText('abrir modal');
    trigger.focus();
    expect(document.activeElement).toBe(trigger);

    rerender(
      <>
        <button>abrir modal</button>
        <Modal open onClose={() => {}}>
          <button>dentro</button>
        </Modal>
      </>,
    );
    const panel = screen.getByRole('dialog').querySelector('.relative') as HTMLElement;
    expect(document.activeElement).toBe(panel);

    rerender(
      <>
        <button>abrir modal</button>
        <Modal open={false} onClose={() => {}}>
          <button>dentro</button>
        </Modal>
      </>,
    );
    expect(document.activeElement).toBe(trigger);
  });

  it('focus trap: Tab cicla dentro do painel sem escapar', () => {
    render(
      <Modal open onClose={() => {}}>
        <div>
          <button>primeiro</button>
          <button>último</button>
        </div>
      </Modal>,
    );
    const first = screen.getByText('primeiro');
    const last = screen.getByText('último');

    last.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: false });
    expect(document.activeElement).toBe(first);

    first.focus();
    fireEvent.keyDown(document, { key: 'Tab', shiftKey: true });
    expect(document.activeElement).toBe(last);
  });

  // SPEC-M-027 D8 · I5
  it('trava o scroll do documento enquanto aberto e devolve ao fechar', () => {
    const { rerender } = render(
      <Modal open={false} onClose={() => {}}>
        <p>conteúdo</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('');

    rerender(
      <Modal open onClose={() => {}}>
        <p>conteúdo</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('hidden');

    rerender(
      <Modal open={false} onClose={() => {}}>
        <p>conteúdo</p>
      </Modal>,
    );
    expect(document.body.style.overflow).toBe('');
  });

  // SPEC-M-027 D8 · I5 — dois abertos: fechar um não pode destravar o outro.
  it('mantém o scroll travado enquanto houver qualquer overlay aberto', () => {
    const Dois = ({ primeiro, segundo }: { primeiro: boolean; segundo: boolean }) => (
      <>
        <Modal open={primeiro} onClose={() => {}}>
          <p>um</p>
        </Modal>
        <Modal open={segundo} onClose={() => {}}>
          <p>dois</p>
        </Modal>
      </>
    );
    const { rerender } = render(<Dois primeiro segundo />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<Dois primeiro={false} segundo />);
    expect(document.body.style.overflow).toBe('hidden');

    rerender(<Dois primeiro={false} segundo={false} />);
    expect(document.body.style.overflow).toBe('');
  });

  // SPEC-M-027 D8 · I5 — a trava não reposiciona o documento.
  it('não chama window.scrollTo ao travar nem ao destravar', () => {
    const scrollTo = vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
    const { rerender } = render(
      <Modal open onClose={() => {}}>
        <p>conteúdo</p>
      </Modal>,
    );
    rerender(
      <Modal open={false} onClose={() => {}}>
        <p>conteúdo</p>
      </Modal>,
    );
    expect(scrollTo).not.toHaveBeenCalled();
    scrollTo.mockRestore();
  });

  // SPEC-M-027 D8 · I6 — antes cada Modal escutava o próprio Esc e os dois fechavam.
  it('Esc fecha só o overlay do topo', () => {
    const fecharPrimeiro = vi.fn();
    const fecharSegundo = vi.fn();
    render(
      <>
        <Modal open onClose={fecharPrimeiro}>
          <p>um</p>
        </Modal>
        <Modal open onClose={fecharSegundo}>
          <p>dois</p>
        </Modal>
      </>,
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(fecharSegundo).toHaveBeenCalledTimes(1);
    expect(fecharPrimeiro).not.toHaveBeenCalled();
  });

  // SPEC-M-027 D8 — `inert` no conteúdo de trás (o portal fica fora do `#root`).
  it('aplica inert no conteúdo de trás e devolve ao fechar', () => {
    const root = document.createElement('div');
    root.id = 'root';
    document.body.appendChild(root);

    const { rerender } = render(
      <Modal open={false} onClose={() => {}}>
        <p>conteúdo</p>
      </Modal>,
    );
    expect(root.hasAttribute('inert')).toBe(false);

    rerender(
      <Modal open onClose={() => {}}>
        <p>conteúdo</p>
      </Modal>,
    );
    expect(root.hasAttribute('inert')).toBe(true);

    rerender(
      <Modal open={false} onClose={() => {}}>
        <p>conteúdo</p>
      </Modal>,
    );
    expect(root.hasAttribute('inert')).toBe(false);

    root.remove();
  });

  // SPEC-M-027 D7/D8 — o overlay que fecha fica montado ~0.18 s para animar a
  // saída; nesse intervalo ele não pode ser focalizável.
  it('marca o overlay como inert enquanto ele sai', () => {
    const { rerender } = render(
      <Modal open onClose={() => {}}>
        <p>conteúdo</p>
      </Modal>,
    );
    expect(document.querySelector('[role="dialog"]')).not.toHaveAttribute('inert');

    rerender(
      <Modal open={false} onClose={() => {}}>
        <p>conteúdo</p>
      </Modal>,
    );

    // `aria-hidden` tira o diálogo da árvore de acessibilidade: busca por atributo.
    const saindo = document.querySelector('[role="dialog"]');
    expect(saindo).not.toBeNull();
    expect(saindo).toHaveAttribute('inert');
    expect(saindo).toHaveAttribute('aria-hidden', 'true');
  });

  it('morphId: o painel vira o alvo do clone e não roda a entrada do sheet (I19)', () => {
    render(
      <Modal open onClose={() => {}} morphId="chapter-card-ch1" position="bottom">
        <p>conteúdo</p>
      </Modal>,
    );
    const painel = document.querySelector('[data-morph-target="chapter-card-ch1"]');
    expect(painel).not.toBeNull();
    // É o próprio painel (o que recebe foco), não um wrapper novo.
    expect(painel).toHaveAttribute('tabindex', '-1');
    // Sem `initial="initial"` do `sheetVariants`: quem entra é o clone, e o
    // painel já nasce na posição final.
    expect(painel?.getAttribute('style') ?? '').not.toContain('translateY');
  });
});
