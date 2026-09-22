import React, { useEffect, useMemo, useState } from 'react';
import { CheckCircle2, Wand2 } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import type { NoteTargetType } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { useWizardForm } from '../../lib/useWizardForm';
import { WizardScaffold, type WizardStep } from '../wizards/WizardScaffold';
import { ReviewCard } from '../wizards/wizardFields';
import { useAcervoTheory } from '../wizards/useAcervoTheory';
import { CourseSelect } from '../wizards/CourseSelect';
import { TARGETS, MAIN_TARGET_TYPES, MORE_TARGETS } from '../wizards/note/constants';
import { FIELDS_FOR, hydrateTransform, type TransformValues } from '../wizards/note/fieldsFor';

export const NoteTransformWizard: React.FC = () => {
  const {
    focusedNote,
    courses,
    concepts,
    authors,
    approaches,
    classes,
    handleAddClassNote,
    handleAddTask,
    handleAddExam,
    handleAddFlashcard,
    handleAddSession,
    handleAddInternshipLog,
    handleAddConcept,
    handleAddAuthor,
    handleAddMaterial,
    deleteLooseNote,
    closeAllNoteScreens,
    openComposeDetails,
    setActiveTab,
    showToast,
  } = useMobileApp();

  const form = useWizardForm<TransformValues>({
    initial: {
      title: '', courseId: '', content: '',
      classNumber: 1, classDate: '',
      taskCategory: 'leitura', priority: 'media', dueDate: '',
      examDate: '', examWeight: '1,0', topics: [],
      question: '', answer: '', conceptId: '',
      sessionTopic: '', sessionDate: '', duration: 30,
      activity: '', internshipType: 'estagio', internshipDate: '', hours: 1, reflections: '',
      conceptName: '', definition: '', approachId: '', authorIds: [], courseIds: [], tags: [],
      authorName: '', bio: '', keyConcepts: [], majorWorks: [],
      materialTitle: '', materialAuthor: '', materialType: 'artigo', url: '', materialTags: [],
    },
  });
  const { values, patch, setValues } = form;
  const { courseId } = values;
  const step = form.step;
  const setStep = form.setStep;
  const [target, setTarget] = useState<NoteTargetType | null>(null);
  const [moreOpen, setMoreOpen] = useState(false);
  /** Item criado com sucesso — mostra a tela final "abrir item criado" (§5.11). */
  const [created, setCreated] = useState<{ label: string; onOpen?: () => void } | null>(null);
  const { conceptOptions, resolveIds } = useAcervoTheory();

  useEffect(() => {
    if (!focusedNote) return;
    setValues(hydrateTransform(focusedNote, courses, classes));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target, focusedNote]);

  const courseName = useMemo(
    () => courses.find((x) => x.id === courseId)?.name ?? '',
    [courses, courseId]
  );

  if (!focusedNote) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center px-4">
        <p className="text-xs text-ceci-secondary">essa nota não foi encontrada.</p>
        <button
          onClick={closeAllNoteScreens}
          className="px-4 py-2 bg-ceci-primary text-ceci-on-primary rounded-full text-xs font-bold cursor-pointer"
        >
          voltar
        </button>
      </div>
    );
  }

  const courseSelect = (
    <CourseSelect
      value={courseId}
      onChange={(v) => patch({ courseId: v })}
      label="disciplina"
      placeholder="nenhuma disciplina"
    />
  );

  const pickerStep: WizardStep = {
    id: 'tipo',
    title: 'transformar em',
    headline: 'em que essa nota vira?',
    subtitle: 'suas notas são rascunhos transitórios — escolhe para onde essa vai.',
    content: (
      <div className="space-y-4">
        {/* três destinos principais (§5.11) */}
        <div className="space-y-2.5">
          {TARGETS.filter((t) => MAIN_TARGET_TYPES.includes(t.type)).map((opt) => {
            const Icon = opt.Icon;
            return (
              <button
                key={opt.type}
                onClick={() => {
                  setTarget(opt.type);
                  setStep(1);
                }}
                className="w-full flex items-center gap-3.5 p-4 rounded-xl bg-surface-default border-2 border-ceci-border-default hover:border-ceci-border-brand text-left transition active:scale-[0.98] cursor-pointer shadow-sm"
              >
                <span className={`w-11 h-11 rounded-2xl border flex items-center justify-center shrink-0 ${opt.accent}`}>
                  <Icon className="w-5 h-5" />
                </span>
                <span>
                  <span className="block font-display font-bold text-sm text-ceci-primary">{opt.label}</span>
                  <span className="block text-[11px] text-ceci-secondary mt-0.5 leading-snug">{opt.caption}</span>
                </span>
              </button>
            );
          })}
        </div>

        {/* mais opções — colapsável */}
        <button
          onClick={() => setMoreOpen((v) => !v)}
          aria-expanded={moreOpen}
          className="w-full py-2.5 text-xs font-bold text-ceci-academic-strong hover:bg-surface-blue/40 rounded-xl transition-colors cursor-pointer"
        >
          {moreOpen ? '− menos opções' : '+ mais opções'}
        </button>
        {moreOpen && (
          <div className="grid grid-cols-2 gap-2.5">
            {MORE_TARGETS.map((opt) => {
              const Icon = opt.Icon;
              return (
                <button
                  key={opt.type}
                  onClick={() => {
                    setTarget(opt.type);
                    setStep(1);
                  }}
                  className="w-full flex flex-col items-start gap-2 p-3.5 rounded-xl bg-surface-default border border-ceci-border-default hover:border-ceci-border-brand text-left transition active:scale-[0.98] cursor-pointer shadow-2xs"
                >
                  <span className={`w-9 h-9 rounded-xl border flex items-center justify-center shrink-0 ${opt.accent}`}>
                    <Icon className="w-4 h-4" />
                  </span>
                  <span>
                    <span className="block font-display font-bold text-xs text-ceci-primary leading-tight">
                      {opt.label}
                    </span>
                    <span className="block text-[10px] text-ceci-secondary mt-0.5 leading-snug">
                      {opt.caption}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>
        )}
      </div>
    ),
  };

  const reviewStep = (rows: { label: string; value: string }[]): WizardStep => ({
    id: 'revisar',
    title: 'revisar',
    headline: 'confere se está tudo certinho ♡',
    subtitle: 'se algo estiver fora, volta e ajusta aqui antes de transformar.',
    content: (
      <div className="space-y-3">
        <ReviewCard rows={rows} />
        {/* §5.11: explicar o que acontece com a nota original */}
        <p className="text-[11px] text-ceci-tertiary leading-relaxed px-1">
          ao transformar, a nota original sai das suas notas avulsas — o conteúdo vai junto para o novo registro ♡
        </p>
      </div>
    ),
  });

  const formStep = (id: string, headline: string, content: React.ReactNode, subtitle?: string): WizardStep => ({
    id,
    title: 'detalhes',
    headline,
    subtitle,
    content,
  });

  const targetSteps = (): WizardStep[] => {
    if (!target) return [];
    const cfg = FIELDS_FOR[target];
    const ctx = {
      v: values,
      patch,
      lookups: {
        courseSelect,
        courseName,
        conceptOptions,
        resolveIds,
        approaches,
        authors,
        courses,
        concepts,
      },
    };
    return [
      formStep(cfg.stepId, cfg.headline, cfg.render(ctx), cfg.subtitle),
      reviewStep(cfg.review(ctx)),
    ];
  };

  const steps: WizardStep[] = [pickerStep, ...(target ? targetSteps() : [])];

  const canNext = target === null ? false : step === 1 ? FIELDS_FOR[target].valid(values) : true;

  const handleSave = () => {
    if (!focusedNote || !target) return;
    const label = TARGETS.find((t) => t.type === target)?.label ?? '';

    /** Cria o item via registry, remove a nota e mostra a tela final (§5.11: "abrir item criado"). */
    const { onOpen } = FIELDS_FOR[target].save({
      v: values,
      note: focusedNote,
      actions: {
        addClassNote: handleAddClassNote,
        addTask: handleAddTask,
        addExam: handleAddExam,
        addFlashcard: handleAddFlashcard,
        addSession: handleAddSession,
        addInternshipLog: handleAddInternshipLog,
        addConcept: handleAddConcept,
        addAuthor: handleAddAuthor,
        addMaterial: handleAddMaterial,
        openComposeDetails,
        gotoTab: (t) => setActiveTab(t),
      },
    });
    deleteLooseNote(focusedNote.id);
    hapticSuccess();
    setCreated({ label, onOpen });
    showToast(`nota transformada em ${label} ♡`);
  };

  // ---- tela final de sucesso: "prontinho ♡ abrir item criado" ----
  if (created) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center gap-4 px-6 text-center">
        <span className="w-16 h-16 rounded-3xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong">
          <CheckCircle2 className="w-8 h-8" />
        </span>
        <div className="space-y-1">
          <h2 className="font-display font-bold text-xl text-ceci-primary">
            prontinho! sua nota virou {created.label} ♡
          </h2>
          <p className="text-xs text-ceci-secondary leading-relaxed">
            a nota original saiu das avulsas — o conteúdo foi junto.
          </p>
        </div>
        <div className="w-full max-w-xs space-y-2 pt-2">
          {created.onOpen && (
            <button
              onClick={() => {
                closeAllNoteScreens();
                created.onOpen?.();
              }}
              className="w-full min-h-[48px] rounded-2xl bg-ceci-brand-strong text-ceci-on-brand text-sm font-semibold active:scale-[0.98] transition-transform cursor-pointer"
            >
              abrir item criado
            </button>
          )}
          <button
            onClick={closeAllNoteScreens}
            className="w-full min-h-[44px] rounded-2xl border border-ceci-border-default bg-surface-default text-ceci-secondary text-sm font-semibold active:scale-[0.98] transition-transform cursor-pointer"
          >
            voltar para as notas
          </button>
        </div>
      </div>
    );
  }

  return (
    <WizardScaffold
      title="transformar nota"
      icon={<Wand2 className="w-3.5 h-3.5" />}
      iconClass="bg-surface-rose border-ceci-border-brand text-ceci-brand-strong"
      mascote="writing-flow"
      steps={steps}
      step={step}
      onStepChange={setStep}
      canNext={canNext}
      hideNext={target === null}
      onSave={handleSave}
      onClose={closeAllNoteScreens}
      saveLabel={target ? `transformar em ${TARGETS.find((t) => t.type === target)?.label ?? ''} ♡` : 'guardar ♡'}
    />
  );
};