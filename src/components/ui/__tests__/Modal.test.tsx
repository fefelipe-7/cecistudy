import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from '../Modal';

describe('Modal', () => {
  it('renderiza o conteúdo quando aberto', () => {
    render(
      <Modal open onClose={() => {}}>
        <p>conteúdo do modal</p>
      </Modal>
    );
    expect(screen.getByText('conteúdo do modal')).toBeInTheDocument();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('não renderiza quando fechado', () => {
    render(
      <Modal open={false} onClose={() => {}}>
        <p>conteúdo do modal</p>
      </Modal>
    );
    expect(screen.queryByText('conteúdo do modal')).not.toBeInTheDocument();
  });

  it('fecha com Escape', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        <p>conteúdo</p>
      </Modal>
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('fecha ao clicar no backdrop quando closeOnBackdrop', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        <p>conteúdo</p>
      </Modal>
    );
    fireEvent.click(screen.getByRole('dialog'));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('não fecha ao clicar no painel (stopPropagation)', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        <p>conteúdo</p>
      </Modal>
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
      </Modal>
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
      </>
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
      </>
    );
    const panel = screen.getByRole('dialog').querySelector('.relative') as HTMLElement;
    expect(document.activeElement).toBe(panel);

    rerender(
      <>
        <button>abrir modal</button>
        <Modal open={false} onClose={() => {}}>
          <button>dentro</button>
        </Modal>
      </>
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
      </Modal>
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
});