import React, { useEffect, useMemo, useState } from 'react';
import { Link2 } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { Modal } from '../ui/Modal';
import { SegmentedControl } from '../ui/SegmentedControl';
import { hapticSuccess, hapticWarning } from '../../lib/haptics';
import { minimizeAfterCapture } from '../../lib/captureLink';
import {
  captureLink,
  extractFirstUrl,
  isValidUrl,
  type CaptureKind,
} from '../../types';
import { CAPTURE_COPY } from './captureCopy';

interface CaptureLinkSheetProps {
  open: boolean;
  /** Texto/URL já disponível (clipboard ou compartilhamento). Vazio = campo. */
  initialText?: string;
  onClose: () => void;
}

const inputClass =
  'w-full bg-surface-default border border-ceci-border-default rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand';
const labelClass = 'block text-xs font-medium text-ceci-secondary mb-1';

const KIND_OPTIONS: { value: CaptureKind; label: string }[] = [
  { value: 'artigo', label: CAPTURE_COPY.kindArticle },
  { value: 'leitura', label: CAPTURE_COPY.kindReading },
];

const hostOf = (url: string): string => {
  try {
    return new URL(url).host;
  } catch {
    return url;
  }
};

/**
 * Sheet de captura (SPEC-012 §8.6, F8.2): dois controles e um botão. A camada 2
 * (deep link) salva direto e não abre a sheet; a camada 1 abre com o link do
 * clipboard (ou campo para colar à mão). O guardar é **uma escrita por ação**
 * (`captureLink`, §8.5): leitura na estante + referência no TCC juntas.
 */
export const CaptureLinkSheet: React.FC<CaptureLinkSheetProps> = ({
  open,
  initialText,
  onClose,
}) => {
  const { readings, handleAddReading, setThesisReferences, showToast } = useMobileApp();
  const [text, setText] = useState(initialText ?? '');
  const [kind, setKind] = useState<CaptureKind>('artigo');
  const [thesis, setThesis] = useState(true);

  // Nada é "lembrado" entre capturas (Q2): ao reabrir, volta ao padrão.
  useEffect(() => {
    if (!open) return;
    setText(initialText ?? '');
    setKind('artigo');
    setThesis(true);
  }, [open, initialText]);

  const url = useMemo(() => extractFirstUrl(text) ?? text.trim(), [text]);
  const valid = isValidUrl(url);

  const save = () => {
    const outcome = captureLink({ url, kind, thesis }, readings, new Date().toISOString());
    if (outcome.outcome === 'invalida') {
      hapticWarning();
      showToast(CAPTURE_COPY.invalid);
      return;
    }
    if (outcome.outcome === 'duplicada') {
      showToast(CAPTURE_COPY.duplicate);
      onClose();
      return;
    }
    handleAddReading(outcome.reading);
    const reference = outcome.reference;
    if (reference) setThesisReferences((prev) => [...prev, reference]);
    hapticSuccess();
    showToast(reference ? CAPTURE_COPY.savedToThesis : CAPTURE_COPY.saved);
    onClose();
    void minimizeAfterCapture();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      position="bottom"
      className="w-full max-w-lg"
      labelledBy="capture-link-title"
    >
      <div className="w-full bg-canvas rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl overflow-hidden p-5 sm:p-6 text-ceci-primary space-y-4">
        <h3
          id="capture-link-title"
          className="font-display font-bold text-base text-ceci-primary"
        >
          {CAPTURE_COPY.title}
        </h3>

        {valid ? (
          <div className="flex items-start gap-2.5 bg-surface-muted rounded-xl p-3.5 border border-ceci-border-default">
            <Link2 className="w-4 h-4 text-ceci-brand-strong shrink-0 mt-0.5" />
            <div className="min-w-0">
              <p className="font-display font-bold text-sm text-ceci-primary truncate">
                {hostOf(url)}
              </p>
              <p className="text-[11px] text-ceci-secondary truncate">{url}</p>
            </div>
          </div>
        ) : (
          <div>
            <label htmlFor="capture-link-input" className={labelClass}>
              {CAPTURE_COPY.fieldLabel}
            </label>
            <input
              id="capture-link-input"
              type="url"
              value={text}
              onChange={(e) => setText(e.target.value)}
              className={inputClass}
              placeholder={CAPTURE_COPY.placeholder}
              autoComplete="off"
              autoCapitalize="none"
            />
            {text.trim().length > 0 && (
              <p role="status" className="text-[11px] text-status-warning-strong mt-1">
                {CAPTURE_COPY.invalidHint}
              </p>
            )}
          </div>
        )}

        <div>
          <label className={labelClass}>{CAPTURE_COPY.kindLabel}</label>
          <SegmentedControl<CaptureKind>
            variant="rose"
            ariaLabel={CAPTURE_COPY.kindLabel}
            className="w-full [&>button]:flex-1"
            value={kind}
            onChange={setKind}
            options={KIND_OPTIONS}
          />
          <p className="text-[10px] text-ceci-tertiary mt-1">{CAPTURE_COPY.kindReadingHint}</p>
        </div>

        <div>
          <label className={labelClass}>{CAPTURE_COPY.thesisLabel}</label>
          <SegmentedControl<'sim' | 'nao'>
            variant="primary"
            ariaLabel={CAPTURE_COPY.thesisLabel}
            className="w-full [&>button]:flex-1"
            value={thesis ? 'sim' : 'nao'}
            onChange={(v) => setThesis(v === 'sim')}
            options={[
              { value: 'sim', label: CAPTURE_COPY.thesisYes },
              { value: 'nao', label: CAPTURE_COPY.thesisNo },
            ]}
          />
        </div>

        <button
          type="button"
          onClick={save}
          disabled={!valid}
          aria-label="guardar link"
          className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-full bg-ceci-brand text-ceci-on-brand text-xs font-bold transition-transform active:scale-[0.98] disabled:opacity-40 disabled:active:scale-100 cursor-pointer disabled:cursor-not-allowed"
        >
          {CAPTURE_COPY.save}
        </button>
      </div>
    </Modal>
  );
};
