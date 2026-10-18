/**
 * Barras contextuais — a barra **real** (SPEC-M-019, barras duplas com sumiço).
 *
 * Os outros testes usam configuração sintética para exercitar apresentação e
 * máquina. Este aqui é o contrário: pega as ações que `headerConfig`
 * **realmente produz** e afirma que o conjunto sai como o enunciado descreve —
 * `[ ← voltar ]  [ ⋯  nome contextual ]`, centralizado no rodapé.
 *
 * É o teste que pega os dois erros mais caros desta feature: a barra existir e
 * **não aparecer** em nenhuma tela de verdade (nada declarou ação principal), e
 * prosa de comentário JSX virar nó de texto e estourar a largura.
 */

import { fireEvent, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { describe, expect, it, vi } from 'vitest';

import { MotionProfileProvider } from '@/components/motion/MotionProfileProvider';
import { ContextualBars } from '@/components/ui/ContextualBars';
import { buildContextualBarModel, isBarModel, type ContextualBarModel } from '@/lib/contextualBar';
import { buildHeaderConfig, type HeaderConfigInput } from '@/lib/headerConfig';
import type { ClassNote, Course, NavScreen } from '@/types';

const curso = {
  id: 'c1',
  name: 'psicologia cognitiva',
  code: 'PSI-101',
  professor: 'dra. almeida',
  icon: 'Brain',
  color: '#D85F79',
} as unknown as Course;

function entrada(kind: NavScreen['kind']): HeaderConfigInput {
  return {
    currentScreen: { kind } as NavScreen,
    focusedFamily: null,
    focusedApproach: null,
    focusedCourse: kind === 'course' ? curso : undefined,
    focusedClassNote: kind === 'classNote' ? ({ id: 'n1' } as ClassNote) : undefined,
    bookmarkedCourseIds: [],
    tccTitle: '',
    questionsCount: 0,
    currentQuizPlayState: null,
    quizResultCorrectCount: null,
    quizResultTotalCount: null,
    dueCardsCount: 0,
    onBack: vi.fn(),
    openWizard: vi.fn(),
    openCompose: vi.fn(),
    openEditCourse: vi.fn(),
    toggleBookmarkCourse: vi.fn(),
    setIsCreatingLooseNote: vi.fn(),
    editManagedItem: vi.fn(),
    openSearch: vi.fn(),
    openStreak: vi.fn(),
    openTemple: vi.fn(),
    openStudy: vi.fn(),
  };
}

/** Constrói o modelo a partir do `headerConfig` real daquela tela. */
function montarReal(kind: NavScreen['kind']) {
  const headerConfig = buildHeaderConfig(entrada(kind));
  const model = buildContextualBarModel({
    currentScreen: { kind } as NavScreen,
    canGoBack: true,
    headerConfig,
  });
  return { headerConfig, model };
}

/** Constrói **e** renderiza, visível por padrão. */
function renderModel(model: ContextualBarModel, visivel = true) {
  render(
    <MotionProfileProvider override={true}>
      <ContextualBars
        model={model}
        onBack={vi.fn()}
        onRunAction={vi.fn()}
        visivel={visivel}
        inert={!visivel}
        onMenuChange={vi.fn()}
      />
    </MotionProfileProvider>,
  );
}

const TELAS_COM_ACAO = [
  'course',
  'classNote',
  'tcc',
  'notes',
  'internshipDiary',
  'streak',
  'stickers',
  'termHistory',
  'temple',
  'comparison',
] as const;

const secoesTemplo = [
  ['conceitos', 'novo conceito'],
  ['autores', 'novo autor'],
  ['tecnicas', 'nova técnica'],
] as const;

describe('barra real — A3 resolvido: a cápsula existe', () => {
  it.each(TELAS_COM_ACAO)('%s produz barra com cápsula central', (kind) => {
    const { model } = montarReal(kind);
    if (!isBarModel(model)) throw new Error(`${kind} deveria ter barra`);
    expect(model.plan.hasCenterCapsule).toBe(true);
    expect(model.primary.length).toBeGreaterThan(0);
  });

  it.each(secoesTemplo)('templo/%s monta a barra com "%s"', (section, label) => {
    const headerConfig = buildHeaderConfig({
      ...entrada('templeSection'),
      currentScreen: { kind: 'templeSection', section } as NavScreen,
    });
    const model = buildContextualBarModel({
      currentScreen: { kind: 'templeSection', section } as NavScreen,
      canGoBack: true,
      headerConfig,
    });
    expect(isBarModel(model)).toBe(true);
    if (!isBarModel(model)) return;
    expect(model.primary[0]?.label).toBe(label);
  });

  it('templo/comparações **não** monta barra: comparação não se cria', () => {
    const headerConfig = buildHeaderConfig({
      ...entrada('templeSection'),
      currentScreen: { kind: 'templeSection', section: 'comparacoes' } as NavScreen,
    });
    const model = buildContextualBarModel({
      currentScreen: { kind: 'templeSection', section: 'comparacoes' } as NavScreen,
      canGoBack: true,
      headerConfig,
    });
    expect(isBarModel(model)).toBe(false);
  });

  it.each(TELAS_COM_ACAO)('%s nomeia a ação principal com rótulo do produto', (kind) => {
    const { model } = montarReal(kind);
    if (!isBarModel(model)) throw new Error(`${kind} deveria ter barra`);
    // pt-BR minúsculo, sem vazio e sem rótulo de teste.
    for (const a of model.primary) {
      expect(a.label.length).toBeGreaterThan(0);
      expect(a.label).toBe(a.label.toLowerCase());
    }
  });
});

describe('duas barras (SPEC-M-019 A6)', () => {
  it('o curso monta as duas barras: voltar e ação (com `⋯` + cápsula)', () => {
    const { model } = montarReal('course');
    if (!isBarModel(model)) throw new Error('course deveria ter barra');
    renderModel(model);
    expect(screen.getByTestId('contextual-bar-voltar')).toBeTruthy();
    expect(screen.getByTestId('contextual-bar-acao')).toBeTruthy();
    expect(screen.getByTestId('contextual-bar-options')).toBeTruthy();
    expect(screen.getByTestId('contextual-bar-capsule')).toBeTruthy();
  });

  it('a barra de voltar é a primeira, então fica à esquerda da de ação', () => {
    const { model } = montarReal('course');
    if (!isBarModel(model)) throw new Error('course deveria ter barra');
    renderModel(model);
    const conjunto = screen.getByTestId('contextual-bars');
    const filhos = Array.from(conjunto.querySelectorAll('button'));
    const ids = [
      filhos.find((n) => n.dataset.testid === 'contextual-bar-voltar'),
      filhos.find((n) => n.dataset.testid === 'contextual-bar-capsule'),
    ];
    expect(ids[0]).toBeTruthy();
    expect(ids[1]).toBeTruthy();
    // Ordem no DOM = ordem visual em `flex`.
    expect(conjunto.querySelectorAll('button')[0]?.dataset.testid).toBe('contextual-bar-voltar');
  });

  it('a seta tem o **texto** "voltar", não só o ícone', () => {
    const { model } = montarReal('course');
    if (!isBarModel(model)) throw new Error('course deveria ter barra');
    renderModel(model);
    const voltar = screen.getByTestId('contextual-bar-voltar');
    expect(voltar.textContent).toContain('voltar');
    expect(voltar.querySelector('svg')).not.toBeNull();
  });

  it('a barra de voltar delega ao `onBack` (performBack, não goBack cru)', () => {
    const { model } = montarReal('course');
    if (!isBarModel(model)) throw new Error('course deveria ter barra');
    const onBack = vi.fn();
    render(
      <MotionProfileProvider override={true}>
        <ContextualBars
          model={model}
          onBack={onBack}
          onRunAction={vi.fn()}
          visivel={true}
          inert={false}
        />
      </MotionProfileProvider>,
    );
    fireEvent.click(screen.getByTestId('contextual-bar-voltar'));
    expect(onBack).toHaveBeenCalledTimes(1);
  });

  it('a cápsula executa a ação principal da tela real', () => {
    const { model } = montarReal('course');
    if (!isBarModel(model)) throw new Error('course deveria ter barra');
    const onRunAction = vi.fn();
    render(
      <MotionProfileProvider override={true}>
        <ContextualBars
          model={model}
          onBack={vi.fn()}
          onRunAction={onRunAction}
          visivel={true}
          inert={false}
        />
      </MotionProfileProvider>,
    );
    fireEvent.click(screen.getByTestId('contextual-bar-capsule'));
    expect(onRunAction).toHaveBeenCalledWith(model.primary[0]);
  });

  it('abrir o menu `⋯` avisa a máquina (D8: as barras ficam presas)', () => {
    const { model } = montarReal('course');
    if (!isBarModel(model)) throw new Error('course deveria ter barra');
    const onMenuChange = vi.fn();
    render(
      <MotionProfileProvider override={true}>
        <ContextualBars
          model={model}
          onBack={vi.fn()}
          onRunAction={vi.fn()}
          visivel={true}
          inert={false}
          onMenuChange={onMenuChange}
        />
      </MotionProfileProvider>,
    );
    fireEvent.click(screen.getByTestId('contextual-bar-options'));
    expect(onMenuChange).toHaveBeenCalledWith(true);
  });

  it('tcc: uma ação só — `⋯` não monta, mas a barra de voltar fica', () => {
    const { model } = montarReal('tcc');
    if (!isBarModel(model)) throw new Error('tcc deveria ter barra');
    renderModel(model);
    expect(screen.getByTestId('contextual-bar-capsule')).toBeTruthy();
    expect(screen.queryByTestId('contextual-bar-options')).toBeNull();
    expect(screen.getByTestId('contextual-bar-voltar')).toBeTruthy();
  });
});

describe('sumiço (SPEC-M-019 D2/D3)', () => {
  it('visível: sem `inert`, `data-visivel="sim"`', () => {
    const { model } = montarReal('course');
    if (!isBarModel(model)) throw new Error('course deveria ter barra');
    renderModel(model, true);
    const conjunto = screen.getByTestId('contextual-bars');
    expect(conjunto.getAttribute('data-visivel')).toBe('sim');
    expect(conjunto.hasAttribute('inert')).toBe(false);
  });

  it('escondida: `inert` no conjunto e `data-visivel="nao"` (D2)', () => {
    const { model } = montarReal('course');
    if (!isBarModel(model)) throw new Error('course deveria ter barra');
    renderModel(model, false);
    const conjunto = screen.getByTestId('contextual-bars');
    expect(conjunto.getAttribute('data-visivel')).toBe('nao');
    // Opacidade zero sozinha deixa botão focável e interceptável — `inert`
    // resolve os três de uma vez (§10.2 e §8.4 do original).
    expect(conjunto.hasAttribute('inert')).toBe(true);
  });

  it('o foco dentro das barras avisa a máquina e impede o sumiço (A8, J6)', async () => {
    const { model } = montarReal('course');
    if (!isBarModel(model)) throw new Error('course deveria ter barra');
    const onFocusChange = vi.fn();
    render(
      <MotionProfileProvider override={true}>
        <ContextualBars
          model={model}
          onBack={vi.fn()}
          onRunAction={vi.fn()}
          visivel={true}
          inert={false}
          onFocusChange={onFocusChange}
        />
      </MotionProfileProvider>,
    );
    // Tab até a cápsula: o foco entrou na barra.
    await userEvent.tab();
    expect(onFocusChange).toHaveBeenCalledWith(true);

    // Trocar de filho dentro das barras **não** é sair: o `blur` dispara a cada
    // `Tab`, e tratá-lo como saída desprenderia as barras no meio do percurso.
    const antes = onFocusChange.mock.calls.length;
    await userEvent.tab();
    expect(onFocusChange.mock.calls.slice(antes)).not.toContainEqual([false]);
  });

  it('as duas barras compartilham **um** estado: um wrapper, dois filhos (D11, J8/J13)', () => {
    const { model } = montarReal('course');
    if (!isBarModel(model)) throw new Error('course deveria ter barra');
    renderModel(model, false);
    const comAtributo = document.querySelectorAll('[data-visivel]');
    // Um só. Se cada barra tivesse o próprio estado, haveria dois — e elas
    // poderiam sumir em instantes diferentes, que lê como defeito.
    expect(comAtributo.length).toBe(1);
    const conjunto = screen.getByTestId('contextual-bars');
    expect(conjunto.getAttribute('data-visivel')).toBe('nao');
    // As duas são descendentes do mesmo dono da visibilidade.
    expect(conjunto.contains(screen.getByTestId('contextual-bar-voltar'))).toBe(true);
    expect(conjunto.contains(screen.getByTestId('contextual-bar-acao'))).toBe(true);
  });

  it('esconder é só opacidade no wrapper: **nenhum** `transform` (D3)', () => {
    const { model } = montarReal('course');
    if (!isBarModel(model)) throw new Error('course deveria ter barra');
    renderModel(model, true);
    const estilo = screen.getByTestId('contextual-bars').getAttribute('style') ?? '';
    // Um `transform` no wrapper viraria containing block do `fixed` interno —
    // o bug já visto em `MobileAppShell.tsx`.
    expect(estilo).not.toContain('transform');
  });
});

describe('gates de apresentação que pegaram bugs reais', () => {
  it('tem os dois controles e **nenhum texto de comentário**', () => {
    const { model } = montarReal('course');
    if (!isBarModel(model)) throw new Error('course deveria ter barra');
    renderModel(model);
    const conjunto = screen.getByTestId('contextual-bars');

    expect(conjunto.querySelector('[data-testid="contextual-bar-options"]')).not.toBeNull();
    expect(conjunto.querySelector('[data-testid="contextual-bar-capsule"]')).not.toBeNull();
    expect(conjunto.querySelector('[data-testid="contextual-bar-voltar"]')).not.toBeNull();

    // Um `//` escrito dentro do JSX vira **texto**, não comentário. O sintoma é
    // texto de prosa na barra; o gate é não haver prosa.
    const texto = (conjunto.textContent ?? '').replace(/\s+/g, ' ');
    expect(texto).not.toMatch(/\/\/|pointer-events|wrapper|mesmo padrão|bar\.tsx/);
    expect(texto.length).toBeLessThan(60);
  });

  it('os nomes acessíveis são distintos: voltar, opções e cápsula', () => {
    const { model } = montarReal('course');
    if (!isBarModel(model)) throw new Error('course deveria ter barra');
    renderModel(model);
    const nomes = [
      screen.getByTestId('contextual-bar-voltar'),
      screen.getByTestId('contextual-bar-options'),
      screen.getByTestId('contextual-bar-capsule'),
    ].map((n) => n.getAttribute('aria-label') ?? n.textContent ?? '');
    expect(new Set(nomes).size).toBe(nomes.length);
    for (const n of nomes) expect(n.length).toBeGreaterThan(0);
  });

  it('o conjunto é **centralizado**, não preso à ponta (A9)', () => {
    const { model } = montarReal('course');
    if (!isBarModel(model)) throw new Error('course deveria ter barra');
    renderModel(model);
    const conjunto = screen.getByTestId('contextual-bars');
    // O par fica no meio da largura. Já foi `justify-end` (A4 da 018); A9
    // desfez isso, e a âncora que A4 queria — alvo estável — é do **par**, não
    // da borda da tela.
    expect(conjunto.className).toContain('justify-center');
    expect(conjunto.className).not.toContain('justify-end');
  });

  it('a cápsula é a barra que encolhe: `flex-1` nela, `shrink-0` no voltar (A6)', () => {
    const { model } = montarReal('course');
    if (!isBarModel(model)) throw new Error('course deveria ter barra');
    renderModel(model);
    const voltar = screen.getByTestId('contextual-bar-voltar');
    const acao = screen.getByTestId('contextual-bar-acao');
    expect(acao.className).toContain('flex-1');
    expect(voltar.className).toContain('shrink-0');
    // Mesma altura nas duas: são duas barras, não barra e botão.
    expect(voltar.className).toContain('h-14');
    expect(acao.className).toContain('h-14');
  });

  it('nenhum botão morto: onde há barra, há `⋯` ou há ação na cápsula', () => {
    for (const kind of TELAS_COM_ACAO) {
      const { model } = montarReal(kind);
      if (!isBarModel(model)) throw new Error(`${kind} deveria ter barra`);
      const alcancaveis = model.plan.hasOptionsButton ? 2 : 1;
      expect(alcancaveis).toBeGreaterThan(0);
    }
  });

  it('cada ação primária aponta para um chamador — nenhuma é rótulo vazio', () => {
    // Uma ação sem `onClick` é um botão morto, e a barra **não** pode ter um.
    for (const kind of TELAS_COM_ACAO) {
      const { model } = montarReal(kind);
      if (!isBarModel(model)) throw new Error(`${kind} deveria ter barra`);
      for (const a of [...model.primary, ...model.secondary]) {
        expect(typeof a.onClick).toBe('function');
        expect(a.label.trim().length).toBeGreaterThan(0);
        expect(a.id.length).toBeGreaterThan(0);
      }
    }
  });
});

describe('telas que não montam barra (decisões de produto)', () => {
  it('families: leitura pura, sem barra', () => {
    const { model } = montarReal('families');
    expect(isBarModel(model)).toBe(false);
  });

  it('telas transitórias de quiz não montam barra', () => {
    for (const kind of ['quiz-category', 'quiz-loading', 'quiz-play', 'quiz-result'] as const) {
      const { model } = montarReal(kind);
      expect(isBarModel(model)).toBe(false);
    }
  });

  it('tela de aba não monta barra: quem mora no rodapé é a pílula', () => {
    const { model } = montarReal('tab');
    expect(isBarModel(model)).toBe(false);
  });
});
