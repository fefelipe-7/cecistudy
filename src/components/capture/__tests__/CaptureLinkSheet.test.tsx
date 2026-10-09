import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MobileAppProvider } from '../../../../apps/mobile/src/MobileAppProvider';
import { useMobileApp } from '../../../context/mobileApp';
import { CaptureLinkSheet } from '../CaptureLinkSheet';

// SPEC-012 §8.2/§8.5 (F8.2): a sheet tem dois controles + botão; a captura é
// **uma escrita por ação** (leitura na estante + referência no TCC juntas).

const Probe = () => {
  const { readings, thesisReferences } = useMobileApp();
  return (
    <>
      <span data-testid="readings">{readings.length}</span>
      <span data-testid="refs">{thesisReferences.length}</span>
    </>
  );
};

const renderSheet = (initialText = '') => {
  const onClose = vi.fn();
  render(
    <MobileAppProvider>
      <CaptureLinkSheet open initialText={initialText} onClose={onClose} />
      <Probe />
    </MobileAppProvider>,
  );
  return { onClose };
};

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('CaptureLinkSheet (SPEC-012 §8.2)', () => {
  it('sem link ainda: mostra o campo e o guardar fica desabilitado', () => {
    renderSheet('');
    expect(screen.getByLabelText('link')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'guardar link' })).toBeDisabled();
  });

  it('link válido no clipboard: mostra o host, sem campo de digitar', () => {
    renderSheet('https://repositorio.ufsc.br/handle/123/artigo-luto');
    expect(screen.queryByLabelText('link')).not.toBeInTheDocument();
    expect(screen.getByText('repositorio.ufsc.br')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'guardar link' })).toBeEnabled();
  });

  it('artigo + é pro TCC (padrão): cria a leitura e a referência na mesma ação', async () => {
    const { onClose } = renderSheet('');
    fireEvent.change(screen.getByLabelText('link'), {
      target: { value: 'https://example.org/artigo' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'guardar link' }));
    await waitFor(() => expect(screen.getByTestId('readings')).toHaveTextContent('1'));
    expect(screen.getByTestId('refs')).toHaveTextContent('1');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('leitura (livro) + não é pro TCC: cria só a leitura, sem referência', async () => {
    const { onClose } = renderSheet('');
    fireEvent.click(screen.getByRole('radio', { name: 'leitura' }));
    fireEvent.click(screen.getByRole('radio', { name: 'não' }));
    fireEvent.change(screen.getByLabelText('link'), {
      target: { value: 'https://example.org/livro' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'guardar link' }));
    await waitFor(() => expect(screen.getByTestId('readings')).toHaveTextContent('1'));
    expect(screen.getByTestId('refs')).toHaveTextContent('0');
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('URL inválida: o guardar fica desabilitado (não há escrita)', () => {
    renderSheet('');
    fireEvent.change(screen.getByLabelText('link'), {
      target: { value: 'javascript:alert(1)' },
    });
    expect(screen.getByRole('button', { name: 'guardar link' })).toBeDisabled();
  });
});
