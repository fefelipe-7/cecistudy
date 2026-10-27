/**
 * Container transform — camada de clone (SPEC-M-028 D25/D26).
 *
 * O que este teste protege que outro gate não protege:
 * - **I16** — origem e destino chamam o **mesmo** helper. Dois literais em
 *   arquivos diferentes deixariam de casar sem erro nenhum.
 * - **I17/I18** — o retrato do `pointerdown` não sobrevive a um toque que não
 *   navegou (órfão de 600 ms), e a animação sempre termina limpa.
 * - **I29** — as primitivas são headless: nenhum nó extra no DOM (senão o
 *   `AnimatePresence mode="popLayout"` das listas quebra).
 * - **I30** — com o clone na tela, a origem fica escondida (não há dois cards).
 *
 * jsdom não mede geometria: o retângulo é stubado. O que se testa aqui é a
 * máquina de estados e o contrato do DOM, não a física.
 */

import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { FULL_PROFILE, REDUCED_PROFILE } from '../../motion/profile';
import { morphIdForEntry } from '../../calendarDestination';
import type { CalendarEntry } from '../../schedule';
import type { Exam } from '../../../types';
import {
  MorphLayer,
  MorphSource,
  MorphTarget,
  activateMorphForNavigation,
  beginMorph,
  clearMorph,
  peekActiveMorph,
  peekMorph,
  peekMorphTarget,
  resetMorphForTests,
  sharedApproachId,
  sharedBookId,
  sharedCaseId,
  sharedChapterId,
  sharedCourseId,
  sharedEntryId,
  sharedFamilyId,
  sharedNoteId,
  sharedQuizGroupId,
  sharedTempleId,
} from '../../motion/Morph';

const RECT = {
  left: 10,
  top: 20,
  width: 300,
  height: 80,
  right: 310,
  bottom: 100,
  x: 10,
  y: 20,
  toJSON: () => ({}),
} as DOMRect;

beforeEach(() => {
  resetMorphForTests();
  vi.spyOn(Element.prototype, 'getBoundingClientRect').mockReturnValue(RECT);
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  resetMorphForTests();
});

describe('helpers de par (I16)', () => {
  it('cada fluxo tem o próprio prefixo — nenhum colide com chave de camada', () => {
    const ids = {
      note: sharedNoteId('x1'),
      course: sharedCourseId('x1'),
      family: sharedFamilyId('x1'),
      approach: sharedApproachId('x1'),
      temple: sharedTempleId('x1'),
      quiz: sharedQuizGroupId('x1'),
      caso: sharedCaseId('x1'),
      chapter: sharedChapterId('x1'),
      book: sharedBookId('x1'),
      entry: sharedEntryId('x1'),
    };
    expect(ids).toEqual({
      note: 'note-x1',
      course: 'course-card-x1',
      family: 'family-card-x1',
      approach: 'approach-card-x1',
      temple: 'temple-card-x1',
      quiz: 'quiz-group-card-x1',
      caso: 'case-card-x1',
      chapter: 'chapter-card-x1',
      book: 'book-card-x1',
      entry: 'entry-card-x1',
    });
    expect(new Set(Object.values(ids)).size).toBe(10);
  });
});

describe('par do calendário (F3) — o id sai do destino, não da linha', () => {
  const entry = (ref: CalendarEntry['ref']): CalendarEntry => ({
    id: `entry-${ref.kind}-${ref.id}`,
    date: '2026-10-27',
    kind: 'aula',
    layer: 'faculdade',
    title: 't',
    ref,
  });
  const exams = [{ id: 'ex1', courseId: 'c1' }] as Exam[];

  it('aula e prova apontam para o hero da disciplina', () => {
    expect(morphIdForEntry(entry({ kind: 'class', id: 'c1' }), exams)).toBe(sharedCourseId('c1'));
    expect(morphIdForEntry(entry({ kind: 'exam', id: 'ex1' }), exams)).toBe(sharedCourseId('c1'));
  });

  it('prova órfã e os destinos sem alvo não capturam nada', () => {
    expect(morphIdForEntry(entry({ kind: 'exam', id: 'sumiu' }), exams)).toBeNull();
    expect(morphIdForEntry(entry({ kind: 'task', id: 't1' }), exams)).toBeNull();
    expect(morphIdForEntry(entry({ kind: 'chapter', id: 'ch1' }), exams)).toBeNull();
    expect(morphIdForEntry(entry({ kind: 'internship', id: 'i1' }), exams)).toBeNull();
  });
});

