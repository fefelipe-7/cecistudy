import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MobileAppProvider } from '../../../../apps/mobile/src/MobileAppProvider';
import { useMobileApp } from '../../../context/mobileApp';
import { InternshipDiaryView } from '../../views/InternshipDiaryView';

// SPEC-010 I1: cada superfície do Estágio renderiza exatamente UM `HeroCard`,
// inclusive na aba supervisão — e a aba não tem mais cabeçalho próprio (D3):
// trocar de aba muda o conteúdo do hero, não a identidade do topo.

const TabSwitcher = () => {
  const { openInternshipDiary } = useMobileApp();
  return (
    <div>
      <button type="button" onClick={() => openInternshipDiary('pacientes')}>
        ver pacientes
      </button>
      <button type="button" onClick={() => openInternshipDiary('supervisao')}>
        ver supervisão
      </button>
    </div>
  );
};

const renderDiario = () =>
  render(
    <MobileAppProvider>
      <InternshipDiaryView />
      <TabSwitcher />
    </MobileAppProvider>,
  );

beforeEach(() => {
  history.replaceState(null, '', '#/home');
});

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe('InternshipDiaryView — hero único (SPEC-010 D1/D3)', () => {
  it('mantém exatamente um hero-card em todas as abas, sem cabeçalho secundário', () => {
    renderDiario();
    expect(screen.getAllByTestId('hero-card')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'ver pacientes' }));
    expect(screen.getAllByTestId('hero-card')).toHaveLength(1);
    expect(screen.getByText('0 pacientes')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'ver supervisão' }));
    expect(screen.getAllByTestId('hero-card')).toHaveLength(1);
    expect(screen.getByText('0 encontros')).toBeInTheDocument();
    // o cabeçalho antigo da aba (h2 "supervisão") saiu — só o hero topo
    expect(screen.queryByRole('heading', { level: 2, name: 'supervisão' })).not.toBeInTheDocument();
  });
});
