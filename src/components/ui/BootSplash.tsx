import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mascote } from './Mascote';
import { ProgressBar } from './ProgressBar';
import {
  runBootPreload,
  scheduleIdlePrefetch,
  type BootProgress,
} from '../../lib/bootPreload';

const MIN_DISPLAY_MS = 1600;
const MAX_DISPLAY_MS = 7000;
const FADE_MS = 450;
const PHRASE_INTERVAL_MS = 2200;
const TICK_MS = 120;

type Phase = 'show' | 'fade' | 'done';

/** Frases gentis do arranque (lowercase, tom do cantinho). */
const BOOT_PHRASES = [
  'esvaziando os lixinhos ♡',
  'colocando os livros nas prateleiras',
  'tirando a poeira das notas',
  'alinhando os flashcards',
  'separando os marcadores de página',
  'arrumando a mesinha de estudos',
  'guardando os conceitos no lugar',
  'regando as plantinhas do templo',
  'apontando os lápis… prontinho ✨',
  'deixando tudo fofinho pra você ♡',
];

const prefersReducedMotion = (): boolean =>
  typeof window !== 'undefined' &&
  window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Splash de boot com a mascote e barra de progresso REAL: cada passo da
 * pré-carga (SQLite, catálogos, chunks) alimenta a barra. Bloqueia a
 * interação até a preparação terminar — com tempo mínimo de exibição e
 * teto de segurança pra nunca prender a usuária.
 */
export const BootSplash: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('show');
  const [fraction, setFraction] = useState(0);
  const [phraseIdx, setPhraseIdx] = useState(
    () => Math.floor(Math.random() * BOOT_PHRASES.length)
  );
  const preloadDoneRef = useRef(false);
  const startedAtRef = useRef(Date.now());
  const reducedMotion = useRef(prefersReducedMotion());

  // Pré-carga real em background — o AppContext reaproveita estas promises.
  useEffect(() => {
    let cancelled = false;
    const finish = () => {
      if (!cancelled) preloadDoneRef.current = true;
    };
    runBootPreload((p: BootProgress) => {
      if (cancelled) return;
      setFraction(Math.round(p.fraction * 100) / 100);
      if (p.done >= p.total && p.total > 0) finish();
    }).then(() => {
      finish();
      if (!cancelled) scheduleIdlePrefetch();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Saída: tempo mínimo E (pré-carga concluída OU teto de segurança).
  useEffect(() => {
    if (phase !== 'show') return;
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      if (
        elapsed >= MIN_DISPLAY_MS &&
        (preloadDoneRef.current || elapsed >= MAX_DISPLAY_MS)
      ) {
        window.clearInterval(timer);
        setPhase('fade');
      }
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'fade') return;
    const timer = window.setTimeout(() => setPhase('done'), FADE_MS);
    return () => window.clearTimeout(timer);
  }, [phase]);

  // Frases rotativas enquanto a splash está visível.
  useEffect(() => {
    if (phase === 'done') return;
    const timer = window.setInterval(() => {
      setPhraseIdx((i) => (i + 1) % BOOT_PHRASES.length);
    }, PHRASE_INTERVAL_MS);
    return () => window.clearInterval(timer);
  }, [phase]);

  if (phase === 'done') return null;

  return (
    <div
      role="status"
      aria-label="preparando o cantinho"
      className="fixed inset-0 z-[100] flex flex-col items-center justify-center overflow-hidden transition-opacity ease-out"
      style={{
        backgroundColor: '#fef6eb',
        opacity: phase === 'fade' ? 0 : 1,
        transitionDuration: `${FADE_MS}ms`,
      }}
    >
      <motion.div
        animate={reducedMotion.current ? undefined : { y: [0, -9, 0] }}
        transition={
          reducedMotion.current
            ? undefined
            : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
        }
        className="flex items-center justify-center"
      >
        <Mascote
          expression="loading-patient"
          decorative
          className="h-36 w-36 object-contain sm:h-44 sm:w-44"
        />
      </motion.div>

      <p className="mt-6 px-8 text-center text-sm font-medium text-ceci-secondary">
        {BOOT_PHRASES[phraseIdx]}
      </p>

      <div className="mt-4 w-48">
        <ProgressBar value={fraction * 100} />
      </div>
    </div>
  );
};
