import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { Mascote } from './Mascote';
import { ProgressBar } from './ProgressBar';
import {
  runBootPreload,
  scheduleIdlePrefetch,
  type BootState,
  type BootStepId,
} from '../../lib/bootPreload';
import { mark, recordEvent, flushDevMetrics } from '../../lib/performance/perfMarks';
import { prefersReducedMotion } from '../../lib/motion';
import { BASE_D } from '../../lib/motion/tokens';

const MIN_DISPLAY_MS = 1600;
const MAX_DISPLAY_MS = 7000;
const FADE_MS = BASE_D.overlay * 1000;
const PHRASE_INTERVAL_MS = 2200;
const TICK_MS = 120;

/** Etapas do grupo crítico — a barra mostra SÓ este progresso (spec §2.3). */
const CRITICAL_STEPS: readonly BootStepId[] = ['theme', 'user-db', 'user-state'];

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

/** Fração do grupo crítico (done/skipped/error contam como resolvidos). */
function criticalFraction(state: BootState | null): number {
  if (!state) return 0;
  const resolved = CRITICAL_STEPS.filter(
    (id) => state.steps[id].status !== 'pending' && state.steps[id].status !== 'running',
  ).length;
  return resolved / CRITICAL_STEPS.length;
}

/**
 * Splash de boot com a mascote e barra de progresso do CAMINHO CRÍTICO.
 *
 * Sai quando `criticalReady` (tema + banco da usuária + estado mínimo)
 * terminar — não espera catálogo, questões ou chunks profundos (spec §2.3).
 * O teto `MAX_DISPLAY_MS` continua como último escape, mas registra o motivo
 * quando aciona. Em erro de etapa crítica o app é liberado em modo degradado
 * (o caminho degradado já existe por design — a falha fica em `errors`).
 */
export const BootSplash: React.FC = () => {
  const [phase, setPhase] = useState<Phase>('show');
  const [fraction, setFraction] = useState(0);
  const [phraseIdx, setPhraseIdx] = useState(() => Math.floor(Math.random() * BOOT_PHRASES.length));
  const bootStateRef = useRef<BootState | null>(null);
  const startedAtRef = useRef(Date.now());
  const reducedMotion = useRef(prefersReducedMotion());

  // Boot progressivo em background — deduplicado (StrictMode reutiliza a
  // mesma pipeline); o provider reaproveita as promises memoizadas.
  useEffect(() => {
    let cancelled = false;
    runBootPreload((state: BootState) => {
      if (cancelled) return;
      bootStateRef.current = state;
      setFraction(Math.round(criticalFraction(state) * 100) / 100);
    }).then((state) => {
      if (cancelled) return;
      bootStateRef.current = state;
      setFraction(Math.round(criticalFraction(state) * 100) / 100);
      scheduleIdlePrefetch();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Saída: tempo mínimo E caminho crítico pronto — OU teto de segurança
  // (registrando o motivo). Deferred/opportunistic não seguram a splash.
  useEffect(() => {
    if (phase !== 'show') return;
    const timer = window.setInterval(() => {
      const elapsed = Date.now() - startedAtRef.current;
      const state = bootStateRef.current;
      if (elapsed >= MIN_DISPLAY_MS && state?.criticalReady) {
        window.clearInterval(timer);
        setPhase('fade');
      } else if (elapsed >= MAX_DISPLAY_MS) {
        window.clearInterval(timer);
        recordEvent('boot-max-display-escape', {
          elapsed,
          criticalReady: state?.criticalReady ?? false,
          errors: state?.errors.map((e) => e.step) ?? [],
        });
        console.warn('[BootSplash] teto de segurança acionado antes do caminho crítico terminar');
        setPhase('fade');
      }
    }, TICK_MS);
    return () => window.clearInterval(timer);
  }, [phase]);

  useEffect(() => {
    if (phase !== 'fade') return;
    const timer = window.setTimeout(() => {
      // Splash removida = primeira interação possível (spec-performance, Fase 1).
      mark('interactive-ready');
      flushDevMetrics();
      setPhase('done');
    }, FADE_MS);
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
          reducedMotion.current ? undefined : { duration: 2.2, repeat: Infinity, ease: 'easeInOut' }
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
