import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagList } from '../TagList';

describe('TagList', () => {
  it('chama onRemove com a tag ao clicar no ✕', () => {
    const onRemove = vi.fn();
    render(<TagList tags={['ansiedade']} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'remover ansiedade' }));
    expect(onRemove).toHaveBeenCalledWith('ansiedade');
  });

  it('sem onRemove não oferece botão de remover', () => {
    render(<TagList tags={['ansiedade']} />);
    expect(screen.queryByRole('button', { name: 'remover ansiedade' })).not.toBeInTheDocument();
  });
});
