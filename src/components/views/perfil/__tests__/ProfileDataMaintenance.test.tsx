/**
 * SPEC-013 D6 — manutenção em rows: sync vem **primeiro**, backup abre modais
 * reaproveitados do `DataSection`, e a row de OTA só existe no nativo (via
 * `maintenance.native`, nunca `isNativePlatform` no componente — regra de
 * fronteira do `check-boundaries.mjs:131-140`).
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import ProfileDataMaintenance from '../ProfileDataMaintenance';
import type { ProfileMaintenance } from '../../../../lib/profileViewModel';

const maintenance = (native = false): ProfileMaintenance => ({ native });

const renderMaintenance = (
  over: {
    onOpenSync?: () => void;
    onExport?: () => void;
    onImport?: (json: string) => void;
    onReset?: () => void;
  } = {},
  native = false,
) => {
  const handlers = {
    onOpenSync: vi.fn(),
    onExport: vi.fn(),
    onImport: vi.fn(),
    onReset: vi.fn(),
    ...over,
  };
  render(<ProfileDataMaintenance maintenance={maintenance(native)} {...handlers} />);
  return handlers;
};

describe('ProfileDataMaintenance', () => {
  it('sync é a primeira row e abre a tela de sincronização', () => {
    const h = renderMaintenance();
    const rows = screen.getAllByRole('button');
    expect(rows[0]).toBe(screen.getByRole('button', { name: /sincronizar entre dispositivos/ }));
    fireEvent.click(rows[0]);
    expect(h.onOpenSync).toHaveBeenCalledTimes(1);
  });

  it('exportar abre o modal de senha e confirmar chama onExport', () => {
    const h = renderMaintenance();
    fireEvent.click(screen.getByRole('button', { name: /exportar backup/ }));
    fireEvent.click(screen.getByRole('button', { name: 'exportar' }));
    expect(h.onExport).toHaveBeenCalledTimes(1);
  });

  it('importar um backup JSON pede confirmação com os metadados', async () => {
    const h = renderMaintenance();
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    expect(input).not.toBeNull();

    const json = JSON.stringify({
      format: 'cecistudy-backup',
      schemaVersion: 22,
      exportedAt: '2026-10-13',
      profile: { name: 'ceci' },
    });
    fireEvent.change(input!, { target: { files: [new File([json], 'backup.json', { type: 'application/json' })] } });

    await waitFor(() => {
      expect(screen.getByText('importar backup?')).toBeTruthy();
    });
    expect(screen.getByText('22')).toBeTruthy();
    expect(screen.getByText('cecistudy-backup')).toBeTruthy();

    fireEvent.click(screen.getByRole('button', { name: 'importar' }));
    expect(h.onImport).toHaveBeenCalledTimes(1);
    expect(vi.mocked(h.onImport).mock.calls[0][0]).toContain('"name":"ceci"');
  });

  it('backup criptografado abre o modal de senha (não importa direto)', async () => {
    const h = renderMaintenance();
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');

    const enc = JSON.stringify({ v: 1, alg: 'AES-GCM', salt: 's', iv: 'i', data: 'd' });
    fireEvent.change(input!, { target: { files: [new File([enc], 'backup.enc.json')] } });

    await waitFor(() => {
      expect(screen.getByText('backup criptografado')).toBeTruthy();
    });
    fireEvent.click(screen.getByRole('button', { name: 'cancelar' }));
    expect(h.onImport).not.toHaveBeenCalled();
  });

  it('a row de atualização só existe no nativo', () => {
    const { unmount } = render(<ProfileDataMaintenance maintenance={maintenance(false)} onOpenSync={vi.fn()} onExport={vi.fn()} onImport={vi.fn()} onReset={vi.fn()} />);
    expect(screen.queryByRole('button', { name: /atualização do app/ })).toBeNull();
    unmount();

    render(<ProfileDataMaintenance maintenance={maintenance(true)} onOpenSync={vi.fn()} onExport={vi.fn()} onImport={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByRole('button', { name: /atualização do app/ })).toBeTruthy();
  });

  it('o reset mora na zona de cuidado e pede confirmação', () => {
    const h = renderMaintenance();
    fireEvent.click(screen.getByRole('button', { name: /resetar cantinho/ }));
    expect(screen.getByText('resetar cantinho?')).toBeTruthy();
    expect(h.onReset).not.toHaveBeenCalled();

    fireEvent.click(screen.getByRole('button', { name: 'confirmar' }));
    expect(h.onReset).toHaveBeenCalledTimes(1);
  });

  it('json inválido importa direto (comportamento preservado do DataSection)', async () => {
    const h = renderMaintenance();
    const input = document.querySelector<HTMLInputElement>('input[type="file"]');
    fireEvent.change(input!, { target: { files: [new File(['não sou json'], 'x.json')] } });
    await waitFor(() => {
      expect(h.onImport).toHaveBeenCalledWith('não sou json');
    });
  });
});
