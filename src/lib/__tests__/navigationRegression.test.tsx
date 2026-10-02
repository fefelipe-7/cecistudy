import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MobileAppProvider } from '../../../apps/mobile/src/MobileAppProvider';
import { useMobileApp } from '../../context/mobileApp';

const NavigationProbe = () => {
  const {
    activeTab,
    slideKey,
    handleNavigate,
    openCompose,
    closeCompose,
    openCourseDetail,
    openTermHistory,
  } = useMobileApp();
  return (
    <div>
      <output data-testid="active-tab">{activeTab}</output>
      <output data-testid="slide-key">{slideKey}</output>
      <button type="button" onClick={() => handleNavigate('biblioteca')}>abrir biblioteca</button>
      <button type="button" onClick={() => handleNavigate('home')}>voltar para home</button>
      <button type="button" onClick={() => openCompose()}>abrir composição</button>
      <button type="button" onClick={() => closeCompose()}>fechar composição</button>
      <button type="button" onClick={() => openCourseDetail('c1')}>abrir disciplina</button>
      <button type="button" onClick={() => openTermHistory()}>abrir histórico de períodos</button>
    </div>
  );
};

afterEach(() => {
  cleanup();
  localStorage.clear();
});

beforeEach(() => {
  history.replaceState(null, '', '#/home');
});

describe('regressão da navegação entre abas', () => {
  it('gera uma camada nova ao voltar para Home depois de abrir outra aba', () => {
    render(
      <MobileAppProvider>
        <NavigationProbe />
      </MobileAppProvider>
    );

    const initialKey = screen.getByTestId('slide-key').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'abrir biblioteca' }));
    const libraryKey = screen.getByTestId('slide-key').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'voltar para home' }));
    const homeKey = screen.getByTestId('slide-key').textContent;

    expect(screen.getByTestId('active-tab')).toHaveTextContent('home');
    expect(initialKey).not.toBe(libraryKey);
    expect(libraryKey).not.toBe(homeKey);
    expect(homeKey).not.toBe(initialKey);
  });

  it('mantém a camada de slide estável ao abrir/fechar um overlay (compose)', () => {
    render(
      <MobileAppProvider>
        <NavigationProbe />
      </MobileAppProvider>
    );

    const initialKey = screen.getByTestId('slide-key').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'abrir composição' }));
    const withOverlayKey = screen.getByTestId('slide-key').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'fechar composição' }));
    const afterCloseKey = screen.getByTestId('slide-key').textContent;

    expect(initialKey).toBe(withOverlayKey);
    expect(withOverlayKey).toBe(afterCloseKey);
  });

  it('REGRESSÃO SPEC-007: overlay sobre o detalhe de disciplina não remonta a base', () => {
    render(
      <MobileAppProvider>
        <NavigationProbe />
      </MobileAppProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'abrir disciplina' }));
    const courseKey = screen.getByTestId('slide-key').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'abrir composição' }));
    const withOverlayKey = screen.getByTestId('slide-key').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'fechar composição' }));
    const afterCloseKey = screen.getByTestId('slide-key').textContent;

    // O teste original só cobria `[tab] → [tab, compose]`, onde as duas chaves
    // coincidem por acaso. A partir de um curso, a key antiga virava
    // `tab-faculdade` e o detalhe da disciplina remontava (perdendo a sub-tab).
    expect(courseKey).toBe(withOverlayKey);
    expect(withOverlayKey).toBe(afterCloseKey);
  });

  it('REGRESSÃO SPEC-007 (bug B1): o histórico de períodos troca a camada de slide', () => {
    render(
      <MobileAppProvider>
        <NavigationProbe />
      </MobileAppProvider>
    );

    const beforeKey = screen.getByTestId('slide-key').textContent;
    fireEvent.click(screen.getByRole('button', { name: 'abrir histórico de períodos' }));
    const historyKey = screen.getByTestId('slide-key').textContent;

    // Antes: `termHistory` caía no caso base e, como a pilha é
    // `[perfil, wizard semester, termHistory]`, o guard de overlay impedia o bump
    // de revisão — a tela aparecia sem transição nenhuma.
    expect(historyKey).not.toBe(beforeKey);
    expect(historyKey).toContain('termHistory');
  });
});
