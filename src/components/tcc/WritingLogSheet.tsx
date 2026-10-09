import React, { useEffect, useState } from 'react';
import { useMobileApp } from '@/context/mobileApp';
import {
  THESIS_ID,
  newWritingLogId,
  orderChaptersForRender,
  type ThesisWritingLog,
} from '../../types';
import { Modal } from '../ui/Modal';
import { todayKeyLocal } from '../../lib/dateBR';
import { hapticTap, hapticWarning } from '../../lib/haptics';

/**
 * Sheet "registrar escrita" (SPEC-012 F5.2) — a ação primária do hero.
 *
 * Uma sessão de escrita: capítulo (opcional), palavras escritas, minutos e nota.
 * Salvar faz **uma** ação de escrita: o log entra em `thesisWritingLogs` e, quando
 * há capítulo, o `wordCount` dele é somado na mesma operação (§4.5) — o log é o
 * delta, o `wordCount` é o total informado.
 *
 * Regras de número (§5.4): `inputMode="numeric"`, rejeita negativo, vazio = não
 * informado (≠ 0). `words` é obrigatório para guardar: uma sessão sem palavras e
 * sem minutos não diz nada; "só revisei" se registra com `0`.
 */
interface WritingLogSheetProps {
  open: boolean;
  onClose: () => void;
  /** Capítulo pré-selecionado (ex.: aberto da linha do capítulo). */
  defaultChapterId?: string;
}

const inputClass =
  'w-full bg-surface-default border border-ceci-border-default rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand';
const labelClass = 'block text-xs font-medium text-ceci-secondary mb-1';

/** Inteiro ≥ 0, ou `undefined` (vazio = não informado, ≠ 0). */
const parseCount = (raw: string): number | undefined => {
  const n = Number(raw);
  if (raw.trim() === '' || !Number.isInteger(n) || n < 0) return undefined;
  return n;
};

export const WritingLogSheet: React.FC<WritingLogSheetProps> = ({
  open,
  onClose,
  defaultChapterId,
}) => {
  const { thesisChapters, setThesisChapters, setThesisWritingLogs, showToast } = useMobileApp();

  const [chapterId, setChapterId] = useState('');
  const [words, setWords] = useState('');
  const [minutes, setMinutes] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!open) return;
    setChapterId(defaultChapterId ?? '');
    setWords('');
    setMinutes('');
    setNote('');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, defaultChapterId]);

  const chapters = orderChaptersForRender(thesisChapters);

  const save = () => {
    const parsedWords = parseCount(words);
    if (parsedWords === undefined) {
      // Vazio não vira 0 (seria inventar dado); "só revisei" se registra com 0.
      hapticWarning();
      showToast('quantas palavras você escreveu? pode ser 0 ♡');
      return;
    }
    const now = new Date().toISOString();
    const chosen = chapterId || undefined;
    const draft: ThesisWritingLog = {
      id: newWritingLogId(),
      thesisId: THESIS_ID,
      date: todayKeyLocal(),
      chapterId: chosen,
      words: parsedWords,
      minutes: parseCount(minutes),
      note: note.trim() || undefined,
      createdAt: now,
      updatedAt: now,
    };

    // Uma ação de escrita: o log entra e, se há capítulo, o `wordCount` sobe junto.
    setThesisWritingLogs((prev) => [...prev, draft]);
    if (chosen && parsedWords > 0) {
      setThesisChapters((prev) =>
        prev.map((c) =>
          c.id === chosen
            ? { ...c, wordCount: (c.wordCount ?? 0) + parsedWords, updatedAt: now }
            : c,
        ),
      );
    }

    hapticTap();
    showToast('sessão guardada ♡');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} position="bottom" className="w-full max-w-lg">
      <div className="w-full bg-canvas rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl overflow-hidden p-5 sm:p-6 text-ceci-primary space-y-4">
        <h3 className="font-display font-bold text-base text-ceci-primary">registrar escrita</h3>

        <div>
          <label htmlFor="wl-cap" className={labelClass}>capítulo</label>
          <select
            id="wl-cap"
            value={chapterId}
            onChange={(e) => setChapterId(e.target.value)}
            className={inputClass}
          >
            <option value="">— sem capítulo —</option>
            {chapters.map((c) => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="wl-palavras" className={labelClass}>palavras escritas</label>
            <input
              id="wl-palavras"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={words}
              onChange={(e) => setWords(e.target.value)}
              className={inputClass}
              placeholder="ex.: 300"
            />
          </div>
          <div>
            <label htmlFor="wl-minutos" className={labelClass}>minutos</label>
            <input
              id="wl-minutos"
              type="number"
              inputMode="numeric"
              min={0}
              step={1}
              value={minutes}
              onChange={(e) => setMinutes(e.target.value)}
              className={inputClass}
              placeholder="opcional"
            />
          </div>
        </div>

        <div>
          <label htmlFor="wl-nota" className={labelClass}>nota</label>
          <textarea
            id="wl-nota"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className={inputClass}
            placeholder="o que fluiu, onde travou…"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-ceci-border-subtle">
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
    </Modal>
  );
};
