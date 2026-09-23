import React, { useEffect, useRef, useState } from 'react';
import { Brain, ChevronDown } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useMobileApp } from '@/context/mobileApp';
import type { ManagedItem } from '../../types';
import { cn } from '../../lib/utils';
import { hapticSuccess } from '../../lib/haptics';
import { useWizardForm } from '../../lib/useWizardForm';
import { usePersistentState } from '../../lib/usePersistentState';
import { WizardScaffold, type WizardStep } from './WizardScaffold';
import { ReviewCard, TextArea } from './wizardFields';
import { Picker } from '../ui/Picker';
import { CourseSelect } from './CourseSelect';
import { useAcervoTheory } from './useAcervoTheory';
import { initCard } from '../../lib/fsrs';
import { Card3D } from '../flashcards/Card3D';
import { CardCreation3D } from '../flashcards/CardCreation3D';
import { CardBaúEnvelope } from '../flashcards/CardBaúEnvelope';

interface FlashcardValues {
  question: string;
  answer: string;
  deckId: string;
  courseId: string;
  conceptId: string;
}

type FlashcardMode = '3d' | 'simples';

interface FlashcardPrefs {
  mode: FlashcardMode;
}

/** Memória da última escolha do toggle 3D ♡ / simples (padrão composePrefs). */
const FLASHCARD_PREFS_KEY = 'flashcardPrefs';

const MODE_LABELS: Record<FlashcardMode, string> = { '3d': '3D ♡', simples: 'simples' };

