import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ColorSwatchPicker } from '../ColorSwatchPicker';

const SWATCHES = ['#E97891', '#609FB8', '#8BC7A2'];

describe('ColorSwatchPicker', () => {
  it('marca com aria-pressed a cor selecionada', () => {
    render(<ColorSwatchPicker value={SWATCHES[1]} onChange={() => {}} swatches={SWATCHES} />);
    expect(screen.getByRole('button', { name: `cor ${SWATCHES[1]}` })).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(screen.getByRole('button', { name: `cor ${SWATCHES[0]}` })).toHaveAttribute(
      'aria-pressed',
      'false',
    );
  });

  it('chama onChange com a cor ao clicar', () => {
    const onChange = vi.fn();
    render(<ColorSwatchPicker value={SWATCHES[0]} onChange={onChange} swatches={SWATCHES} />);
    fireEvent.click(screen.getByRole('button', { name: `cor ${SWATCHES[2]}` }));
    expect(onChange).toHaveBeenCalledWith(SWATCHES[2]);
  });
});
