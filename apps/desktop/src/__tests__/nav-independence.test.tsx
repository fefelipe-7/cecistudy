import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { DesktopAppProvider } from '../DesktopAppProvider';
import { MobileAppProvider } from '../../../../apps/mobile/src/MobileAppProvider';
import { useDesktopApp } from '@/context/desktopApp';
import { useMobileApp } from '@/context/mobileApp';

/**
 * Independência das pilhas de navegação por casca (spec 07 §Phase 5 / T7).
 *
 * O desktop e o mobile instanciam motores de navegação PRÓPRIOS
 * (`useDesktopNavigation`/`useMobileNavigation` → `useNavigationEngine`), cada
 * um com a sua pilha. Abrir uma nota na pilha do desktop NÃO pode alterar o
 * estado de navegação consumido pela casca mobile (e vice-versa) — mesmo com
 * os dois providers montados lado a lado no mesmo render.
 */
const DesktopProbe = () => {
  const { activeTab, isNotesScreenOpen, openNotesScreen, closeNotesScreen } = useDesktopApp();
  return (
    <div>
      <output data-testid="desktop-tab">{activeTab}</output>
      <output data-testid="desktop-notes">{String(isNotesScreenOpen)}</output>
      <button type="button" onClick={() => openNotesScreen()}>
        abrir nota (desktop)
      </button>
      <button type="button" onClick={() => closeNotesScreen()}>
        fechar nota (desktop)
      </button>
    </div>
  );
};

const MobileProbe = () => {
  const { activeTab, isNotesScreenOpen } = useMobileApp();
  return (
    <div>
      <output data-testid="mobile-tab">{activeTab}</output>
      <output data-testid="mobile-notes">{String(isNotesScreenOpen)}</output>
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

describe('independência das pilhas de navegação desktop ⇄ mobile', () => {
  it('abrir nota no desktop não muda a pilha do mobile', () => {
    render(
      <DesktopAppProvider>
        <DesktopProbe />
        <MobileAppProvider>
          <MobileProbe />
        </MobileAppProvider>
      </DesktopAppProvider>
    );

    expect(screen.getByTestId('desktop-tab')).toHaveTextContent('home');
    expect(screen.getByTestId('desktop-notes')).toHaveTextContent('false');
    expect(screen.getByTestId('mobile-tab')).toHaveTextContent('home');
    expect(screen.getByTestId('mobile-notes')).toHaveTextContent('false');

    fireEvent.click(screen.getByRole('button', { name: 'abrir nota (desktop)' }));

    // O desktop abriu a nota na SUA pilha (base canônica `biblioteca`)…
    expect(screen.getByTestId('desktop-notes')).toHaveTextContent('true');
    expect(screen.getByTestId('desktop-tab')).toHaveTextContent('biblioteca');
    // …mas o mobile permanece na aba home sem tela auxiliar
    expect(screen.getByTestId('mobile-notes')).toHaveTextContent('false');
    expect(screen.getByTestId('mobile-tab')).toHaveTextContent('home');
  });

  it('as pilhas das duas cascas navegam de forma independente após fechar no desktop', () => {
    render(
      <DesktopAppProvider>
        <DesktopProbe />
        <MobileAppProvider>
          <MobileProbe />
        </MobileAppProvider>
      </DesktopAppProvider>
    );

    fireEvent.click(screen.getByRole('button', { name: 'abrir nota (desktop)' }));
    expect(screen.getByTestId('desktop-notes')).toHaveTextContent('true');
    expect(screen.getByTestId('mobile-notes')).toHaveTextContent('false');

    fireEvent.click(screen.getByRole('button', { name: 'fechar nota (desktop)' }));

    // o desktop volta à base canônica (biblioteca) e o mobile permanece intacto
    expect(screen.getByTestId('desktop-notes')).toHaveTextContent('false');
    expect(screen.getByTestId('desktop-tab')).toHaveTextContent('biblioteca');
    expect(screen.getByTestId('mobile-notes')).toHaveTextContent('false');
    expect(screen.getByTestId('mobile-tab')).toHaveTextContent('home');
  });
});