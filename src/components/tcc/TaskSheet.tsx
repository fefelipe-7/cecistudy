import React, { useEffect, useState } from 'react';
import { Trash2 } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import {
  THESIS_ID,
  newTaskId,
  type TaskOrigin,
  type TaskStatus,
  type ThesisTask,
} from '../../types';
import { Modal } from '../ui/Modal';
import { SegmentedControl } from '../ui/SegmentedControl';
import { TagChip } from '../ui/TagChip';
import { formatDateBR } from '../../lib/dateBR';
import { hapticTap, hapticWarning } from '../../lib/haptics';

/**
 * Sheet da pendência de orientação (SPEC-012 F6.1) — uma entidade, uma escrita
 * por ação.
 *
 * Lê a pendência **viva** pelo id (nunca guarda cópia do estado). Os campos de
 * formulário são locais; salvar constrói a entidade e faz **uma** escrita em
 * `setThesisTasks`. Remover tira o id da coleção — em `ThesisTask` nada aponta
 * para a pendência, então não há vínculo a desfazer.
 */
interface TaskSheetProps {
  open: boolean;
  /** `'new'` cria; qualquer outro id edita. */
  taskId: string | 'new';
  onClose: () => void;
}

const inputClass =
  'w-full bg-surface-default border border-ceci-border-default rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand';
const labelClass = 'block text-xs font-medium text-ceci-secondary mb-1';

const ORIGIN_OPTIONS: { value: TaskOrigin; label: string }[] = [
  { value: 'orientadora', label: 'orientadora' },
  { value: 'minha', label: 'minha' },
];

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'aberta', label: 'aberta' },
  { value: 'em_andamento', label: 'em andamento' },
  { value: 'resolvida', label: 'resolvida' },
  { value: 'arquivada', label: 'arquivada' },
];

export const TaskSheet: React.FC<TaskSheetProps> = ({ open, taskId, onClose }) => {
  const { thesisTasks, thesisChapters, thesisMeetings, setThesisTasks, showToast } =
    useMobileApp();

  const live = taskId === 'new' ? undefined : thesisTasks.find((t) => t.id === taskId);

  const [title, setTitle] = useState('');
  const [origin, setOrigin] = useState<TaskOrigin>('orientadora');
  const [chapterId, setChapterId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [status, setStatus] = useState<TaskStatus>('aberta');
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle(live?.title ?? '');
    setOrigin(live?.origin ?? 'orientadora');
    setChapterId(live?.chapterId ?? '');
    setDueDate(live?.dueDate ?? '');
    setStatus(live?.status ?? 'aberta');
    setConfirmingRemove(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, taskId]);

  // A orientadora só aparece como opção de origem da pendência quando existe
  // reunião registrada? Não: a origem é declarada pela usuária, seja a pendência
  // vinda de uma reunião ou pedida por mensagem. O `meetingId` só nasce no F6.4.
  const meetingOf = live?.meetingId
    ? thesisMeetings.find((m) => m.id === live.meetingId)
    : undefined;

  const save = () => {
    const trimmed = title.trim();
    if (!trimmed) {
      hapticWarning();
      showToast('a pendência precisa de um título ♡');
      return;
    }
    const now = new Date().toISOString();
    const draft: ThesisTask = {
      ...(live ?? {
        id: newTaskId(),
        thesisId: THESIS_ID,
        origin: 'orientadora' as TaskOrigin,
        status: 'aberta' as TaskStatus,
        createdAt: now,
        updatedAt: now,
      }),
      title: trimmed,
      origin,
      chapterId: chapterId || undefined,
      dueDate: dueDate || undefined,
      status,
      updatedAt: now,
    };
    // **Uma** escrita por ação: acrescenta ou substitui por id.
    setThesisTasks((prev) => {
      const i = prev.findIndex((t) => t.id === draft.id);
      return i === -1 ? [...prev, draft] : prev.map((t) => (t.id === draft.id ? draft : t));
    });
    hapticTap();
    showToast('pendência guardada ♡');
    onClose();
  };

  const remove = () => {
    if (!live) return;
    setThesisTasks((prev) => prev.filter((t) => t.id !== live.id));
    hapticTap();
    showToast('pendência removida');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} position="bottom" className="w-full max-w-lg">
      <div className="w-full bg-canvas rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl overflow-hidden p-5 sm:p-6 text-ceci-primary space-y-4">
        <h3 className="font-display font-bold text-base text-ceci-primary">
          {taskId === 'new' ? 'nova pendência' : 'editar pendência'}
        </h3>

        <div>
          <label htmlFor="task-titulo" className={labelClass}>título</label>
          <input
            id="task-titulo"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className={inputClass}
            placeholder="o que precisa ser feito"
          />
        </div>

        <div>
          <label className={labelClass}>origem</label>
          <SegmentedControl
            variant="rose"
            ariaLabel="origem da pendência"
            className="w-full [&>button]:flex-1"
            value={origin}
            onChange={(v) => setOrigin(v)}
            options={ORIGIN_OPTIONS}
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="task-capitulo" className={labelClass}>capítulo</label>
            <select
              id="task-capitulo"
              value={chapterId}
              onChange={(e) => setChapterId(e.target.value)}
              className={inputClass}
            >
              <option value="">— nenhum —</option>
              {thesisChapters.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="task-prazo" className={labelClass}>prazo</label>
            <input
              id="task-prazo"
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className={inputClass}
            />
          </div>
        </div>

        <div>
          <label className={labelClass}>status</label>
          <SegmentedControl
            variant="rose"
            ariaLabel="status da pendência"
            className="w-full [&>button]:flex-1"
            value={status}
            onChange={(v) => setStatus(v)}
            options={STATUS_OPTIONS}
          />
        </div>

        {meetingOf && (
          <TagChip size="sm" variant="neutral" className="!py-1">
            veio da reunião de {formatDateBR(meetingOf.date)}
          </TagChip>
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
            a pendência sai da lista. as reuniões e as decisões que já ficaram
            registradas continuam salvas.
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
