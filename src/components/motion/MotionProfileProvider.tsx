/**
 * Provider do perfil de movimento (SPEC-007 §D4).
 *
 * Uma única fonte para "quanto movimento" o app está usando. O `MotionConfig`
 * continua montado nos entrypoints como **piso de segurança** para o componente
 * que esquecer o perfil — mas a verdade é o `MotionProfile` daqui.
 *
 * ⚠️ Regra de fronteira: este é UI **compartilhada** (usado pela web e por
 * `apps/mobile`), então ele **não** pode ramificar por plataforma (nenhum
 * check de plataforma/ambiente aqui — ver `.github/scripts/check-boundaries.mjs`).
 * O único sinal que ele lê é `prefers-reduced-motion`, que é do sistema, não da
 * plataforma.
 */

import { MotionConfig } from 'framer-motion';
import { createContext, useContext, useMemo, type ReactNode } from 'react';
import {
  DEFAULT_FALLBACK_REDUCED,
  prefersReducedMotion,
  resolveProfile,
  usePrefersReducedMotion,
  type MotionProfile,
} from '@/lib/motion';

const ProfileContext = createContext<MotionProfile | null>(null);

export interface MotionProfileProviderProps {
  children: ReactNode;
  /**
   * Sobrescreve o sinal do sistema. É o gancho do Slice F (toggle no Perfil):
   * `'sistema'` (undefined) deixa o `prefers-reduced-motion` decidir.
   *
   * Hoje o app não tem o toggle, então este prop existe mas é sempre `undefined`.
   * Mantê-lo aqui desde já evita um segundo provider no Slice F.
   */
  override?: boolean | undefined;
}

/**
 * Monta o perfil + o `MotionConfig`.
 *
 * Deliberadamente **sem** branch em `NODE_ENV`: a doc do Motion sugere
 * `reducedMotion={process.env.NODE_ENV === 'production' ? 'user' : 'never'}`, mas
 * isso torna o caminho reduzido **não testável em dev** — exatamente onde a
 * usuária development/testa. O piso de segurança é o `MotionConfig`; o
 * comportamento vem do perfil.
 */
export function MotionProfileProvider({ children, override }: MotionProfileProviderProps) {
  const systemReduced = usePrefersReducedMotion();
  const reduced = override ?? systemReduced ?? DEFAULT_FALLBACK_REDUCED;

  const profile = useMemo(() => resolveProfile(reduced), [reduced]);

  return (
    <MotionConfig reducedMotion={reduced ? 'always' : 'never'}>
      <ProfileContext.Provider value={profile}>
        {/*
          `data-motion` é seam de teste e hook de CSS: permite matar as
          transições de CSS numa regra só quando o movimento está reduzido
          (`[data-motion="reduced"] * { transition-duration: 1ms !important }`).
        */}
        <div data-motion={reduced ? 'reduced' : 'full'} className="contents">
          {children}
        </div>
      </ProfileContext.Provider>
    </MotionConfig>
  );
}

/**
 * Perfil de movimento atual. Cai no perfil completo fora do provider (ex.: um
 * componente 3D isolado num teste) — nunca em "sem movimento" silencioso.
 */
export function useMotionProfile(): MotionProfile {
  return useContext(ProfileContext) ?? resolveProfile(prefersReducedMotion());
}
