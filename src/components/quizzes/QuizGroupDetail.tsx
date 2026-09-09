import React, { useCallback } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, BookOpen, Users, FlaskConical, Brain, BarChart3 } from 'lucide-react';
import { cn } from '../../lib/utils';
import type { QuestionGroup } from '../../types';

interface QuizGroupDetailProps {
  group: QuestionGroup;
  onBack: () => void;
  onStart: (group: QuestionGroup) => void;
}

function StatRow({ icon, label, value }: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div className="flex items-center gap-2.5 py-2">
      <span className="w-7 h-7 rounded-xl bg-surface-blue border border-ceci-border-academic flex items-center justify-center text-ceci-academic-strong text-xs flex-shrink-0">
        {icon}
      </span>
      <div className="min-w-0">
        <span className="text-[11px] text-ceci-secondary block leading-tight">{label}</span>
        <span className="text-xs font-semibold text-ceci-primary block truncate">{value}</span>
      </div>
    </div>
  );
}

export const QuizGroupDetail: React.FC<QuizGroupDetailProps> = ({
  group,
  onBack,
  onStart,
}) => {
  const handleStart = useCallback(() => {
    onStart(group);
  }, [group, onStart]);

  const areaTags = group.areas.slice(0, 3).join(', ');
  const approachTags = group.approaches.slice(0, 3).join(', ');
  const authorList = group.authors.slice(0, 5);
  const hasMoreAuthors = group.authors.length > 5;

  return (
    <div className="min-h-[70vh] flex flex-col">
      {/* Corpo */}
      <div className="flex-1 pt-4 overflow-y-auto">
        <div className="max-w-md sm:max-w-xl mx-auto px-3.5 sm:px-5 space-y-4">
          {/* Card de volta (substituto do header detail) */}
          <button
            onClick={onBack}
            className="flex items-center gap-2 py-1 text-xs text-ceci-secondary hover:text-ceci-primary transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
            voltar para temas
          </button>

          {/* Hero card */}
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
            className="rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm text-center space-y-3"
          >
            <span className="text-4xl" aria-hidden>{group.icon}</span>
            <div>
              <h3 className="font-display font-bold text-lg text-ceci-primary">{group.name}</h3>
              <p className="text-xs text-ceci-secondary mt-1.5 leading-relaxed">{group.description}</p>
            </div>
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-surface-rose border border-ceci-border-brand">
              <BookOpen className="w-3.5 h-3.5 text-ceci-brand-strong" />
              <span className="text-xs font-semibold text-ceci-brand-strong">
                {group.questionCount} questões
              </span>
            </div>
          </motion.div>

          {/* Estatísticas */}
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05, duration: 0.2 }}
            className="rounded-xl p-4 bg-surface-default border border-ceci-border-default shadow-sm space-y-1"
          >
            <StatRow
              icon={<BookOpen className="w-3.5 h-3.5" />}
              label="questões"
              value={group.questionCount}
            />
            {(group.approaches.length > 0 || group.areas.length > 0) && (
              <StatRow
                icon={<FlaskConical className="w-3.5 h-3.5" />}
                label="abordagens / áreas"
                value={approachTags || areaTags || '—'}
              />
            )}
            {group.authors.length > 0 && (
              <StatRow
                icon={<Users className="w-3.5 h-3.5" />}
                label="autores envolvidos"
                value={hasMoreAuthors
                  ? `${authorList.join(', ')} e +${group.authors.length - 5}`
                  : authorList.join(', ')
                }
              />
            )}
            {group.concepts.length > 0 && (
              <StatRow
                icon={<Brain className="w-3.5 h-3.5" />}
                label="conceitos"
                value={group.concepts.length > 6
                  ? `${group.concepts.slice(0, 5).join(', ')} e +${group.concepts.length - 5}`
                  : group.concepts.join(', ')
                }
              />
            )}
            {group.dificuldades.length > 0 && (
              <StatRow
                icon={<BarChart3 className="w-3.5 h-3.5" />}
                label="dificuldades"
                value={group.dificuldades.map(d => DIFF_LABEL_MAP[d] ?? d).join(', ')}
              />
            )}
          </motion.div>
        </div>
      </div>

      {/* Botão fixo */}
      <div className="fixed bottom-0 inset-x-0 z-10 bg-canvas/95 backdrop-blur-md border-t border-ceci-border-subtle shadow-[0_-8px_24px_rgba(var(--shadow-rgb),0.06)]">
        <div className="max-w-md sm:max-w-xl mx-auto px-3.5 sm:px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <button
            onClick={handleStart}
            disabled={group.questionCount === 0}
            className={cn(
              'w-full flex items-center justify-center gap-1.5 py-3.5 rounded-2xl text-sm font-semibold transition-all active:scale-[0.98] cursor-pointer',
              group.questionCount > 0
                ? 'bg-ceci-brand hover:bg-ceci-brand-strong text-white shadow-2xs'
                : 'bg-ceci-muted text-ceci-secondary cursor-not-allowed'
            )}
          >
            <BookOpen className="w-4 h-4" />
            {group.questionCount > 0
              ? `começar quiz (${Math.min(20, group.questionCount)} questões)` 
              : 'sem questões disponíveis'}
          </button>
        </div>
      </div>
    </div>
  );
};

const QUESTION_COUNTS = [5, 10, 15, 20];

const DIFF_LABEL_MAP: Record<string, string> = {
  basica: 'básica',
  intermediaria: 'intermediária',
  avancada: 'avançada',
};