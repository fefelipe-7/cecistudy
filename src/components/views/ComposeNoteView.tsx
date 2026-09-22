import React, { useMemo, useRef, useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { hapticSuccess } from '../../lib/haptics';
import { usePersistentState } from '../../lib/usePersistentState';
import { Modal } from '../ui/Modal';
import { Picker } from '../ui/Picker';
import { ComposeModeSwitch } from '../compose/ComposeModeSwitch';
import { ComposeSheet } from '../compose/ComposeSheet';
import { ComposeConfigAccordion } from '../compose/ComposeConfigAccordion';
import { ComposeActionBar } from '../compose/ComposeActionBar';
import {
  COMPOSE_DRAFT_KEY,
  buildClassNoteFromCompose,
  buildLooseNoteFromCompose,
  composeTitle,
  emptyDraft,
  initialCourseId,
  initialMode,
  nextClassNumber,
  nextComposePrefs,
  shouldShowClassNudge,
  type ComposeDraft,
  type ComposePrefs,
} from '../../lib/composeLogic';

/** Rascunho inicial reidratado (texto/tag/rating/categoria da última vez). */
const draftFromContext = (
  previous: ComposeDraft | undefined,
  composeCourseId: string | undefined,
  lastPrefs: ComposePrefs | undefined,
  courses: { id: string }[]
): ComposeDraft => {
  const base = previous ?? emptyDraft();
  return {
    ...base,
    mode: initialMode(composeCourseId, lastPrefs),
    courseId: initialCourseId(composeCourseId, lastPrefs ?? base, courses),
  };
};

export const ComposeNoteView: React.FC = () => {
  const {
    courses,
    classes,
    composeCourseId,
    handleAddClassNote,
    addLooseNote,
    closeCompose,
    showToast,
    openDetailPrompt,
  } = useMobileApp();

  const [lastPrefs, setLastPrefs] = usePersistentState<ComposePrefs>('composePrefs', { mode: 'avulsa' });
  const [draft, setDraft] = usePersistentState<ComposeDraft>(COMPOSE_DRAFT_KEY, emptyDraft());

  const [initial] = useState<ComposeDraft>(() =>
    draftFromContext(draft, composeCourseId, lastPrefs, courses)
  );
  const [mode, setMode] = useState<ComposeDraft['mode']>(initial.mode);
  const [courseId, setCourseId] = useState<string | undefined>(initial.courseId);
  const [text, setText] = useState(initial.text);
  const [tag, setTag] = useState(initial.tag);
  const [rating, setRating] = useState(initial.rating);
  const [category, setCategory] = useState(initial.category);

  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const hasCourses = courses.length > 0;
  const selectedCourse = courses.find((c) => c.id === courseId);
  const isClassNote = mode === 'aula';

  const patchDraft = (patch: Partial<ComposeDraft>) => {
    setDraft({ text, mode, courseId, category, tag, rating, ...patch });
  };

  const updateText = (v: string) => {
    setText(v);
    patchDraft({ text: v });
  };
  const updateTag = (v: string) => {
    setTag(v);
    patchDraft({ tag: v });
  };
  const updateRating = (n: number) => {
    setRating(n);
    patchDraft({ rating: n });
  };
  const updateCategory = (c: ComposeDraft['category']) => {
    setCategory(c);
    patchDraft({ category: c });
  };
  const updateCourseId = (id: string | undefined) => {
    setCourseId(id);
    patchDraft({ courseId: id });
  };
  const switchMode = (m: ComposeDraft['mode']) => {
    setMode(m);
    setDraft({ text, mode: m, courseId, category, tag, rating });
  };

  const classNumber = useMemo(() => nextClassNumber(classes, courseId), [classes, courseId]);

  const handleBack = () => {
    if (text.trim()) {
      setConfirmDiscard(true);
      return;
    }
    closeCompose();
  };

  const handleDiscard = () => {
    setConfirmDiscard(false);
    setDraft(emptyDraft());
    closeCompose();
  };

  const handleSave = () => {
    const content = text.trim();
    if (!content) return;

    if (isClassNote) {
      const note = buildClassNoteFromCompose({
        text: content,
        tag,
        courseId: courseId || courses[0]?.id,
        number: classNumber,
        rating,
      });
      setLastPrefs(nextComposePrefs('aula', courseId));
      handleAddClassNote(note);
      hapticSuccess();
      setConfirmDiscard(false);
      setDraft(emptyDraft());
      closeCompose();
      openDetailPrompt(note.id);
    } else {
      setLastPrefs(nextComposePrefs('avulsa'));
      addLooseNote(
        buildLooseNoteFromCompose({
          text: content,
          category,
          courseId,
        })
      );
      hapticSuccess();
      setConfirmDiscard(false);
      setDraft(emptyDraft());
      closeCompose();
      showToast('nota salva nas notas avulsas ♡');
    }
  };

  const canSave = text.trim().length > 0;
  const showNudge = shouldShowClassNudge(text, mode, hasCourses);

  return (
    <div className="min-h-[70vh] flex flex-col">
      {/* Cabeçalho contextual da tela de captura */}
      <div className="sticky top-0 z-10 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-3 bg-canvas/95 backdrop-blur-md border-b border-ceci-border-subtle">
        <div className="max-w-md sm:max-w-xl lg:max-w-2xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={handleBack}
            className="w-9 h-9 rounded-2xl bg-surface-default border border-ceci-border-default hover:bg-surface-rose flex items-center justify-center text-ceci-primary shadow-2xs transition active:scale-95 cursor-pointer"
            title="voltar"
            aria-label="voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <h1 className="font-display font-bold text-sm text-ceci-primary truncate">
            {composeTitle(mode, selectedCourse?.name)}
          </h1>

          <span className="w-9 h-9 rounded-full bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0 text-sm">
            {isClassNote ? '📚' : '♡'}
          </span>
        </div>
      </div>

      <div className="pt-3 flex-1 min-h-0 flex flex-col gap-2.5">
        <ComposeModeSwitch mode={mode} onChange={switchMode} />

        {isClassNote ? (
          <>
            {hasCourses && (
              <Picker
                value={courseId ?? ''}
                onChange={(v) => updateCourseId(v || undefined)}
                options={courses.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="escolher disciplina"
                buttonClassName="flex-1 min-w-0 bg-surface-default border border-ceci-border-default rounded-full px-3.5 py-2 text-[11px] font-semibold text-ceci-primary"
                sheetTitle="disciplina da aula"
                clearable={!composeCourseId}
              />
            )}
            {!hasCourses && (
              <p className="text-[11px] text-ceci-tertiary text-center px-6 leading-snug">
                cadastre uma matéria na aba faculdade para anotar aulas aqui ♡
              </p>
            )}
          </>
        ) : (
          <ComposeConfigAccordion
            mode={mode}
            category={category}
            onCategoryChange={updateCategory}
            courseId={courseId}
            onCourseIdChange={updateCourseId}
            courses={courses}
          />
        )}

        <ComposeSheet
          mode={mode}
          courseLabel={selectedCourse?.name}
          classNumber={classNumber}
          tag={tag}
          onTagChange={updateTag}
          rating={rating}
          onRatingChange={updateRating}
          hasCourses={hasCourses}
          className="min-h-[40vh]"
        >
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => updateText(e.target.value)}
            placeholder="escreva aqui... ✨"
            className="flex-1 w-full bg-transparent px-4 pt-3 pb-4 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none resize-none leading-relaxed"
            autoFocus
          />
        </ComposeSheet>
      </div>

      <ComposeActionBar
        canSave={canSave}
        saveLabel="guardar ♡"
        showNudge={showNudge}
        onNudge={() => {
          switchMode('aula');
          textareaRef.current?.focus();
        }}
        onSave={handleSave}
      />

      <Modal
        open={confirmDiscard}
        onClose={() => setConfirmDiscard(false)}
        closeOnBackdrop={false}
        labelledBy="compose-discard-title"
      >
        <div className="bg-surface-default rounded-[20px] border border-ceci-border-default shadow-xl p-5 max-w-sm w-full text-center">
          <p id="compose-discard-title" className="font-display font-bold text-sm text-ceci-primary">
            descartar essa nota?
          </p>
          <p className="text-xs text-ceci-secondary mt-1.5 leading-relaxed">
            parece que você estava no meio de uma anotação. ainda dá tempo de guardar ♡
          </p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button
              onClick={() => setConfirmDiscard(false)}
              className="min-h-[44px] rounded-2xl border border-ceci-border-default bg-surface-default text-ceci-secondary text-xs font-semibold cursor-pointer active:scale-[0.98] transition-transform"
            >
              continuar escrevendo
            </button>
            <button
              onClick={handleDiscard}
              className="min-h-[44px] rounded-2xl bg-surface-rose border border-ceci-border-brand text-ceci-brand-strong text-xs font-bold cursor-pointer active:scale-[0.98] transition-transform"
            >
              sim, descartar
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};