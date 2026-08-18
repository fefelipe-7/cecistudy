import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Kitty } from '../ui/Kitty';
import { useApp } from '../../context/AppContext';
import { buildQuizPool } from '../../lib/quizLogic';
import type { QuizConfig, StudyQuestion } from '../../types';

interface QuizLoadingScreenProps {
  config: QuizConfig;
  onReady: (pool: StudyQuestion[], config: QuizConfig) => void;
  onCancel: () => void;
}

/** Splash transitório: garante o acervo em memória e só então abre o quiz. */
export const QuizLoadingScreen: React.FC<QuizLoadingScreenProps> = ({ config, onReady, onCancel }) => {
  const { ensureQuestionsLoaded, showToast } = useApp();
  const [message, setMessage] = useState('escrevendo suas questões...');

  useEffect(() => {
    let cancelled = false;

    const prepare = async () => {
      try {
        const bank = await ensureQuestionsLoaded();
        if (cancelled) return;
        const pool = buildQuizPool(bank, config);
        if (pool.length === 0) {
          if (!cancelled) {
            showToast('nenhuma questão com esses filtros ♡');
            onCancel();
          }
          return;
        }
        // Pequena pausa para o splash respirar (senão o quiz abre na hora).
        await new Promise((r) => setTimeout(r, 700));
        if (!cancelled) onReady(pool, config);
      } catch {
        if (!cancelled) {
          showToast('não consegui preparar o quiz, tenta de novo ♡');
          onCancel();
        }
      }
    };

    void prepare();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const t = setTimeout(() => setMessage('só um minutinho, guardando as cartas...'), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 text-center px-6">
      <Kitty expression="curiosa" className="w-16 h-16" decorative />
      <div>
        <h3 className="font-display font-bold text-lg text-ceci-primary">escrevendo suas questões ♡</h3>
        <p className="text-xs text-ceci-secondary mt-2">{message}</p>
      </div>
      <div className="mt-2 flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.span
            key={i}
            className="w-2 h-2 rounded-full bg-ceci-brand-strong"
            animate={{ opacity: [0.25, 1, 0.25], y: [0, -3, 0] }}
            transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
    </div>
  );
};
