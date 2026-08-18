import { describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TagList } from '../TagList';

describe('TagList', () => {
  it('renderiza cada tag como chip', () => {
    render(<TagList tags={['ansiedade', 'freud']} />);
    expect(screen.getByText('ansiedade')).toBeInTheDocument();
    expect(screen.getByText('freud')).toBeInTheDocument();
  });

  it('chama onRemove com a tag ao clicar no ✕', () => {
    const onRemove = vi.fn();
    render(<TagList tags={['ansiedade']} onRemove={onRemove} />);
    fireEvent.click(screen.getByRole('button', { name: 'remover ansiedade' }));
    expect(onRemove).toHaveBeenCalledWith('ansiedade');
  });

  it('mostra emptyMessage quando não há tags', () => {
    render(<TagList tags={[]} emptyMessage="sem tags por aqui" />);
    expect(screen.getByText('sem tags por aqui')).toBeInTheDocument();
  });

  it('aceita variante e ícone', () => {
    render(
      <TagList
        tags={['a']}
        variant="blue"
        size="sm"
        icon={<span data-testid="icone" />}
      />
    );
    expect(screen.getByTestId('icone')).toBeInTheDocument();
  });
});