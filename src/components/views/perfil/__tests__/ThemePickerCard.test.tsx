import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemePickerCard from '../ThemePickerCard';
import { THEMES, THEME_ORDER } from '../../../../lib/themes';

vi.mock('../../../../lib/haptics', () => ({
  hapticSuccess: vi.fn(),
  hapticTap: vi.fn(),
  hapticWarning: vi.fn(),
}));

const optionLabel = (id: (typeof THEME_ORDER)[number]) => `${THEMES[id].emoji} ${THEMES[id].label}`;

describe('ThemePickerCard', () => {
  it('renderiza as 6 opções de tema', () => {
    render(<ThemePickerCard currentTheme="rosa-claro" onSelect={() => {}} />);
    expect(THEME_ORDER).toHaveLength(6);
    const select = screen.getByRole('combobox', { name: 'selecionar tema' });
    for (const id of THEME_ORDER) {
      const option = select.querySelector(`option[value="${id}"]`);
      expect(option).toBeDefined();
      expect(option?.textContent).toBe(optionLabel(id));
    }
  });

  it('change chama onSelect com a id do tema', () => {
    const onSelect = vi.fn();
    render(<ThemePickerCard currentTheme="rosa-claro" onSelect={onSelect} />);
    const select = screen.getByRole('combobox', { name: 'selecionar tema' }) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'noturno' } });
    expect(onSelect).toHaveBeenCalledWith('noturno');
  });

  it('preview reflete currentTheme', () => {
    const { rerender } = render(<ThemePickerCard currentTheme="oceano" onSelect={() => {}} />);
    const items = screen.getAllByText('🌊 calmaria azul');
    expect(items.length).toBeGreaterThan(0);
    rerender(<ThemePickerCard currentTheme="neon" onSelect={() => {}} />);
    const items2 = screen.getAllByText('⚡ néon vibrante');
    expect(items2.length).toBeGreaterThan(0);
  });

  it('change para tema já ativo não chama onSelect', () => {
    const onSelect = vi.fn();
    render(<ThemePickerCard currentTheme="amanhecer" onSelect={onSelect} />);
    const select = screen.getByRole('combobox', { name: 'selecionar tema' }) as HTMLSelectElement;
    fireEvent.change(select, { target: { value: 'amanhecer' } });
    expect(onSelect).not.toHaveBeenCalled();
  });
});