import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { BookOpen, ChevronRight, Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { Mascote } from '../ui/Mascote';
import { FixedBottomBar } from '../ui/FixedBottomBar';
import { buildQuizGroups } from '../../data/quizGroups';
import type { QuestionGroup } from '../../types';

interface QuizGroupSelectorProps {
  onSelectGroup: (group: QuestionGroup) => void;
  onClose: () => void;
}

export const QuizGroupSelector: React.FC<QuizGroupSelectorProps> = ({
  onSelectGroup,
  onClose,
}) => {
  const [groups, setGroups] = useState<QuestionGroup[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    buildQuizGroups().then((g) => {
      if (!cancelled) {
        setGroups(g);
        setLoading(false);
      }
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, []);

  // Ordena: banco "all" primeiro, depois alfabética
  const sorted = useMemo(
    () =>
      [...groups].sort((a, b) => {
        if (a.id === 'all') return -1;
        if (b.id === 'all') return 1;
        return a.name.localeCompare(b.name, 'pt-BR');
      }),
    [groups]
  );

  const handleClick = useCallback((group: QuestionGroup) => {
    if (group.questionCount > 0) onSelectGroup(group);
  }, [onSelectGroup]);

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <div className="flex flex-col items-center gap-3 text-center">
          <Loader2 className="w-7 h-7 animate-spin text-ceci-brand-strong" />
          <p className="text-xs text-ceci-secondary">carregando questões...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[70vh] flex flex-col pb-44">
      <div className="flex-1 pt-4 overflow-y-auto">
        <div className="max-w-md sm:max-w-xl mx-auto px-3.5 sm:px-5 space-y-3">
          {/* Card explicativo compacto */}
          <div
            className="rounded-xl p-4 bg-surface-default border border-ceci-border-default shadow-sm text-center space-y-2"
          >
            <Mascote expression="quiz-ready" className="w-10 h-10 mx-auto" decorative />
            <div>
              <h3 className="font-display font-bold text-base text-ceci-primary">escolha um tema ♡</h3>
              <p className="text-[11px] text-ceci-secondary mt-1 leading-relaxed">
                selecione um grupo de questões para começar
              </p>
            </div>
          </div>

          {/* Lista compacta de cards */}
          <div className="space-y-2">
            <AnimatePresence>
              {sorted.map((group, i) => {
                const isGeral = group.id === 'all';
                return (
                  <motion.button
                    key={group.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.03, duration: 0.2 }}
                    onClick={() => handleClick(group)}
                    disabled={group.questionCount === 0}
                    className={cn(
                      'w-full flex items-center gap-3 p-4 rounded-xl border text-left transition active:scale-[0.98]',
                      isGeral
                        ? 'bg-surface-default border-ceci-border-default shadow-sm'
                        : 'bg-surface-default border-ceci-border-subtle',
                      group.questionCount > 0
                        ? 'hover:bg-surface-rose hover:border-ceci-border-brand cursor-pointer'
                        : 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <span
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg flex-shrink-0 bg-surface-rose border border-ceci-border-brand"
                      aria-hidden
                    >
                      {group.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <span className="font-display font-bold text-sm text-ceci-primary block truncate">
                        {group.name}
                      </span>
                      <span className="text-[11px] text-ceci-secondary block mt-0.5">
                        {group.questionCount > 0
                          ? `${group.questionCount} questões`
                          : 'sem questões'}
                      </span>
                    </div>
                    {group.questionCount > 0 && (
                      <ChevronRight className="w-4 h-4 text-ceci-muted flex-shrink-0" />
                    )}
                  </motion.button>
                );
              })}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Rodapé fixo */}
      <FixedBottomBar>
        <div className="max-w-md sm:max-w-xl mx-auto px-3.5 sm:px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <button
            onClick={onClose}
            className="w-full min-h-[40px] rounded-xl text-xs font-medium text-ceci-tertiary hover:text-ceci-primary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            cancelar
          </button>
        </div>
      </FixedBottomBar>
    </div>
  );
};

