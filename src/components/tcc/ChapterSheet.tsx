import React, { useEffect, useState } from 'react';
import { ChevronUp, ChevronDown, Trash2, GripVertical } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import {
  THESIS_ID,
  ThesisChapter,
  ThesisProject,
  moveChapter as moveChapterIn,
  newChapterId,
  type ChapterKind,
  type ChapterStage,
} from '../../types';
import { Modal } from '../ui/Modal';
import { SegmentedControl } from '../ui/SegmentedControl';
import { hapticTap, hapticWarning } from '../../lib/haptics';

/**
 * Sheet do capítulo (SPEC-012 D5/F4.3) — uma entidade, uma escrita por ação.
 *
 * Lê o capítulo **vivo** pelo id (nunca guarda cópia do estado: o bug `U5` da
 * SPEC-009 era o modal que congelava o objeto e ficava velho). Os campos de
 * formulário são locais; salvar constrói a entidade e faz **uma** escrita.
 *
 * Remover tira o id das `chapterIds` das referências (as referências ficam —
 * só perdem o vínculo com o capítulo).
 */
interface ChapterSheetProps {
  open: boolean;
  /** `'new'` cria; qualquer outro id edita. */
  chapterId: string | 'new';
  onClose: () => void;
}

const inputClass =
  'w-full bg-surface-default border border-ceci-border-default rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand';
const labelClass = 'block text-xs font-medium text-ceci-secondary mb-1';

const STAGE_OPTIONS: { value: ChapterStage; label: string }[] = [
  { value: 'a_fazer', label: 'a fazer' },
  { value: 'escrevendo', label: 'escrevendo' },
  { value: 'em_revisao', label: 'em revisão' },
  { value: 'pronto', label: 'pronto' },
];

const KIND_OPTIONS: { value: ChapterKind; label: string }[] = [
  { value: 'capitulo', label: 'capítulo' },
  { value: 'secao', label: 'seção' },
];

/** Meta/palavras: inteiro ≥ 0 ou `undefined` (vazio = não informado, ≠ 0). */
const parseCount = (raw: string): number | undefined => {
  const n = Number(raw);
  if (raw.trim() === '' || !Number.isInteger(n) || n < 0) return undefined;
  return n;
};

