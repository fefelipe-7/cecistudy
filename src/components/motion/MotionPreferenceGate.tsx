/**
 * Liga a preferência de movimento (SPEC-M-027 D9) ao `MotionProfileProvider`.
 *
 * Fica nos entrypoints, **acima** do shell e dos overlays: assim o perfil vale
 * para a casca e também para os modais, que são irmãos do shell (`src/App.tsx`).
 * O provider em si continua sem depender de contexto de app — ele só recebe
 * `override`.
 */
import type { ReactNode } from 'react';
import { useDataClientApp } from '@/context/DataClientProvider';
import { motionPrefOverride } from '@/lib/motion';
import { MotionProfileProvider } from './MotionProfileProvider';

export function MotionPreferenceGate({ children }: { children: ReactNode }) {
  const { motionPref } = useDataClientApp();
  return (
    <MotionProfileProvider override={motionPrefOverride(motionPref)}>
      {children}
    </MotionProfileProvider>
  );
}
