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
});