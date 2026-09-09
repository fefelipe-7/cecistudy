import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { MobileAppProvider } from '../../../apps/mobile/src/MobileAppProvider';
import { useMobileApp } from '../../context/mobileApp';

const NavigationProbe = () => {
  const { activeTab, slideKey, handleNavigate } = useMobileApp();
  return (
    <div>
      <output data-testid="active-tab">{activeTab}</output>
      <output data-testid="slide-key">{slideKey}</output>
      <button type="button" onClick={() => handleNavigate('biblioteca')}>abrir biblioteca</button>
      <button type="button" onClick={() => handleNavigate('home')}>voltar para home</button>
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
});