export const ChapterSheet: React.FC<ChapterSheetProps> = ({ open, chapterId, onClose }) => {
  const { thesisChapters, thesisReferences, setThesisChapters, setThesisReferences, showToast } =
    useMobileApp();

  const live = chapterId === 'new' ? undefined : thesisChapters.find((c) => c.id === chapterId);

  const [title, setTitle] = useState('');
  const [kind, setKind] = useState<ChapterKind>('capitulo');
  const [parentId, setParentId] = useState('');
  const [stage, setStage] = useState<ChapterStage>('a_fazer');
  const [dueDate, setDueDate] = useState('');
  const [wordGoal, setWordGoal] = useState('');
  const [wordCount, setWordCount] = useState('');
  const [note, setNote] = useState('');
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(live?.title ?? '');
    setKind(live?.kind ?? 'capitulo');
    setParentId(live?.parentId ?? '');
    setStage(live?.stage ?? 'a_fazer');
    setDueDate(live?.dueDate ?? '');
    setWordGoal(live?.wordGoal != null ? String(live.wordGoal) : '');
    setWordCount(live?.wordCount != null ? String(live.wordCount) : '');
    setNote(live?.note ?? '');
    setConfirmingRemove(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, chapterId]);

  const parents = thesisChapters.filter((c) => !c.parentId && c.id !== chapterId);

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      hapticWarning();
      showToast('o capítulo precisa de um título ♡');
      return;
    }
    const now = new Date().toISOString();
    const nextParent = kind === 'secao' && parentId ? parentId : undefined;
    const siblings = thesisChapters.filter(
      (c) => (c.parentId ?? undefined) === nextParent && c.id !== chapterId,
    );
    const draft: ThesisChapter = {
      ...(live ?? {
        id: newChapterId(),
        thesisId: THESIS_ID,
        kind: 'capitulo',
        requiredness: 'obrigatorio',
        position: siblings.length,
        stage: 'a_fazer',
        createdAt: now,
        updatedAt: now,
      }),
      title: trimmed,
      kind,
      parentId: nextParent,
      position: live?.position ?? siblings.length,
      stage,
      dueDate: dueDate || undefined,
      wordGoal: parseCount(wordGoal),
      wordCount: parseCount(wordCount),
      note: note.trim() || undefined,
      updatedAt: now,
    };
    // **Uma** escrita por ação: acrescenta ou substitui por id.
    setThesisChapters((prev) => {
      const i = prev.findIndex((c) => c.id === draft.id);
      return i === -1 ? [...prev, draft] : prev.map((c) => (c.id === draft.id ? draft : c));
    });
    hapticTap();
    showToast('capítulo guardado ♡');
    onClose();
  };

  const remove = () => {
    if (!live) return;
    setThesisChapters((prev) => prev.filter((c) => c.id !== live.id));
    // Referências não morrem com o capítulo — só perdem o vínculo.
    setThesisReferences((prev) =>
      prev.map((r) =>
        (r.chapterIds ?? []).includes(live.id)
          ? { ...r, chapterIds: r.chapterIds!.filter((id) => id !== live.id) }
          : r,
      ),
    );
    hapticTap();
    showToast('capítulo removido');
    onClose();
  };

  const move = (delta: -1 | 1) => {
    if (!live) return;
    setThesisChapters((prev) => moveChapterIn(prev, live.id, delta));
  };

  return (
    <Modal open={open} onClose={onClose} position="bottom" className="w-full max-w-lg">
      <div className="w-full bg-canvas rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl overflow-hidden p-5 sm:p-6 text-ceci-primary space-y-4">
        <h3 className="font-display font-bold text-base text-ceci-primary">
          {chapterId === 'new' ? 'novo capítulo' : 'editar capítulo'}
        </h3>

        <div>
          <label htmlFor="cap-titulo" className={labelClass}>título</label>
          <input
            id="cap-titulo"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="do jeito que fizer sentido pro seu trabalho"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelClass}>tipo</label>
            <SegmentedControl
              variant="rose"
              ariaLabel="tipo do capítulo"
              className="w-full [&>button]:flex-1"
              value={kind}
              onChange={(v) => setKind(v)}
              options={KIND_OPTIONS}
            />
          </div>
          <div>
            <label htmlFor="cap-prazo" className={labelClass}>prazo</label>
            <input
              id="cap-prazo"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        {kind === 'secao' && (
          <div>
            <label htmlFor="cap-dentro" className={labelClass}>dentro de</label>
            <select
              id="cap-dentro"
              value={parentId}
              onChange={(e) => setParentId(e.target.value)}
              className={inputClass}
            >
              <option value="">— escolha o capítulo —</option>
              {parents.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className={labelClass}>estágio</label>
          <SegmentedControl
            variant="rose"
            ariaLabel="estágio do capítulo"
            className="w-full [&>button]:flex-1"
            value={stage}
            onChange={(v) => setStage(v)}
            options={STAGE_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cap-meta" className={labelClass}>meta de palavras</label>
            <input
              id="cap-meta"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={wordGoal}
              onChange={(e) => setWordGoal(e.target.value)}
              className={inputClass}
              placeholder="opcional"
            />
          </div>
          <div>
            <label htmlFor="cap-atual" className={labelClass}>palavras até aqui</label>
            <input
              id="cap-atual"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={wordCount}
              onChange={(e) => setWordCount(e.target.value)}
              className={inputClass}
              placeholder="opcional"
            />
          </div>
        </div>

        <div>
          <label htmlFor="cap-nota" className={labelClass}>nota</label>
          <textarea
            id="cap-nota"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
            placeholder="o que falta, o que a orientadora pediu…"
          />
        </div>

        {live && (
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-ceci-secondary mr-auto">posição na lista</span>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="mover capítulo para cima"
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-ceci-secondary border border-ceci-border-default hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
            >
              <ChevronUp className="w-3.5 h-3.5" /> subir
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="mover capítulo para baixo"
              className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs text-ceci-secondary border border-ceci-border-default hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
            >
              <ChevronDown className="w-3.5 h-3.5" /> descer
            </button>
          </div>
        )}

        <div className="flex items-center justify-between gap-2 pt-3 border-t border-ceci-border-subtle">
          {live ? (
            <button
              type="button"
              onClick={() => setConfirmingRemove(true)}
              className="flex items-center gap-1.5 px-3 py-2.5 rounded-xl text-xs text-status-danger-strong hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" /> remover
            </button>
          ) : (
            <span />
          )}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs text-ceci-secondary hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
            >
              cancelar
            </button>
            <button
              type="button"
              onClick={save}
              className="bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[44px] cursor-pointer"
            >
              guardar ♡
            </button>
          </div>
        </div>
      </div>

      <Modal
        open={confirmingRemove}
        onClose={() => setConfirmingRemove(false)}
        position="bottom"
        className="w-full max-w-sm"
      >
        <div className="bg-canvas rounded-2xl border border-ceci-border-default shadow-xl p-5 text-ceci-primary space-y-3">
          <h3 className="font-display font-bold text-base leading-tight">
            remover “{live?.title}”?
          </h3>
          <p className="text-xs text-ceci-secondary leading-relaxed">
            as referências que apontam pra cá continuam salvas — só perdem o
            vínculo com este capítulo.
          </p>
          <div className="flex items-center justify-end gap-2">
            <button
              type="button"
              onClick={() => setConfirmingRemove(false)}
              className="px-4 py-2.5 rounded-xl text-xs text-ceci-secondary hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
            >
              voltar
            </button>
            <button
              type="button"
              onClick={remove}
              className="bg-status-danger hover:bg-status-danger-strong text-ceci-on-primary px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[44px] cursor-pointer"
            >
              remover mesmo assim
            </button>
          </div>
        </div>
      </Modal>
    </Modal>
  );
};