export const FlashcardWizard: React.FC<{ editing?: ManagedItem | null }> = ({ editing }) => {
  const {
    courses,
    concepts,
    flashcards,
    decks,
    wizardCourseId,
    handleAddFlashcard,
    handleUpdateFlashcard,
    closeWizard,
    showToast,
  } = useMobileApp();
  const editingCard = editing?.kind === 'flashcard'
    ? flashcards.find((c) => c.id === editing.id)
    : undefined;

  const [prefs, setPrefs] = usePersistentState<FlashcardPrefs>(FLASHCARD_PREFS_KEY, { mode: '3d' });
  // Edição abre em modo simples (clareza > novidade); o 3D continua a memória default.
  const [mode, setMode] = useState<FlashcardMode>(editing ? 'simples' : prefs.mode);
  const [contextOpen, setContextOpen] = useState(false);
  const [savedCard, setSavedCard] = useState<{ question: string; answer: string } | null>(null);
  const saveTimerRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    };
  }, []);

  const { values, patch, step, setStep } = useWizardForm<FlashcardValues>({
    initial: {
      question: editingCard?.question ?? '',
      answer: editingCard?.answer ?? '',
      deckId: editingCard?.deckId ?? '',
      courseId: editingCard?.courseId ?? (wizardCourseId || courses[0]?.id || ''),
      conceptId: editingCard?.conceptId ?? '',
    },
    editing: !!editingCard,
  });
  const { question, answer, deckId, courseId, conceptId } = values;
  const { conceptOptions, resolveIds } = useAcervoTheory();
  const deckOptions = decks.map((d) => ({ value: d.id, label: d.name }));
  const deckName = decks.find((d) => d.id === deckId)?.name ?? '';
  const courseName = courses.find((c) => c.id === courseId)?.name ?? '';
  const conceptName = concepts.find((c) => c.id === conceptId)?.name ?? '';

  const changeMode = (next: FlashcardMode) => {
    setMode(next);
    if (!editing) setPrefs({ mode: next });
  };

  const is3d = mode === '3d';

  const steps: WizardStep[] = [
    {
      id: 'card-conteudo',
      title: 'cria seu card',
      headline: is3d ? 'monta teu card e vira pra resposta ♡' : 'qual a pergunta do card?',
      subtitle: is3d
        ? 'escreve a pergunta na frente, vira (enter ou o botão) e responde no verso.'
        : 'frente e verso empilhados — o card pequeno mostra o resultado enquanto você escreve ♡',
      content: (
        <div className="space-y-4">
          {/* toggle 3D ♡ / simples (memória da última escolha) */}
          <div className="flex items-center justify-end gap-1.5">
            {(Object.keys(MODE_LABELS) as FlashcardMode[]).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => changeMode(m)}
                aria-pressed={mode === m}
                className={cn(
                  'px-3 py-1.5 rounded-full text-[10px] font-bold cursor-pointer border transition active:scale-95',
                  mode === m
                    ? 'bg-surface-rose border-ceci-border-brand text-ceci-brand-strong'
                    : 'bg-surface-default border-ceci-border-default text-ceci-tertiary hover:bg-surface-muted'
                )}
              >
                {MODE_LABELS[m]}
              </button>
            ))}
          </div>

          {is3d ? (
            <CardCreation3D
              question={question}
              onQuestionChange={(v) => patch({ question: v })}
              answer={answer}
              onAnswerChange={(v) => patch({ answer: v })}
            />
          ) : (
            <div className="space-y-4">
              <TextArea
                rows={3}
                value={question}
                onChange={(e) => patch({ question: e.target.value })}
                placeholder="qual a pergunta do card?"
                autoFocus
              />
              <TextArea
                rows={5}
                value={answer}
                onChange={(e) => patch({ answer: e.target.value })}
                placeholder="a resposta, com suas palavras..."
                onKeyDown={(e) => {
                  // Enter no modo simples segue o fluxo normal (nenhum flip); só evita submit.
                  if (e.key === 'Enter') e.preventDefault();
                }}
              />
              <div className="mx-auto w-40">
                <Card3D
                  flipped={answer.trim().length > 0}
                  ariaLabel="preview do card"
                  className="shadow-sm"
                  front={
                    <span className="flex h-full items-center justify-center px-3 text-center text-[11px] font-bold text-ceci-primary break-words">
                      {question.trim() || 'sua pergunta'}
                    </span>
                  }
                  back={
                    <span className="flex h-full items-center justify-center px-3 text-center text-[11px] text-ceci-secondary break-words">
                      {answer.trim() || 'sua resposta'}
                    </span>
                  }
                />
              </div>
            </div>
          )}
        </div>
      ),
    },
    {
      id: 'card-contexto',
      title: 'contexto',
      headline: 'quer dar um contexto pro card?',
      subtitle: 'grupo, conceito e disciplina são opcionais — ajudam a revisar por tema ♡',
      content: (
        <div className="rounded-2xl border border-ceci-border-default bg-surface-default overflow-hidden">
          <button
            type="button"
            onClick={() => setContextOpen((o) => !o)}
            aria-expanded={contextOpen}
            className="w-full flex items-center justify-between gap-2 px-4 py-3 text-xs font-semibold text-ceci-primary cursor-pointer"
          >
            <span>contexto (opcional)</span>
            <ChevronDown
              className={cn('w-4 h-4 text-ceci-tertiary transition-transform', contextOpen && 'rotate-180')}
            />
          </button>
          <AnimatePresence initial={false}>
            {contextOpen && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="space-y-4 px-4 pb-4">
                  <Picker
                    label="grupo (opcional)"
                    value={deckId}
                    onChange={(v) => patch({ deckId: v })}
                    options={deckOptions}
                    emptyMessage="ainda não há grupos. crie um depois ♡"
                  />
                  <Picker
                    label="conceito relacionado (opcional)"
                    value={conceptId}
                    onChange={(v) => patch({ conceptId: resolveIds([v])[0] })}
                    options={conceptOptions}
                    emptyMessage="ainda não há conceitos no cantinho."
                  />
                  <CourseSelect
                    value={courseId}
                    onChange={(v) => patch({ courseId: v })}
                    label="disciplina (opcional)"
                    optional
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      ),
    },
    {
      id: 'card-revisar',
      title: 'revisar',
      headline: 'confere antes de jogar na caixinha ♡',
      subtitle: 'confere pergunta e resposta; seu card vai pro baú de cards.',
      content: (
        <div className="space-y-4">
          {/* card-form no mesmo layoutId do mini-card do baú (voo na confirmação) */}
          <div className="relative mx-auto w-60 h-40 rounded-2xl border-2 border-dashed border-ceci-border-strong bg-surface-subtle flex items-center justify-center">
            <motion.div
              layoutId="baú-card"
              initial={false}
              className="absolute inset-x-4 top-3 bottom-3 flex flex-col items-center justify-center gap-1 rounded-xl bg-surface-default border border-ceci-border-default p-3 text-center shadow-sm overflow-hidden"
            >
              <span className="text-[9px] font-bold uppercase tracking-wider text-ceci-muted">pergunta</span>
              <span className="text-[11px] font-bold text-ceci-primary leading-snug line-clamp-2">
                {question.trim() || 'sua pergunta aqui'}
              </span>
              <span className="text-[10px] text-ceci-tertiary leading-snug line-clamp-2">
                {answer.trim() || 'sua resposta aqui'}
              </span>
            </motion.div>
          </div>
          <ReviewCard
            rows={[
              { label: 'pergunta', value: question.trim() },
              { label: 'resposta', value: answer.trim() },
              { label: 'grupo', value: deckName || 'sem grupo' },
              { label: 'conceito', value: conceptName || 'sem conceito' },
              { label: 'disciplina', value: courseName || 'sem disciplina' },
            ]}
          />
        </div>
      ),
    },
  ];

  const canNext = step === 0 ? question.trim().length > 0 && answer.trim().length > 0 : true;
  const blockedReason =
    step === 0
      ? question.trim().length === 0
        ? 'escreva a pergunta do card para continuar'
        : 'vira o card e escreve a resposta ♡'
      : undefined;

  const handleSave = () => {
    if (editingCard) {
      handleUpdateFlashcard({
        ...editingCard,
        deckId: deckId || undefined,
        courseId: courseId || undefined,
        conceptId: conceptId || undefined,
        question: question.trim(),
        answer: answer.trim(),
      });
      hapticSuccess();
      closeWizard();
      showToast('flashcard atualizado ♡');
      return;
    }
    // Commit síncrono (persistência imediata); o voo para o baú é decorativo.
    const newCard = initCard({
      id: 'f-' + Date.now(),
      deckId: deckId || undefined,
      courseId: courseId || undefined,
      conceptId: conceptId || undefined,
      question: question.trim(),
      answer: answer.trim(),
    });
    handleAddFlashcard(newCard);
    hapticSuccess();
    setSavedCard({ question: newCard.question, answer: newCard.answer });
    saveTimerRef.current = window.setTimeout(() => {
      closeWizard();
      showToast('flashcard guardado no baú ♡');
    }, 650);
  };

  return (
    <>
      <WizardScaffold
        title={editing ? 'editar flashcard' : 'novo flashcard'}
        icon={<Brain className="w-3.5 h-3.5" />}
        iconClass="bg-surface-blue border-ceci-border-academic text-ceci-academic-strong"
        mascote="review-card"
        steps={steps}
        step={step}
        onStepChange={setStep}
        canNext={canNext}
        blockedReason={blockedReason}
        onSave={handleSave}
        onClose={closeWizard}
        saveLabel={editing ? 'guardar alterações ♡' : 'guardar flashcard ♡'}
      />

      {/* Confirmação: baú abre e o mini-card voa pra dentro (decorativo, ≤650ms). */}
      <AnimatePresence>
        {savedCard && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-6"
          >
            <CardBaúEnvelope open card={savedCard} label="guardado no baú ♡" className="mx-auto" />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default FlashcardWizard;