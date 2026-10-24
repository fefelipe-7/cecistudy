import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { useEffect } from 'react';
import { MobileAppProvider } from '../../../../apps/mobile/src/MobileAppProvider';
import { InternshipCaseView } from '../../views/InternshipCaseView';
import { useMobileApp } from '../../../context/mobileApp';
import { ContextualBottomBar } from '../../ui/ContextualBottomBar';

/** A barra real, montada com a config que o motor calcula para a tela. */
const Barra = () => {
  const { contextBarConfig } = useMobileApp();
  return <ContextualBottomBar config={contextBarConfig} onBack={() => {}} />;
};

/** Abre a tela do caso (sem iniciais) para a barra ter contexto. */
const Seed = () => {
  const { openInternshipCase } = useMobileApp();
  useEffect(() => {
    openInternshipCase('');
  }, [openInternshipCase]);
  return null;
};

// SPEC-010 I1/D3: a tela do Caso é superfície própria — exatamente um hero.
//
// A **primária** mudou de dono em 2026-10-19 (SPEC-022 D2-ii): o herói do
// Estágio cedeu a ação para a barra contextual, que a executa com a mesma
// semente (`openInternshipCaseSession`). O herói fica com identidade e resumo.

beforeEach(() => {
  history.replaceState(null, '', '#/home');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('InternshipCaseView — hero de paciente (SPEC-010 D1/D3 · SPEC-022 D2)', () => {
  it('renderiza exatamente um hero-card com iniciais ausentes', () => {
    render(
      <MobileAppProvider>
        <InternshipCaseView />
      </MobileAppProvider>
    );
    expect(screen.getAllByTestId('hero-card')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'sem iniciais' })).toBeInTheDocument();
  });

  it('o herói não repete a primária (a barra contextual é a dona)', () => {
    render(
      <MobileAppProvider>
        <InternshipCaseView />
      </MobileAppProvider>
    );
    const hero = screen.getByTestId('hero-card');
    expect(within(hero).queryByRole('button', { name: 'nova sessão' })).toBeNull();
  });

  it('a barra contextual do caso oferece "nova sessão"', () => {
    render(
      <MobileAppProvider>
        <Seed />
        <InternshipCaseView />
        <Barra />
      </MobileAppProvider>
    );
    expect(screen.getByTestId('contextual-bar-primary')).toHaveTextContent('nova sessão');
  });

});