describe('MorphSource — retrato no pointerdown', () => {
  it('não cria nó extra e marca o filho (I29)', () => {
    const { container } = render(
      <MorphSource id={sharedNoteId('n1')}>
        <div data-testid="card">card</div>
      </MorphSource>,
    );
    const card = screen.getByTestId('card');
    expect(card.dataset.morphSource).toBe('note-n1');
    // O único nó do render é o card: a primitiva é `cloneElement`.
    expect(container.firstElementChild).toBe(card);
  });

  it('preserva o onPointerDown que o filho já tinha', () => {
    const spy = vi.fn();
    render(
      <MorphSource id={sharedNoteId('n1')}>
        <div data-testid="card" onPointerDown={spy}>
          card
        </div>
      </MorphSource>,
    );
    fireEvent.pointerDown(screen.getByTestId('card'));
    expect(spy).toHaveBeenCalledTimes(1);
    expect(peekMorph()?.id).toBe('note-n1');
  });

  it('não captura quando o toque é num botão de dentro do card (editar/excluir)', () => {
    render(
      <MorphSource id={sharedNoteId('n1')}>
        <div data-testid="card">
          <button type="button" data-testid="editar">
            editar
          </button>
        </div>
      </MorphSource>,
    );
    fireEvent.pointerDown(screen.getByTestId('editar'));
    expect(peekMorph()).toBeNull();
  });
});

describe('MorphTarget — âncora do detalhe', () => {
  it('registra o alvo montado e marca o filho', () => {
    const { container } = render(
      <MorphTarget id={sharedCourseId('c1')}>
        <div data-testid="hero">hero</div>
      </MorphTarget>,
    );
    expect(screen.getByTestId('hero').dataset.morphTarget).toBe('course-card-c1');
    expect(container.firstElementChild).toBe(screen.getByTestId('hero'));
    expect(peekMorphTarget()?.id).toBe('course-card-c1');
  });

  it('id nulo é pass-through: não marca nem registra', () => {
    render(
      <MorphTarget id={null}>
        <div data-testid="plain">plain</div>
      </MorphTarget>,
    );
    expect(screen.getByTestId('plain').dataset.morphTarget).toBeUndefined();
    expect(peekMorphTarget()).toBeNull();
  });
});

describe('store — órfão, promoção e limpeza', () => {
  it('o retrato sem navegação morre em 600 ms (I17)', () => {
    vi.useFakeTimers();
    const card = document.createElement('div');
    beginMorph('note-n1', card);
    expect(peekMorph()).not.toBeNull();
    vi.advanceTimersByTime(599);
    expect(peekMorph()).not.toBeNull();
    vi.advanceTimersByTime(1);
    expect(peekMorph()).toBeNull();
  });

  it('push: a captura vira a animação e o retrato é consumido', () => {
    const card = document.createElement('div');
    beginMorph('note-n1', card);
    expect(activateMorphForNavigation({ kind: 'push', morph: true })).toBe(true);
    expect(peekMorph()).toBeNull();
    expect(peekActiveMorph()).toMatchObject({ id: 'note-n1', direction: 'push' });
    clearMorph();
    expect(peekActiveMorph()).toBeNull();
  });

  it('push sem captura não inventa morph', () => {
    expect(activateMorphForNavigation({ kind: 'push', morph: false })).toBe(false);
    expect(peekActiveMorph()).toBeNull();
  });

  it('pop: o alvo registrado é a origem, com a direção invertida', () => {
    render(
      <MorphTarget id={sharedCourseId('c1')}>
        <div>hero</div>
      </MorphTarget>,
    );
    expect(activateMorphForNavigation({ kind: 'pop', morph: false })).toBe(true);
    expect(peekActiveMorph()).toMatchObject({ id: 'course-card-c1', direction: 'pop' });
  });

  it('pop sem alvo montado cai no crossfade (nenhum clone)', () => {
    expect(activateMorphForNavigation({ kind: 'pop', morph: false })).toBe(false);
    expect(peekActiveMorph()).toBeNull();
  });
});

describe('MorphLayer', () => {
  it('ociosa não renderiza nada', () => {
    render(<MorphLayer profile={FULL_PROFILE} />);
    expect(document.querySelector('[data-morph-clone]')).toBeNull();
  });

  it('desenha o clone e esconde a origem (I30)', () => {
    render(
      <>
        <MorphSource id={sharedCourseId('c1')}>
          <div data-testid="card">card</div>
        </MorphSource>
        <MorphTarget id={sharedCourseId('c1')}>
          <div data-testid="hero">hero</div>
        </MorphTarget>
        <MorphLayer profile={FULL_PROFILE} />
      </>,
    );

    fireEvent.pointerDown(screen.getByTestId('card'));
    const card = screen.getByTestId('card');
    act(() => {
      activateMorphForNavigation({ kind: 'push', morph: true });
    });

    expect(document.querySelector('[data-morph-clone="course-card-c1"]')).not.toBeNull();
    expect(card.style.visibility).toBe('hidden');
    // O clone não carrega a marca de origem — senão ele se esconderia junto.
    const clone = document.querySelector('[data-morph-clone="course-card-c1"]');
    expect(clone?.querySelector('[data-morph-source]')).toBeNull();
  });

  it('perfil reduzido não desenha clone (I25)', () => {
    render(
      <>
        <MorphSource id={sharedCourseId('c1')}>
          <div data-testid="card">card</div>
        </MorphSource>
        <MorphLayer profile={REDUCED_PROFILE} />
      </>,
    );

    fireEvent.pointerDown(screen.getByTestId('card'));
    act(() => {
      activateMorphForNavigation({ kind: 'push', morph: true });
    });

    expect(document.querySelector('[data-morph-clone]')).toBeNull();
    expect(peekActiveMorph()).toBeNull();
  });
});
