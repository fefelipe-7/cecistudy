import { useCallback, useEffect, useMemo, useRef, type ReactNode } from 'react';
import { RevealContext, type RevealContextValue } from '@/lib/motion';
import { useMotionProfile } from './MotionProfileProvider';

/**
 * Um `IntersectionObserver` para o app inteiro (SPEC-M-027 F5.1).
 *
 * Uma lista de 100 itens com um observer cada são 100 observers vivos durante
 * o scroll. Aqui é um só, com um `Map` de elemento → callback; o item se
 * desinscreve assim que entra (o reveal é uma vez só).
 *
 * Sem `IntersectionObserver` (jsdom, WebView antigo) ou no perfil reduzido, o
 * contexto fica `enabled: false` e o `Reveal` vira uma `div` comum: o conteúdo
 * aparece, só não anima.
 */
export function RevealProvider({ children }: { children: ReactNode }) {
  const { reduced } = useMotionProfile();
  const callbacks = useRef(new Map<Element, (intersecting: boolean) => void>());
  const observer = useRef<IntersectionObserver | null>(null);

  const observe = useCallback<RevealContextValue['observe']>((element, onIntersect) => {
    if (typeof IntersectionObserver === 'undefined') return () => {};

    if (!observer.current) {
      observer.current = new IntersectionObserver((entries) => {
        for (const entry of entries) {
          callbacks.current.get(entry.target)?.(entry.isIntersecting);
        }
      });
    }

    callbacks.current.set(element, onIntersect);
    observer.current.observe(element);

    return () => {
      callbacks.current.delete(element);
      observer.current?.unobserve(element);
    };
  }, []);

  // O observer é do provider: morre com ele.
  useEffect(() => () => observer.current?.disconnect(), []);

  const value = useMemo<RevealContextValue>(
    () => ({ enabled: !reduced && typeof IntersectionObserver !== 'undefined', observe }),
    [reduced, observe],
  );

  return <RevealContext.Provider value={value}>{children}</RevealContext.Provider>;
}
