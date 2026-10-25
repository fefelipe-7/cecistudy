/**
 * `MotionProfileProvider` — o `override` vence o sistema (SPEC-M-027 D9).
 *
 * O toggle do Perfil precisa conseguir **forçar** movimento completo mesmo com
 * o aparelho pedindo reduzido, e vice-versa. Sem isso a escolha da usuária não
 * teria efeito onde ela mais importa.
 */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { MotionProfileProvider, useMotionProfile } from '../MotionProfileProvider';

const Probe = () => {
  const profile = useMotionProfile();
  return <output data-testid="reduced">{String(profile.reduced)}</output>;
};

const stubSystemReduced = (matches: boolean) => {
  vi.stubGlobal('matchMedia', (query: string) => ({
    matches: query.includes('prefers-reduced-motion') ? matches : false,
    media: query,
    addEventListener: () => {},
    removeEventListener: () => {},
  }));
};

const renderWith = (override?: boolean) => {
  const view = render(
    <MotionProfileProvider override={override}>
      <Probe />
    </MotionProfileProvider>,
  );
  return {
    reduced: screen.getByTestId('reduced').textContent,
    motion: view.container.querySelector('[data-motion]')?.getAttribute('data-motion'),
  };
};

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

describe('MotionProfileProvider — override', () => {
  it('sistema pede reduzido, mas a escolha é "completo": movimento completo', () => {
    stubSystemReduced(true);
    expect(renderWith(false)).toEqual({ reduced: 'false', motion: 'full' });
  });

  it('sistema não pede, mas a escolha é "reduzido": reduzido', () => {
    stubSystemReduced(false);
    expect(renderWith(true)).toEqual({ reduced: 'true', motion: 'reduced' });
  });

  it('sem override, quem decide é o sistema', () => {
    stubSystemReduced(true);
    expect(renderWith(undefined)).toEqual({ reduced: 'true', motion: 'reduced' });
  });
});
