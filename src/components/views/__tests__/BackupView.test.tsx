/**
 * Teste da tela de backup/restauração (SPEC-M-024 D5).
 *
 * Verifica que exportar chama `exportData`. O fluxo de seleção de arquivo
 * via input type="file" não é testado aqui (jsdom não suporta bem), mas
 * o handler `importData` é injetável via props para testes futuros.
 */
import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BackupView } from '../BackupView';

describe('BackupView', () => {
  it('chama exportData ao clicar em "Exportar backup"', async () => {
    const exportData = vi.fn();
    render(<BackupView exportData={exportData} />);
    const btn = screen.getByRole('button', { name: 'Exportar backup' });
    fireEvent.click(btn);
    expect(exportData).toHaveBeenCalledTimes(1);
  });

  it('renderiza o botão de importação e o input de arquivo', () => {
    const importData = vi.fn();
    render(<BackupView importData={importData} />);
    const btn = screen.getByRole('button', { name: 'Importar backup' });
    expect(btn).toBeInTheDocument();
    const input = btn.closest('label')?.querySelector('input[type="file"]');
    expect(input).toBeInTheDocument();
  });
});
