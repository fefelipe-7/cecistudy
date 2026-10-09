import { cleanup, render, screen, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MobileAppProvider } from '../../../../apps/mobile/src/MobileAppProvider';
import { InternshipCaseView } from '../../views/InternshipCaseView';

// SPEC-010 I1/D3: a tela do Caso é superfície própria — exatamente um hero,
// com a ação primária ("nova sessão") no canto do hero e não na barra de baixo.

beforeEach(() => {
  history.replaceState(null, '', '#/home');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('InternshipCaseView — hero de paciente (SPEC-010 D1/D3)', () => {
  it('renderiza exatamente um hero-card com iniciais ausentes', () => {
    render(
      <MobileAppProvider>
        <InternshipCaseView />
      </MobileAppProvider>
    );
    expect(screen.getAllByTestId('hero-card')).toHaveLength(1);
    expect(screen.getByRole('heading', { level: 1, name: 'sem iniciais' })).toBeInTheDocument();
  });

  it('move a ação primária para o hero', () => {
    render(
      <MobileAppProvider>
        <InternshipCaseView />
      </MobileAppProvider>
    );
    const hero = screen.getByTestId('hero-card');
    expect(within(hero).getByRole('button', { name: 'nova sessão' })).toBeInTheDocument();
  });

  it('usa accent blue (tela empilhada, contexto de uma pessoa)', () => {
    render(
      <MobileAppProvider>
        <InternshipCaseView />
      </MobileAppProvider>
    );
    expect(screen.getByTestId('hero-card').className).toContain('to-surface-blue');
  });
});
