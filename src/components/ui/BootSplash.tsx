import React, { useEffect, useRef, useState } from 'react';

const MIN_DISPLAY_MS = 2600;
const FADE_MS = 450;

type Phase = 'show' | 'fade' | 'done';

const initialPhase = (): Phase => {
  if (typeof window === 'undefined') return 'done';
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'done';
  return 'show';
};

/**
 * Splash de carregamento animada (vídeo da mascote) exibida uma vez por
 * abertura do app, por cima de tudo. Some com fade após alguns segundos —
 * sem bloquear a interação por muito tempo.
 */
export const BootSplash: React.FC = () => {
  const [phase, setPhase] = useState<Phase>(initialPhase);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (phase !== 'show') return;
    const timer = window.setTimeout(() => setPhase('fade'), MIN_DISPLAY_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'fade') return;
    videoRef.current?.pause();
    const timer = window.setTimeout(() => setPhase('done'), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      aria-hidden
      className="fixed inset-0 z-[100] flex items-center justify-center overflow-hidden pointer-events-none transition-opacity ease-out"
      style={{
        backgroundColor: '#fef6eb',
        opacity: phase === 'fade' ? 0 : 1,
        transitionDuration: `${FADE_MS}ms`,
      }}
    >
      <video
        ref={videoRef}
        src="./splash.mp4"
        autoPlay
        muted
        playsInline
        preload="auto"
        className="h-full w-auto min-w-full object-cover"
      />
    </div>
  );
};
