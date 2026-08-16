import React, { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, ChevronUp, Check, X, Target, Filter, Sparkles } from 'lucide-react';
import { Kitty } from '../ui/Kitty';
import { cn } from '../../lib/utils';
import type { QuizConfig, StudyQuestion } from '../../types';

interface QuizCategorySelectorProps {
  questions: StudyQuestion[];
  onStart: (config: QuizConfig, pool: StudyQuestion[]) => void;
  onClose: () => void;
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
    <div className="rounded-[20px] bg-white border border-ceci-border-default overflow-hidden">
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
            <span className="w-5 h-5 rounded-full bg-ceci-brand-strong text-white flex items-center justify-center">
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
            transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
            className="border-t border-ceci-border-default p-3 space-y-2 max-h-48 overflow-y-auto"
          >
            {options.map((opt) => {
              const isSel = selected.includes(opt);
              return (
                <button
                  key={opt}
                  onClick={() => onToggle(opt)}
                  className={cn(
                    'w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-xs transition-all',
                    isSel
                      ? 'bg-ceci-brand-strong text-white'
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
    <div className="rounded-[20px] bg-white border border-ceci-border-default p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Target className="w-5 h-5 text-ceci-brand-strong" />
          <h4 className="font-display font-bold text-sm text-ceci-primary">número de questões</h4>
        </div>
        <span className="text-xs text-ceci-secondary">máx. {maxAvailable}</span>
      </div>
      <div className="flex gap-2">
        {options.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-semibold transition-all ${
              count === n
                ? 'bg-ceci-brand-strong text-white shadow-sm'
                : 'bg-white border border-ceci-border-default text-ceci-primary hover:bg-surface-rose'
            }`}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}

export const QuizCategorySelector: React.FC<QuizCategorySelectorProps> = ({
  questions,
  onStart,
  onClose,
}) => {
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
  const pool = useMemo(() => {
    return questions.filter((q) => {
      const areaMatch = config.areas.length === 0 || (q.area && config.areas.includes(q.area));
      const temaMatch = config.temas.length === 0 || (q.tema && config.temas.includes(q.tema));
      const escolaMatch = config.escolas.length === 0 || (q.escolaOuAbordagem && config.escolas.includes(q.escolaOuAbordagem));
      const difMatch = config.dificuldades.length === 0 || (q.dificuldade && config.dificuldades.includes(q.dificuldade));
      return areaMatch && temaMatch && escolaMatch && difMatch;
    });
  }, [questions, config]);

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
    const shuffled = [...pool].sort(() => Math.random() - 0.5).slice(0, config.count);
    onStart(config, shuffled);
  };

  const hasAnyFilter = config.areas.length > 0 || config.temas.length > 0 || config.escolas.length > 0 || config.dificuldades.length > 0;

  return (
    <div className="min-h-[70vh] flex flex-col animate-in fade-in duration-300 pb-44">
      {/* Header */}
      <div className="sticky top-0 z-10 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-3 bg-canvas/95 backdrop-blur-md border-b border-ceci-border-subtle">
        <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-2xl bg-white border border-ceci-border-default hover:bg-surface-rose flex items-center justify-center text-ceci-primary shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="voltar"
            aria-label="voltar"
          >
            <X className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-2 min-w-0">
            <span className="w-7 h-7 rounded-xl border flex items-center justify-center shrink-0 bg-surface-rose border-ceci-border-brand text-ceci-brand-strong">
              <Target className="w-3.5 h-3.5" />
            </span>
            <div className="min-w-0">
              <h1 className="font-display font-bold text-sm text-ceci-primary truncate leading-tight">novo quiz</h1>
              <p className="text-[11px] text-ceci-secondary truncate">
                {questions.length} questões no acervo • {pool.length} com filtros atuais
              </p>
            </div>
          </div>

          <span className="w-9 h-9 shrink-0" aria-hidden />
        </div>

        {/* Barra de progresso do pool */}
        <div className="max-w-md sm:max-w-xl mx-auto mt-3 h-0.5 rounded-full bg-ceci-border-subtle overflow-hidden">
          <motion.div
            className="h-full rounded-full bg-ceci-brand-strong"
            initial={false}
            animate={{ width: `${Math.min(100, (pool.length / questions.length) * 100)}%` }}
            transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          />
        </div>
      </div>

      {/* Corpo */}
      <div className="flex-1 pt-4 overflow-y-auto">
        <div className="max-w-md sm:max-w-xl mx-auto px-3.5 sm:px-5 space-y-4">
          {/* Card explicativo */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.1 }}
            className="rounded-[20px] p-4 bg-white border border-ceci-border-default shadow-sm text-center space-y-3"
          >
            <Kitty expression="pensativa" className="w-12 h-12 mx-auto" decorative />
            <div>
              <h3 className="font-display font-bold text-base text-ceci-primary">monte seu quiz ♡</h3>
              <p className="text-xs text-ceci-secondary mt-1.5 leading-relaxed">
                escolha áreas, temas, escolas e dificuldade. o pool filtra em tempo real.
              </p>
            </div>
          </motion.div>

          {/* Filtros */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="space-y-3"
          >
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
          </motion.div>

          {/* Selector de quantidade */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.25 }}
          >
            <CountSelector count={config.count} onChange={(n) => setConfig((c) => ({ ...c, count: n }))} maxAvailable={pool.length} />
          </motion.div>

          {/* Badge de filtro ativo */}
          {hasAnyFilter && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.3 }}
              className="rounded-xl p-3 bg-surface-rose border border-ceci-border-brand text-center"
            >
              <p className="text-xs text-ceci-brand-strong">
                {pool.length} questões correspondem aos filtros
              </p>
            </motion.div>
          )}

          {/* Botão começar */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.35 }}
            className="pt-2"
          >
            <button
              onClick={handleStart}
              disabled={pool.length === 0}
              className={`w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold cursor-pointer transition-all active:scale-[0.98] ${
                pool.length === 0
                  ? 'bg-ceci-muted text-ceci-secondary cursor-not-allowed'
                  : 'bg-ceci-brand hover:bg-ceci-brand-strong text-white shadow-2xs'
              }`}
            >
              <Target className="w-4 h-4" /> {pool.length === 0 ? 'nenhuma questão com esses filtros' : `começar quiz (${config.count} questões)`}
            </button>
          </motion.div>
        </div>
      </div>

      {/* Footer sticky para fechar */}
      <div className="fixed bottom-0 inset-x-0 z-10 bg-canvas/95 backdrop-blur-md border-t border-ceci-border-subtle shadow-[0_-8px_24px_rgba(64,56,58,0.06)]">
        <div className="max-w-md sm:max-w-xl mx-auto px-3.5 sm:px-5 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom,0px))]">
          <button
            onClick={onClose}
            className="w-full min-h-[40px] rounded-xl text-xs font-medium text-ceci-tertiary hover:text-ceci-primary hover:bg-surface-muted transition-colors cursor-pointer"
          >
            cancelar
          </button>
        </div>
      </div>
    </div>
  );
};