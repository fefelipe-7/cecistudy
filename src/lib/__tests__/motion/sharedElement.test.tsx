import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { LayoutGroup } from 'framer-motion';
import { SharedElement, sharedNoteId, sharedCourseId } from '@/lib/motion';

/**
 * O que este teste protege que outro gate não protege: **o par do shared
 * element** (SPEC-M-027 D21 · I9). O `layoutId` casa por string — se origem e
 * destino deixarem de usar a mesma, a animação some sem erro nenhum, e nenhum
 * outro gate olha para isso.
 */
describe('SharedElement', () => {
  it('origem e destino carregam a mesma string', () => {
    render(
      <LayoutGroup>
        <SharedElement id={sharedNoteId('n1')}>origem</SharedElement>
        <SharedElement id={sharedNoteId('n1')}>destino</SharedElement>
      </LayoutGroup>,
    );

    const ids = screen
      .getAllByText(/origem|destino/)
      .map((element) => (element as HTMLElement).dataset.sharedElement);

    expect(ids).toEqual(['note-n1', 'note-n1']);
  });

  it('sem par montado o elemento renderiza no lugar (o fade é da camada)', () => {
    render(<SharedElement id={sharedNoteId('n2')}>sozinho</SharedElement>);

    expect(screen.getByText('sozinho')).toHaveAttribute('data-shared-element', 'note-n2');
  });

  it('par de disciplina: origem e destino carregam a mesma string (course-card-<id>)', () => {
    render(
      <LayoutGroup>
        <SharedElement id={sharedCourseId('c1')}>card da disciplina</SharedElement>
        <SharedElement id={sharedCourseId('c1')}>capinha do detalhe</SharedElement>
      </LayoutGroup>,
    );

    const ids = screen
      .getAllByText(/card da disciplina|capinha do detalhe/)
      .map((element) => (element as HTMLElement).dataset.sharedElement);

    expect(ids).toEqual(['course-card-c1', 'course-card-c1']);
  });

  it('prefixo do par de disciplina não colide com a chave de camada do slide', () => {
    expect(sharedCourseId('c1')).toBe('course-card-c1');
    expect(sharedCourseId('c1')).not.toBe('course-c1');
  });
});
