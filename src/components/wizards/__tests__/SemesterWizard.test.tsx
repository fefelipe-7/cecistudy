import { describe, expect, it, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react';
import type { AcademicTerm } from '../../../types';

/* -------------------------------------------------------------------------- */
/* Estado mutável do mock                                                     */
/* -------------------------------------------------------------------------- */

const term = (over: Partial<AcademicTerm> = {}): AcademicTerm =>
  ({
    id: 'trm-1',
    ordinal: 6,
    label: '6º semestre',
    status: 'ativo',
    startedAt: '2026-02-01',
    statusTransitionAt: '2026-02-01T00:00:00.000Z',
    createdAt: '2026-02-01T00:00:00.000Z',
    updatedAt: '2026-02-01T00:00:00.000Z',
    ...over,
  }) as AcademicTerm;

const state = {
  academicTerms: [term()] as AcademicTerm[],
  totalSemesters: 8,
  /** `null` = o wizard deve cair no caminho "abrir o 1º semestre". */
  flashcards: [] as unknown[],
  courses: [
    { id: 'c1', name: 'clínica', termId: 'trm-1', status: 'ativo' },
    { id: 'c2', name: 'psicologia social', termId: 'trm-1', status: 'ativo' },
  ] as unknown[],
};

const openFirstTerm = vi.fn();
const applyTermRollover = vi.fn();
const undoLastRollover = vi.fn();
const closeWizard = vi.fn();
const showToast = vi.fn();
const openTermHistory = vi.fn();

vi.mock('@/context/mobileApp', () => ({
  useMobileApp: () => ({
    academicTerms: state.academicTerms,
    courses: state.courses,
    tasks: [],
    readings: [],
    flashcards: state.flashcards,
    sessions: [],
    classes: [],
    exams: [],
    streakStats: { current: 3, total: 9, longest: 5 },
    profile: { semester: 6, totalSemesters: state.totalSemesters },
    closeWizard,
    showToast,
    applyTermRollover,
    undoLastRollover,
    openTermHistory,
    openFirstTerm,
  }),
}));

import { SemesterWizard } from '../SemesterWizard';

beforeEach(() => {
  state.academicTerms = [term()];
  state.totalSemesters = 8;
  state.flashcards = [];
  state.courses = [
    { id: 'c1', name: 'clínica', termId: 'trm-1', status: 'ativo' },
    { id: 'c2', name: 'psicologia social', termId: 'trm-1', status: 'ativo' },
  ];
  openFirstTerm.mockClear();
  applyTermRollover.mockClear();
  undoLastRollover.mockClear();
  closeWizard.mockClear();
  showToast.mockClear();
  openTermHistory.mockClear();
  // o rascunho persiste em `wizard_draft_semester`: sem limpar, o teste seguinte
  // abriria o wizard com a decisão do teste anterior.
  localStorage.removeItem('cecistudy_wizard_draft_semester');
});

const ordinalInput = () => screen.getByLabelText('número do próximo semestre') as HTMLInputElement;

/* -------------------------------------------------------------------------- */

describe('SemesterWizard — abrir o 1º período (SPEC-008 F4.2)', () => {
  it('sem período ativo, a tela vira um passo só e grava o 1º período', () => {
    state.academicTerms = [];
    render(<SemesterWizard />);

    // Um passo só: os passos "o que continua" / "o que fica pra trás" não existem
    // sem um período para encerrar.
    expect(screen.getByText('começamos pelo começo ♡')).toBeTruthy();
    expect(screen.queryByText('qual matéria viaja pro próximo semestre?')).toBeNull();
    expect(ordinalInput().value).toBe('1');
  });

  it('o botão principal abre o 1º período (não tenta virar nada)', () => {
    state.academicTerms = [];
    render(<SemesterWizard />);

    fireEvent.click(screen.getByText('abrir meu 1º semestre ♡'));

    expect(openFirstTerm).toHaveBeenCalledWith(1);
    // `planTermRollover` lança quando não há período ativo: a beco sem saída
    // original era o `handleSave` chamando e voltando sem fazer nada.
    expect(applyTermRollover).not.toHaveBeenCalled();
    expect(showToast).toHaveBeenCalledWith('1º semestre aberto ♡');
    expect(closeWizard).toHaveBeenCalled();
  });

  it('deixa a usuária corrigir o número antes de abrir', () => {
    state.academicTerms = [];
    render(<SemesterWizard />);

    fireEvent.change(ordinalInput(), { target: { value: '2' } });
    fireEvent.click(screen.getByText('abrir meu 1º semestre ♡'));

    expect(openFirstTerm).toHaveBeenCalledWith(2);
    expect(showToast).toHaveBeenCalledWith('2º semestre aberto ♡');
  });
});

describe('SemesterWizard — ordinal do próximo semestre (SPEC-008 F4.1/F4.4)', () => {
  it('vem com o número seguinte ao período ativo', () => {
    render(<SemesterWizard />);
    expect(ordinalInput().value).toBe('7');
  });

  it('NÃO trava no total do curso: 9 num curso de 8 é aceito', () => {
    // A trava circular (F3) tinha duas metades: o `max` do input e o `cap` do
    // `retitleTerm`. Aqui, digitar 9 num curso de 8 tem de ficar 9.
    state.totalSemesters = 8;
    render(<SemesterWizard />);

    fireEvent.change(ordinalInput(), { target: { value: '9' } });

    expect(ordinalInput().value).toBe('9');
    expect(screen.getByText(/além dos 8 do curso/)).toBeTruthy();
  });

  it('o texto de ajuda acompanha o número digitado', () => {
    render(<SemesterWizard />);
    fireEvent.change(ordinalInput(), { target: { value: '8' } });
    expect(screen.getByText('vai abrir 8º semestre')).toBeTruthy();
  });

  it('clampa no teto global (12) e anuncia o ajuste', () => {
    render(<SemesterWizard />);

    fireEvent.change(ordinalInput(), { target: { value: '20' } });

    expect(ordinalInput().value).toBe('12');
    // `role="status"`: o recado do clamp é anunciado, não só visível.
    const status = screen.getByRole('status');
    expect(status.textContent).toMatch(/deixei em 12º/);
  });

  it('clampa o piso em 1', () => {
    render(<SemesterWizard />);
    fireEvent.change(ordinalInput(), { target: { value: '0' } });
    expect(ordinalInput().value).toBe('1');
  });

  it('o recado do clamp some quando o número volta para a faixa', () => {
    render(<SemesterWizard />);
    fireEvent.change(ordinalInput(), { target: { value: '20' } });
    expect(screen.getByRole('status').textContent).toMatch(/deixei em 12º/);
    fireEvent.change(ordinalInput(), { target: { value: '7' } });
    expect(screen.getByRole('status').textContent).toBe('');
  });

  it('a gravação usa exatamente o número digitado, acima do total do curso', async () => {
    // Este é o teste que fecha a trava circular no **caminho de escrita**: o
    // plano tem de carregar `nextOrdinal: 9` num curso de 8. Se alguém voltar a
    // passar `totalSemesters` ao `planTermRollover`, o cap volta e este assert
    // pega — o `ordinal` viraria 8 por baixo, com o review já tendo prometido 9.
    state.totalSemesters = 8;
    render(<SemesterWizard />);

    fireEvent.change(ordinalInput(), { target: { value: '9' } });
    fireEvent.click(screen.getByText('continuar'));
    await waitFor(() => screen.getByText('qual matéria viaja pro próximo semestre?'));
    for (const group of screen.getAllByRole('radiogroup')) {
      fireEvent.click(within(group).getByRole('radio', { name: 'continua' }));
    }
    fireEvent.click(screen.getByText('continuar'));
    await waitFor(() => screen.getByText('as pendências ficam esperando?'));
    fireEvent.click(screen.getByText('continuar'));
    await waitFor(() => screen.getByText(/prontinho, 9º semestre\?/));
    fireEvent.click(screen.getByText('virar o semestre ♡'));

    expect(applyTermRollover).toHaveBeenCalledTimes(1);
    const plan = applyTermRollover.mock.calls[0][0] as {
      terms: Array<{ id: string; ordinal: number; status: string; label: string }>;
      nextTermId: string;
    };
    const created = plan.terms.find((t) => t.id === plan.nextTermId);
    expect(created?.ordinal).toBe(9);
    expect(created?.status).toBe('ativo');
  });
});

describe('SemesterWizard — pendências do flashcards (SPEC-008 F4.6)', () => {
  it('conta só o que não foi revisado no semestre que está fechando', async () => {
    state.flashcards = [
      { id: 'f-novo', courseId: undefined },                        // nunca revisado
      { id: 'f-deste-ano', courseId: undefined, lastReviewed: '2026-05-01T00:00:00.000Z' },
      { id: 'f-velho', courseId: undefined, lastReviewed: '2025-06-01T00:00:00.000Z' },
    ];
    render(<SemesterWizard />);

    // passo 0 -> 1 (avança livre), depois 1 -> 2 exige decidir **cada**
    // disciplina (`canNext` trava em `undecided.length > 0`).
    fireEvent.click(screen.getByText('continuar'));
    await waitFor(() => screen.getByText('qual matéria viaja pro próximo semestre?'));
    for (const group of screen.getAllByRole('radiogroup')) {
      fireEvent.click(within(group).getByRole('radio', { name: 'continua' }));
    }
    fireEvent.click(screen.getByText('continuar'));
    await waitFor(() => screen.getByText('as pendências ficam esperando?'));

    // 2 pendentes (f-novo + f-deste-ano); f-velho é de outro semestre.
    const statuses = screen.getAllByRole('status').map((el) => el.textContent);
    expect(statuses.join(' | ')).toContain('2 no baralho');
  });
});

describe('SemesterWizard — a11y do passo de decisões (SPEC-008 F4.7)', () => {
  it('expõe as opções como radiogroup/radio, não como botões soltos', async () => {
    render(<SemesterWizard />);
    fireEvent.click(screen.getByText('continuar'));
    fireEvent.click(screen.getByText('continuar'));
    await waitFor(() => screen.getByText('qual matéria viaja pro próximo semestre?'));

    const group = screen.getByRole('radiogroup', { name: 'decisão para clínica' });
    const radios = within(group).getAllByRole('radio');
    expect(radios.map((r) => r.textContent)).toEqual(['continua', 'arquiva', 'depois']);

    // `aria-checked` (não `aria-pressed`): as três são mutuamente exclusivas.
    // Nenhuma começa selecionada — o padrão do wizard é "depois".
    expect(radios.map((r) => r.getAttribute('aria-checked'))).toEqual(['false', 'false', 'true']);

    // roving tabindex: só a selecionada é alcançável por Tab.
    expect(radios.map((r) => r.getAttribute('tabindex'))).toEqual(['-1', '-1', '0']);
  });

  it('a seta move a seleção dentro do grupo', async () => {
    render(<SemesterWizard />);
    fireEvent.click(screen.getByText('continuar'));
    fireEvent.click(screen.getByText('continuar'));
    await waitFor(() => screen.getByText('qual matéria viaja pro próximo semestre?'));

    const group = screen.getByRole('radiogroup', { name: 'decisão para clínica' });
    const last = within(group).getByRole('radio', { name: 'depois' });
    last.focus();
    fireEvent.keyDown(last, { key: 'ArrowRight' });

    await waitFor(() =>
      expect(within(group).getByRole('radio', { name: 'continua' }).getAttribute('aria-checked')).toBe('true'),
    );
  });
});
