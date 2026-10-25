import React, { useEffect, useRef, useState } from 'react';
import { TOKENS } from '@/lib/motion';
import { cn } from '@/lib/utils';
import { useMotionProfile } from './MotionProfileProvider';

interface AmbientProps {
  className?: string;
  children: React.ReactNode;
}

/**
 * Movimento ambiente (SPEC-M-027 D13): deriva lenta em elemento **pequeno** e
 * decorativo. É CSS puro — animação de compositor, zero `requestAnimationFrame`,
 * zero JS por frame.
 *
 * Pausa por `animation-play-state`, não por desmontar a animação: pausar não
 * reinicia a fase, então o elemento não "salta" ao voltar.
 *
 * Três desligamentos, e nenhum é opcional:
 * - perfil reduzido → nem monta a classe (elemento estático);
 * - aba oculta (`document.hidden`) → pausa (loop em aba oculta é o dreno clássico
 *   de WebView);
 * - fora do viewport → pausa (o elemento pode estar numa tela empilhada).
 *
 * Nunca em tela de leitura longa: quem monta decide, e as telas de leitura não
 * montam.
 */
export const Ambient: React.FC<AmbientProps> = ({ className, children }) => {
  const { reduced } = useMotionProfile();
  const ref = useRef<HTMLDivElement>(null);
  const [onScreen, setOnScreen] = useState(true);
  const [tabHidden, setTabHidden] = useState(false);

  useEffect(() => {
    const read = () => setTabHidden(document.visibilityState === 'hidden');
    read();
    document.addEventListener('visibilitychange', read);
    return () => document.removeEventListener('visibilitychange', read);
  }, []);

  useEffect(() => {
    const element = ref.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      setOnScreen(entries[0]?.isIntersecting ?? true);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn(
        reduced ? undefined : 'ambient',
        (reduced || tabHidden || !onScreen) && 'ambient-paused',
        className,
      )}
      style={reduced ? undefined : { animationDuration: `${TOKENS.ambient.duration}s` }}
    >
      {children}
    </div>
  );
};
