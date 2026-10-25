import { render } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { MobileAppProvider } from '../../../../apps/mobile/src/MobileAppProvider';
import { FaculdadeView } from '../FaculdadeView';
import type { Course } from '../../../types';

/**
 * O que este teste protege que outro gate não protege: **as Rules of Hooks no
 * early return do `FaculdadeView`** (erro real reportado pela usuária em
 * 2026-10-25: "Rendered fewer hooks than expected" ao abrir o card de
 * disciplina). O `weekEntries` (`useMemo`) morava DEPOIS do `if (course)` —
 * quando o `LayoutGroup` re-renderiza a tela em saída com `course` já
 * definido, o hook a menos derrubava a árvore inteira. Nenhum outro gate
 * renderiza a mesma fiber duas vezes com a prop mudando.
 */

const curso: Course = {
  id: 'c1',
  name: 'psicopatologia',
  professor: 'Helena Duarte',
  semester: '6º Semestre',
  schedule: [],
  color: '#B94862',
  icon: 'Brain',
};

const ui = (course?: Course) => (
  <MobileAppProvider>
    <FaculdadeView course={course} />
  </MobileAppProvider>
);

describe('FaculdadeView — early return e Rules of Hooks (SPEC-M-027 F7)', () => {
  it('re-render com course definido na mesma fiber não pula hooks', () => {
    // Primeiro render: grade (course undefined → todos os hooks rodam).
    const view = render(ui());
    // Segundo render NA MESMA position: detalhe (course definido → early
    // return). Antes do fix: "Rendered fewer hooks than expected".
    expect(() => view.rerender(ui(curso))).not.toThrow();
    // E o detalhe realmente montou em vez de derrubar a árvore.
    expect(view.container.textContent).toContain('psicopatologia');
  });

  it('voltar da grade para o detalhe e de volta também não pula hooks', () => {
    const view = render(ui(curso));
    expect(() => view.rerender(ui())).not.toThrow();
    expect(() => view.rerender(ui(curso))).not.toThrow();
  });
});
