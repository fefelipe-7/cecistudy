import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Check, Target, Filter, Sparkles } from 'lucide-react';
import { Mascote } from '../ui/Mascote';
import { PillGroup } from '../ui/PillGroup';
import { FixedBottomBar } from '../ui/FixedBottomBar';
import { cn } from '../../lib/utils';
import { IOS_EASE_OUT } from '../../lib/motion';
import { filterQuestionPool } from '../../lib/quizLogic';
import type { QuizConfig, StudyQuestion } from '../../types';

interface QuizCategorySelectorProps {
  questions: StudyQuestion[];
  onStart: (config: QuizConfig) => void;
  onClose: () => void;
  ensureQuestionsLoaded?: () => Promise<StudyQuestion[]>;
}

// Extrai opções únicas das questões
function getUniqueOptions(questions: StudyQuestion[]) {
  const areas = new Set<string>();
  const temas = new Set<string>();
  const escolas = new Set<string>();
  const dificuldades = new Set<'basica' | 'intermediaria' | 'avancada'>();

  questions.forEach((q) => {
    if (q.area) areas.add(q.area);
    if (q.tema) temas.add(q.tema);
    if (q.escolaOuAbordagem) escolas.add(q.escolaOuAbordagem);
    if (q.dificuldade) dificuldades.add(q.dificuldade);
  });

  return {
    areas: Array.from(areas).sort(),
    temas: Array.from(temas).sort(),
    escolas: Array.from(escolas).sort(),
    dificuldades: Array.from(dificuldades).sort(),
  };
}

