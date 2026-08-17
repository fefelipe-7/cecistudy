import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ArrowLeft, BookOpen, Check, FileText, Tag } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ClassNote } from '../../types';
import type { LooseNote } from '../../types';
import { hapticSuccess } from '../../lib/haptics';
import { usePersistentState } from '../../lib/usePersistentState';
import { StarRating } from '../ui/StarRating';

const LOOSE_CATEGORIES: LooseNote['category'][] = ['reflexão', 'estudo', 'ideia', 'lembrete'];

/** Última escolha do quick capture (abre no último modo/disciplina). */
interface ComposePrefs {
  mode: 'aula' | 'avulsa';
  courseId?: string;
}

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
  } = useApp();

  const [lastPrefs, setLastPrefs] = usePersistentState<ComposePrefs>('composePrefs', { mode: 'avulsa' });

  const [text, setText] = useState('');
  const [isClassNote, setIsClassNote] = useState<boolean>(!!composeCourseId || lastPrefs.mode === 'aula');
  const [courseId, setCourseId] = useState<string>(composeCourseId || lastPrefs.courseId || courses[0]?.id || '');
  const [tag, setTag] = useState('');
  const [rating, setRating] = useState(0);
  const [category, setCategory] = useState<LooseNote['category']>('reflexão');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  const nextNumber = useMemo(() => {
    const nums = classes.filter((c) => c.courseId === courseId).map((c) => c.number || 0);
    return (nums.length ? Math.max(...nums) : 0) + 1;
  }, [classes, courseId]);

  const firstLine = (content: string) => content.split('\n')[0].slice(0, 60);

  const handleSave = () => {
    const content = text.trim();
    if (!content) return;

    if (isClassNote) {
      const note: ClassNote = {
        id: 'cl-' + Date.now(),
        courseId,
        title: tag.trim() || firstLine(content) || 'aula anotada no cantinho',
        number: nextNumber,
        date: new Date().toISOString().split('T')[0],
        summary: content,
        fullNotes: content,
        conceptIds: [],
        authorIds: [],
        approachIds: [],
        materials: [],
        hasQuestions: false,
        rating: rating || undefined,
      };
      setLastPrefs({ mode: 'aula', courseId });
      hapticSuccess();
      handleAddClassNote(note);
      closeCompose();
      openDetailPrompt(note.id);
    } else {
      setLastPrefs({ mode: 'avulsa' });
      hapticSuccess();
      addLooseNote({
        id: 'note-' + Date.now(),
        title: firstLine(content) || 'nota sem título',
        content,
        category,
        date: new Date().toISOString(),
      });
      closeCompose();
      showToast('nota salva nas notas avulsas ♡');
    }
  };

  const canSave = text.trim().length > 0;

  return (
    <div className="min-h-[70vh] flex flex-col">
      {/* Cabeçalho sutil da tela de captura */}
      <div className="sticky top-0 z-10 -mx-3.5 sm:-mx-5 px-3.5 sm:px-5 pt-[calc(0.5rem+env(safe-area-inset-top,0px))] pb-3 bg-canvas/95 backdrop-blur-md border-b border-ceci-border-subtle">
        <div className="max-w-md sm:max-w-xl mx-auto flex items-center justify-between gap-2">
          <button
            onClick={closeCompose}
            className="w-9 h-9 rounded-2xl bg-white border border-ceci-border-default hover:bg-surface-rose flex items-center justify-center text-ceci-primary shadow-2xs transition-all active:scale-95 cursor-pointer"
            title="voltar"
            aria-label="voltar"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 min-w-0">
            <span className="w-7 h-7 rounded-xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0">
              <FileText className="w-3.5 h-3.5" />
            </span>
            <h1 className="font-display font-bold text-sm text-ceci-primary truncate">nova nota</h1>
          </div>

          <button
            onClick={handleSave}
            disabled={!canSave}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-[14px] text-xs font-bold transition-all active:scale-95 min-h-[44px] cursor-pointer ${
              canSave
                ? 'bg-ceci-brand-strong hover:bg-ceci-brand-hover text-white shadow-2xs'
                : 'bg-surface-muted text-ceci-tertiary cursor-not-allowed'
            }`}
          >
            <Check className="w-4 h-4 stroke-[2.5]" />
            <span>salvar</span>
          </button>
        </div>
      </div>

      {/* Linha quase imperceptível: escolha de aula + tag/categoria */}
      <div className="pt-3 space-y-2.5">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsClassNote(!isClassNote)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[11px] font-semibold transition-all cursor-pointer ${
              isClassNote
                ? 'bg-ceci-primary text-white shadow-2xs'
                : 'bg-white text-ceci-secondary border border-ceci-border-default hover:bg-surface-rose'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>{isClassNote ? 'é uma aula ♡' : 'é uma aula?'}</span>
          </button>

          {isClassNote && (
            <select
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              className="flex-1 min-w-0 bg-white border border-ceci-border-default rounded-full px-3 py-1.5 text-[11px] font-medium text-ceci-primary focus:outline-none focus:ring-2 focus:ring-rose-500/30 focus:border-rose-500 cursor-pointer"
              aria-label="disciplina da aula"
            >
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          )}
        </div>

        {isClassNote ? (
          <div className="flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5 text-ceci-tertiary shrink-0" />
            <input
              type="text"
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              placeholder="tag para classificar a aula (ex.: ansiedade)"
              className="flex-1 min-w-0 bg-white/60 border border-ceci-border-subtle rounded-full px-3.5 py-1.5 text-[11px] text-ceci-primary placeholder-ceci-faded focus:outline-none focus:border-rose-500"
            />
          </div>
        ) : (
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-medium text-ceci-tertiary">categoria:</span>
            {LOOSE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-[11px] font-semibold capitalize transition-all cursor-pointer ${
                  category === cat
                    ? 'bg-ceci-brand-strong text-white shadow-2xs'
                    : 'bg-white text-ceci-secondary border border-ceci-border-default hover:bg-surface-rose'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {isClassNote && (
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[11px] font-medium text-ceci-tertiary">avaliação:</span>
            <StarRating value={rating} onChange={setRating} showLabel />
          </div>
        )}
      </div>

      {/* Campo de texto grande — digitação quase instantânea */}
      <textarea
        ref={textareaRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="escreva sua nota aqui... ✨"
        className="flex-1 min-h-[45vh] mt-3 w-full bg-white rounded-[22px] border border-ceci-border-default shadow-2xs p-4 text-sm text-ceci-primary placeholder-ceci-faded focus:outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20 resize-none leading-relaxed"
      />
    </div>
  );
};