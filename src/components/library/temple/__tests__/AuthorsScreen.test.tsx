import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import React from 'react';

import { AuthorsScreen } from '../AuthorsScreen';
import type { TempleAuthor } from '../../../../types';

const AUTHORS: TempleAuthor[] = [
  {
    id: 'author-sigmund_freud',
    name: 'Sigmund Freud',
    slug: 'sigmund_freud',
    order: 1,
    families: ['Psicanalítica e Psicodinâmica'],
    aliases: ['Freud'],
    oneLiner: 'Fundador da psicanálise.',
    fullName: 'Sigmund Schlomo Freud',
    born: '1856',
    died: '1939',
    mainWork: 'A interpretação dos sonhos (1900)',
    sections: [
      {
        title: 'A grande ideia',
        body: 'Muito do que pensamos é influenciado por processos **inconscientes**.',
      },
      {
        title: 'Principais obras',
        body: '| Obra | Ano |\n|---|---|\n| A interpretação dos sonhos | 1900 |',
      },
    ],
  },
  {
    id: 'author-carl_rogers',
    name: 'Carl Rogers',
    slug: 'carl_rogers',
    order: 2,
    families: ['Existencial-Humanista'],
    aliases: [],
    oneLiner: null,
    born: '1902',
    died: '1987',
    sections: [{ title: 'Quem foi?', body: 'Psicólogo humanista norte-americano.' }],
  },
];

vi.mock('../../../../lib/templeData', () => ({
  getTempleAuthors: vi.fn(async () => AUTHORS),
}));

import { getTempleAuthors } from '../../../../lib/templeData';

describe('AuthorsScreen', () => {
  it('carrega e lista os autores na ordem do acervo (sem contagem de questões)', async () => {
    render(<AuthorsScreen />);
    expect(getTempleAuthors).toHaveBeenCalled();
    expect(await screen.findByText('Sigmund Freud')).toBeInTheDocument();
    expect(screen.getByText('Carl Rogers')).toBeInTheDocument();
    // autores são entidade de consulta — nada de "questões" na UI
    expect(screen.queryByText(/questão/)).not.toBeInTheDocument();
  });

  it('filtra por busca e por família teórica', async () => {
    render(<AuthorsScreen />);
    await screen.findByText('Sigmund Freud');

    fireEvent.change(screen.getByLabelText('procurar autor'), { target: { value: 'rogers' } });
    expect(screen.queryByText('Sigmund Freud')).not.toBeInTheDocument();
    expect(screen.getByText('Carl Rogers')).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('procurar autor'), { target: { value: '' } });
    fireEvent.click(screen.getByRole('button', { name: 'psicanalítica e psicodinâmica' }));
    expect(screen.getByText('Sigmund Freud')).toBeInTheDocument();
    expect(screen.queryByText('Carl Rogers')).not.toBeInTheDocument();
  });

  it('abre a ficha com famílias, anos, obra principal e seções renderizadas', async () => {
    render(<AuthorsScreen />);
    await screen.findByText('Sigmund Freud');
    fireEvent.click(screen.getByText('Sigmund Freud'));

    expect(await screen.findByRole('button', { name: 'voltar para a lista de autores' })).toBeInTheDocument();
    expect(screen.getByText('Psicanalítica e Psicodinâmica')).toBeInTheDocument();
    expect(screen.getByText('1856 – 1939')).toBeInTheDocument();
    expect(screen.getByText(/A interpretação dos sonhos \(1900\)/)).toBeInTheDocument();
    // seção em destaque + markdown inline resolvido
    expect(screen.getByText(/a grande ideia/i, { selector: 'h2' })).toBeInTheDocument();
    const strong = screen.getByText('inconscientes');
    expect(strong.tagName).toBe('STRONG');
    // tabela markdown virou <table>
    expect(screen.getByRole('table')).toBeInTheDocument();
    // voltar funciona
    fireEvent.click(screen.getByRole('button', { name: 'voltar para a lista de autores' }));
    expect(await screen.findByText('Carl Rogers')).toBeInTheDocument();
  });

  it('mostra estado vazio quando nada casa com a busca', async () => {
    render(<AuthorsScreen />);
    await screen.findByText('Sigmund Freud');
    fireEvent.change(screen.getByLabelText('procurar autor'), { target: { value: 'zzz-inexistente' } });
    expect(await screen.findByText('nenhum autor com esse nome ♡')).toBeInTheDocument();
  });
});