function FilterSection({
  label,
  icon,
  options,
  selected,
  onToggle,
  isOpen,
  onToggleOpen,
  count,
}: {
  label: string;
  icon: React.ReactNode;
  options: string[];
  selected: string[];
  onToggle: (opt: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  count: number;
}) {
  return (
    <div className="rounded-xl bg-surface-default border border-ceci-border-default overflow-hidden">
      <button
        onClick={onToggleOpen}
        className="w-full flex items-center justify-between gap-3 p-4"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong flex items-center justify-center">
            {icon}
          </span>
          <div>
            <h4 className="font-display font-bold text-sm text-ceci-primary">{label}</h4>
            <p className="text-[11px] text-ceci-secondary">
              {selected.length > 0
                ? `${selected.length} selecionado${selected.length > 1 ? 's' : ''}`
                : `${options.length} disponíveis`}
            </p>
          </div>
        </div>
        <span className={`flex items-center gap-1 text-xs font-semibold ${
          selected.length > 0 ? 'text-ceci-brand-strong' : 'text-ceci-secondary'
        }`}>
          {selected.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-ceci-brand-strong text-ceci-on-brand flex items-center justify-center">
              {selected.length}
            </span>
          )}
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            key="open"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: IOS_EASE_OUT }}
            className="border-t border-ceci-border-default p-3 space-y-2 max-h-48 overflow-y-auto"
          >
            {options.map((opt) => {
              const isSel = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => onToggle(opt)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition',
                    isSel
                      ? 'bg-ceci-brand-strong text-ceci-on-brand'
                      : 'bg-surface-muted text-ceci-primary hover:bg-surface-rose'
                  )}
                >
                  <span className="truncate">{opt}</span>
                  {isSel && <Check className="w-4 h-4 flex-shrink-0" />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function CountSelector({ count, onChange, maxAvailable }: { count: number; onChange: (n: number) => void; maxAvailable: number }) {
  const options = [5, 10, 15, 20].filter((n) => n <= maxAvailable);
  return (
    <div className="rounded-xl bg-surface-default border border-ceci-border-default p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-ceci-brand-strong" />
          <h4 className="font-display font-bold text-sm text-ceci-primary">número de questões</h4>
        </div>
        <span className="text-xs text-ceci-secondary">máx. {maxAvailable}</span>
      </div>
      <PillGroup
        variant="rose"
        value={String(count)}
        onChange={(v) => onChange(Number(v))}
        options={options.map((n) => ({ value: String(n), label: `${n}` }))}
      />
    </div>
  );
}

export const QuizCategorySelector: React.FC<QuizCategorySelectorProps> = ({
  questions,
  onStart,
  onClose,
  ensureQuestionsLoaded,
}) => {
  const [isReloading, setIsReloading] = useState(false);

  // Garante o acervo em memória quando a conta vem com questões vazias (bug legado).
  useEffect(() => {
    if (questions.length > 0) return;
    let cancelled = false;
    setIsReloading(true);
    ensureQuestionsLoaded?.().finally(() => {
      if (!cancelled) setIsReloading(false);
    });
    return () => {
      cancelled = true;
    };
  }, [questions.length, ensureQuestionsLoaded]);

  const { areas, temas, escolas, dificuldades } = useMemo(() => getUniqueOptions(questions), [questions]);

  const [config, setConfig] = useState<QuizConfig>({
    areas: [],
    temas: [],
    escolas: [],
    dificuldades: [],
    count: 10,
  });
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    areas: true,
    temas: false,
    escolas: false,
    dificuldades: false,
  });

  // Filtra pool baseado na config
  const pool = useMemo(() => filterQuestionPool(questions, config), [questions, config]);

  // Ajusta count se pool for menor
  useEffect(() => {
    if (pool.length < config.count) {
      const validCounts = [5, 10, 15, 20].filter((n) => n <= pool.length);
      if (validCounts.length > 0) {
        setConfig((c) => ({ ...c, count: validCounts[validCounts.length - 1] }));
      }
    }
  }, [pool.length, config.count]);

  const toggleOption = (dimension: keyof QuizConfig, option: string) => {
    setConfig((c) => {
      const current = c[dimension] as string[];
      const next = current.includes(option)
        ? current.filter((o) => o !== option)
        : [...current, option];
      return { ...c, [dimension]: next };
    });
  };

  const toggleSection = (section: string) => {
    setOpenSections((s) => ({ ...s, [section]: !s[section] }));
  };

  const handleStart = () => {
    if (pool.length === 0) return;
    onStart(config);
  };

  const hasAnyFilter = config.areas.length > 0 || config.temas.length > 0 || config.escolas.length > 0 || config.dificuldades.length > 0;

  return (
    <div className="min-h-[70vh] flex flex-col pb-44">
      {isReloading && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center gap-3 py-16 text-center"
        >
          <Mascote expression="loading-patient" className="w-14 h-14" decorative />
          <div>
            <h3 className="font-display font-bold text-base text-ceci-primary">escrevendo suas questões ♡</h3>
            <p className="text-xs text-ceci-secondary mt-1.5">
              {questions.length === 0 ? 'a tia kelly está montando o acervo pra você...' : 'só um minutinho...'}
            </p>
          </div>
        </motion.div>
      )}
      {!isReloading && (
      <>
      <div className="flex-1 pt-4 overflow-y-auto">
        <div className="max-w-md sm:max-w-xl mx-auto px-3.5 sm:px-5 space-y-4">
          {/* Card explicativo */}
          <div
            className="rounded-xl p-4 bg-surface-default border border-ceci-border-default shadow-sm text-center space-y-3"
          >
            <Mascote expression="quiz-ready" className="w-12 h-12 mx-auto" decorative />
            <div>
              <h3 className="font-display font-bold text-base text-ceci-primary">monte seu quiz ♡</h3>
              <p className="text-xs text-ceci-secondary mt-1.5 leading-relaxed">
                escolha áreas, temas, escolas e dificuldade. o pool filtra em tempo real.
              </p>
            </div>
          </div>

          {/* Filtros */}
          <div className="space-y-3">
            <FilterSection
              label="áreas"
              icon={<Sparkles className="w-4 h-4" />}
              options={areas}
              selected={config.areas}
              onToggle={(opt) => toggleOption('areas', opt)}
              isOpen={openSections.areas}
              onToggleOpen={() => toggleSection('areas')}
              count={config.areas.length}
            />
            <FilterSection
              label="temas"
              icon={<Filter className="w-4 h-4" />}
              options={temas}
              selected={config.temas}
              onToggle={(opt) => toggleOption('temas', opt)}
              isOpen={openSections.temas}
              onToggleOpen={() => toggleSection('temas')}
              count={config.temas.length}
            />
            <FilterSection
              label="escolas / abordagens"
              icon={<Sparkles className="w-4 h-4" />}
              options={escolas}
              selected={config.escolas}
              onToggle={(opt) => toggleOption('escolas', opt)}
              isOpen={openSections.escolas}
              onToggleOpen={() => toggleSection('escolas')}
              count={config.escolas.length}
            />
            <FilterSection
              label="dificuldade"
              icon={<Target className="w-4 h-4" />}
              options={dificuldades}
              selected={config.dificuldades}
              onToggle={(opt) => toggleOption('dificuldades', opt)}
              isOpen={openSections.dificuldades}
              onToggleOpen={() => toggleSection('dificuldades')}
              count={config.dificuldades.length}
            />
          </div>

          {/* Selector de quantidade */}
          <div>
            <CountSelector count={config.count} onChange={(n) => setConfig((c) => ({ ...c, count: n }))} maxAvailable={pool.length} />
          </div>

          {/* Badge de filtro ativo */}
          {hasAnyFilter && (
            <div
              className="rounded-xl p-3 bg-surface-rose border border-ceci-border-brand text-center"
            >
              <p className="text-xs text-ceci-brand-strong">
                {pool.length} questões correspondem aos filtros
              </p>
            </div>
          )}

          {/* Botão começar */}
          <div className="pt-2">
            <button
              onClick={handleStart}
              disabled={pool.length === 0}
              className={`w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold cursor-pointer transition active:scale-[0.98] ${
                pool.length === 0
                  ? 'bg-ceci-muted text-ceci-secondary cursor-not-allowed'
                  : 'bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand shadow-2xs'
              }`}
            >
              <Target className="w-4 h-4" /> {pool.length === 0 ? 'nenhuma questão com esses filtros' : `começar quiz (${config.count} questões)`}
            </button>
          </div>
        </div>
      </div>

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
      </>
      )}
    </div>
  );
};