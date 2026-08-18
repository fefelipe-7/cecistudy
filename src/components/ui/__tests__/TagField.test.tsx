import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagField } from '../TagField';

describe('TagField', () => {
  it('adiciona a tag ao pressionar Enter', () => {
    const onChange = vi.fn();
    render(<TagField tags={[]} onChange={onChange} placeholder="tags" />);
    const input = screen.getByPlaceholderText('tags');
    fireEvent.change(input, { target: { value: ' ansiedade ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).toHaveBeenCalledWith(['ansiedade']);
  });

  it('adiciona a tag ao digitar vírgula', () => {
    const onChange = vi.fn();
    render(<TagField tags={[]} onChange={onChange} placeholder="tags" />);
    const input = screen.getByPlaceholderText('tags');
    fireEvent.change(input, { target: { value: 'freud' } });
    fireEvent.keyDown(input, { key: ',' });
    expect(onChange).toHaveBeenCalledWith(['freud']);
  });

  it('adiciona ao clicar no botão +', () => {
    const onChange = vi.fn();
    render(<TagField tags={[]} onChange={onChange} placeholder="tags" />);
    fireEvent.change(screen.getByPlaceholderText('tags'), { target: { value: 'tcc' } });
    fireEvent.click(screen.getByRole('button', { name: 'adicionar' }));
    expect(onChange).toHaveBeenCalledWith(['tcc']);
  });

  it('não duplica tags (case-insensitive)', () => {
    const onChange = vi.fn();
    render(<TagField tags={['Freud']} onChange={onChange} placeholder="tags" />);
    const input = screen.getByPlaceholderText('tags');
    fireEvent.change(input, { target: { value: 'freud' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });

  it('remove a última tag com backspace no campo vazio', () => {
    const onChange = vi.fn();
    render(<TagField tags={['a', 'b']} onChange={onChange} placeholder="tags" />);
    const input = screen.getByPlaceholderText('tags');
    fireEvent.keyDown(input, { key: 'Backspace' });
    expect(onChange).toHaveBeenCalledWith(['a']);
  });

  it('ignora input em branco', () => {
    const onChange = vi.fn();
    render(<TagField tags={[]} onChange={onChange} placeholder="tags" />);
    const input = screen.getByPlaceholderText('tags');
    fireEvent.change(input, { target: { value: '   ' } });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onChange).not.toHaveBeenCalled();
  });
});