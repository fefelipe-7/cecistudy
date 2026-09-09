import React, { useState } from 'react';
import {
  X,
  Play,
  Calendar as CalIcon,
  FileText,
  Check,
  Pencil,
} from 'lucide-react';
import type { CalendarEntry } from '../../../lib/schedule';
import { LAYER_META } from './layers';
import { formatShortDate } from '../../../lib/schedule';

interface CalendarContextPanelProps {
  entry: CalendarEntry | null;
  onClose: () => void;
  onToggleStage: (stageId: string) => void;
  onStartTimer: () => void;
  onReschedule: (date: string, start?: string) => void;
  onToggleDone: () => void;
  onEdit: () => void;
}

/**
 * Painel de contexto do calendário (lado direito): detalhes do evento
 * selecionado, etapas (checklist), vínculos, observações e ações.
 */
export const CalendarContextPanel: React.FC<CalendarContextPanelProps> = ({
  entry,
  onClose,
  onToggleStage,
  onStartTimer,
  onReschedule,
  onToggleDone,
  onEdit,
}) => {
  const [editing, setEditing] = useState(false);
  const [draftDate, setDraftDate] = useState('');
  const [draftTime, setDraftTime] = useState('');

  if (!entry) {
    return (
      <aside className="flex w-72 shrink-0 flex-col items-center justify-center border-l border-ceci-border-default bg-[var(--ds-surface-inspector)] px-6 text-center">
        <span className="text-2xl" aria-hidden>🗓️</span>
        <p className="mt-2 text-sm font-semibold text-ceci-primary">
          detalhes do evento
        </p>
        <p className="mt-1 text-xs text-ceci-secondary">
          toque em um evento da grade para ver tudo aqui ♡
        </p>
      </aside>
    );
  }

  const meta = LAYER_META[entry.layer];
  const stages = entry.stages ?? [];
  const doneCount = stages.filter((s) => s.done).length;
  const pct = stages.length ? Math.round((doneCount / stages.length) * 100) : 0;

  const canReschedule =
    entry.entryRef === 'exam' ||
    entry.entryRef === 'session' ||
    entry.entryRef === 'task' ||
    entry.entryRef === 'tccChapter';
  const isTimed = entry.entryRef === 'exam' || entry.entryRef === 'session';
  const canDone =
    entry.entryRef === 'exam' ||
    entry.entryRef === 'task' ||
    entry.entryRef === 'tccChapter';

  const openEditor = () => {
    setDraftDate(entry.date);
    setDraftTime(entry.start ?? '09:00');
    setEditing(true);
  };
  const confirmEditor = () => {
    onReschedule(draftDate, isTimed ? draftTime : undefined);
    setEditing(false);
  };

  return (
    <aside className="flex w-72 shrink-0 flex-col overflow-y-auto border-l border-ceci-border-default bg-[var(--ds-surface-inspector)]">
      {/* cabeçalho */}
      <div className="flex items-start justify-between gap-2 border-b border-ceci-border-default px-5 py-4">
        <div className="flex flex-col gap-0.5">
          <div className="mb-1 flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm" style={{ background: meta.fg }} />
            <span className="text-xs uppercase tracking-wide text-ceci-muted">
              {meta.label}
              {entry.subtype !== meta.label ? ` · ${entry.subtype}` : ''}
            </span>
          </div>
          <h2 className="font-display text-base font-semibold leading-tight text-ceci-primary">
            {entry.title}
          </h2>
          {(entry.importance || entry.status) && (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {entry.importance && (
                <span
                  className="rounded-sm px-1.5 py-0.5 text-xs font-medium"
                  style={{ background: meta.bg, color: meta.fg }}
                >
                  {entry.importance}
                </span>
              )}
              {entry.status && (
                <span className="rounded-sm bg-green-50 px-1.5 py-0.5 text-xs font-medium text-[var(--ds-status-success)]">
                  {entry.status}
                </span>
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="fechar detalhes"
          className="mt-0.5 text-ceci-muted transition-colors hover:text-ceci-primary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* planejado / realizado */}
      <div className="grid grid-cols-2 gap-3 border-b border-ceci-border-default px-5 py-3">
        <div>
          <p className="mb-0.5 text-xs text-ceci-muted">quando</p>
          <p className="text-sm font-medium text-ceci-primary">
            {formatShortDate(entry.date)}
          </p>
          {entry.start && entry.end && (
            <p className="text-xs text-ceci-muted">
              {entry.start} — {entry.end}
            </p>
          )}
        </div>
        <div>
          <p className="mb-0.5 text-xs text-ceci-muted">camada</p>
          <p className="text-sm font-medium" style={{ color: meta.fg }}>
            {meta.label}
          </p>
          {entry.courseName && (
            <p className="truncate text-xs text-ceci-muted">{entry.courseName}</p>
          )}
        </div>
      </div>

      {/* etapas */}
      {stages.length > 0 && (
        <div className="flex flex-col gap-1.5 border-b border-ceci-border-default px-5 py-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs font-semibold text-ceci-primary">etapas</span>
          </div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-xs text-ceci-muted">progresso</span>
            <span className="text-xs font-medium text-ceci-primary">
              {doneCount} / {stages.length}
            </span>
          </div>
          <div className="mb-2 h-1.5 rounded-sm bg-[var(--ds-surface-muted)]">
            <div
              className="h-1.5 rounded-sm"
              style={{ width: `${pct}%`, background: meta.fg }}
            />
          </div>
          {stages.map((stage) => (
            <button
              key={stage.id}
              type="button"
              onClick={() => onToggleStage(stage.id)}
              aria-pressed={stage.done}
              className="flex items-start gap-2 text-left"
            >
              <span
                className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border"
                style={{
                  borderColor: stage.done ? meta.fg : 'var(--ds-border-default)',
                  background: stage.done ? meta.fg : 'var(--ds-surface-raised)',
                }}
              >
                {stage.done && <Check className="text-white" style={{ width: 9, height: 9 }} />}
              </span>
              <span
                className={`text-sm leading-tight ${
                  stage.done ? 'text-ceci-muted line-through' : 'text-ceci-primary'
                }`}
              >
                {stage.label}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* vínculos */}
      {entry.links && entry.links.length > 0 && (
        <div className="flex flex-col gap-1.5 border-b border-ceci-border-default px-5 py-3">
          <span className="mb-0.5 text-xs font-semibold text-ceci-primary">vínculos</span>
          {entry.links.map((link, i) => (
            <span
              key={i}
              className="flex items-center gap-2 text-sm text-[var(--ds-accent-strong)]"
            >
              <FileText className="h-3 w-3" />
              {link.label}
            </span>
          ))}
        </div>
      )}

      {/* observações */}
      {entry.notes && (
        <div className="border-b border-ceci-border-default px-5 py-3">
          <span className="mb-1.5 block text-xs font-semibold text-ceci-primary">
            observações
          </span>
          <p className="text-sm leading-relaxed text-ceci-secondary">{entry.notes}</p>
        </div>
      )}

      {/* ações */}
      <div className="mt-auto flex flex-col gap-2 px-5 py-4">
        {canDone && (
          <button
            type="button"
            onClick={onToggleDone}
            aria-pressed={Boolean(entry.completed)}
            className="flex items-center justify-center gap-2 rounded-[10px] border border-ceci-border-default py-1.5 text-sm font-medium text-ceci-primary transition-colors hover:bg-black/[0.03]"
          >
            <span
              className="flex h-4 w-4 items-center justify-center rounded-sm border"
              style={{
                borderColor: entry.completed ? 'var(--ds-status-success)' : 'var(--ds-border-default)',
                background: entry.completed ? 'var(--ds-status-success)' : 'var(--ds-surface-raised)',
              }}
            >
              {entry.completed && <Check className="text-white" style={{ width: 10, height: 10 }} />}
            </span>
            {entry.completed ? 'concluído' : 'marcar concluído'}
          </button>
        )}

        {canReschedule && !editing && (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={openEditor}
              className="flex flex-1 items-center justify-center gap-1 rounded-[10px] border border-ceci-border-default py-1.5 text-sm font-medium text-ceci-primary transition-colors hover:bg-black/[0.03]"
            >
              <CalIcon className="h-3 w-3" />
              reagendar
            </button>
            <button
              type="button"
              onClick={onEdit}
              className="flex flex-1 items-center justify-center gap-1 rounded-[10px] border border-ceci-border-default py-1.5 text-sm font-medium text-ceci-muted transition-colors hover:bg-black/[0.03]"
            >
              <Pencil className="h-3 w-3" />
              editar
            </button>
          </div>
        )}

        {canReschedule && editing && (
          <div className="flex flex-col gap-2 rounded-[10px] border border-ceci-border-default p-2">
            <label className="flex items-center justify-between gap-2 text-xs text-ceci-secondary">
              data
              <input
                type="date"
                value={draftDate}
                onChange={(e) => setDraftDate(e.target.value)}
                className="rounded-[8px] border border-ceci-border-default bg-[var(--ds-surface-raised)] px-2 py-1 text-sm text-ceci-primary"
              />
            </label>
            {isTimed && (
              <label className="flex items-center justify-between gap-2 text-xs text-ceci-secondary">
                horário
                <input
                  type="time"
                  value={draftTime}
                  onChange={(e) => setDraftTime(e.target.value)}
                  className="rounded-[8px] border border-ceci-border-default bg-[var(--ds-surface-raised)] px-2 py-1 text-sm text-ceci-primary"
                />
              </label>
            )}
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="flex-1 rounded-[8px] border border-ceci-border-default py-1.5 text-sm font-medium text-ceci-muted transition-colors hover:bg-black/[0.03]"
              >
                cancelar
              </button>
              <button
                type="button"
                onClick={confirmEditor}
                className="flex-1 rounded-[8px] bg-[var(--color-ceci-primary)] py-1.5 text-sm font-semibold text-white transition-colors hover:bg-ceci-primary-hover"
              >
                salvar
              </button>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={onStartTimer}
          className="flex items-center justify-center gap-2 rounded-[10px] bg-[var(--color-ceci-primary)] py-2 text-sm font-semibold text-white transition-colors hover:bg-ceci-primary-hover"
        >
          <Play className="h-3.5 w-3.5" />
          iniciar timer
        </button>
      </div>
    </aside>
  );
};
