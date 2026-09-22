import React from 'react';
import { createPortal } from 'react-dom';
import { Pause, Play, RotateCcw } from 'lucide-react';
import { Picker } from '../ui/Picker';

export const FOCUS_PRESETS = [25, 45, 15];
/** Opções do timer customizável: 5 a 120 min, de 5 em 5. */
export const FOCUS_CUSTOM_MINUTES = Array.from({ length: 24 }, (_, i) => (i + 1) * 5);

export const formatFocusTime = (secs: number) => {
  const clamped = Math.max(0, secs);
  const m = Math.floor(clamped / 60);
  const s = Math.floor(clamped % 60);
  return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
};

interface FocusImmersiveViewProps {
  isRunning: boolean;
  /** Duração da fase atual em minutos (para presets/progresso). */
  activeMin: number;
  /** Segundos restantes (visto no relógio gigante). */
  remainingSeconds: number;
  toggleLabel: 'iniciar' | 'retomar' | 'pausar';
  elapsedMinutes: number;
  /** Pode guardar parcial (>= 1 min decorrido)? */
  canSavePartial: boolean;
  onToggle: () => void;
  onReset: () => void;
  onSavePartial: () => void;
  onExit: () => void;
  onChangeMin: (minutes: number) => void;
  hint: string;
}

/**
 * Chrome imersivo do foco: camada preta full-screen via portal para o body
 * (z-45; modais em z-50 cobrem por cima). Presentacional — toda a lógica de
 * timer/orientação/sessão fica no orquestrador/`useFocusTimer`.
 */
export const FocusImmersiveView: React.FC<FocusImmersiveViewProps> = ({
  isRunning,
  activeMin,
  remainingSeconds,
  toggleLabel,
  elapsedMinutes,
  canSavePartial,
  onToggle,
  onReset,
  onSavePartial,
  onExit,
  onChangeMin,
  hint,
}) => {
  const presetSelected = FOCUS_PRESETS.includes(activeMin);
  const pct = Math.min(100, Math.max(0, 1 - remainingSeconds / (activeMin * 60)));
  const R = 88;
  const C = 2 * Math.PI * R;
  const customLabel = `${activeMin} min`;

  return createPortal(
    <div
      className="focus-immersive"
      role="timer"
      aria-label={`timer do foco: ${formatFocusTime(remainingSeconds)} restantes`}
    >
      <div className="focus-top">
        <span className="focus-top-label">cantinho de foco ♡</span>
        <button type="button" className="focus-exit" onClick={onExit}>
          sair
        </button>
      </div>

      <div className="focus-preset-row">
        {FOCUS_PRESETS.map((min) => (
          <button
            key={min}
            type="button"
            className={`focus-pill ${activeMin === min ? 'focus-pill-active' : ''}`}
            onClick={() => onChangeMin(min)}
          >
            {min} min
          </button>
        ))}
        <Picker
          label="minutos customizados"
          value=""
          onChange={(v) => onChangeMin(Number(v))}
          options={FOCUS_CUSTOM_MINUTES.map((mins) => ({ value: String(mins), label: `${mins} min` }))}
          placeholder={presetSelected ? 'custom' : customLabel}
          buttonClassName={`focus-pill focus-pill-static ${presetSelected ? '' : 'focus-pill-active'}`}
          sheetTitle="quantos minutos de foco?"
        />
      </div>

      <button
        type="button"
        onClick={onToggle}
        aria-label={isRunning ? 'pausar timer' : 'iniciar ou retomar timer'}
        className="focus-clock-button"
      >
        <svg viewBox="0 0 200 200" className="focus-ring" aria-hidden="true">
          <circle cx="100" cy="100" r={R} fill="none" stroke="var(--color-focus-track)" strokeWidth="10" />
          <circle
            cx="100"
            cy="100"
            r={R}
            fill="none"
            stroke="var(--color-focus-accent)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
          />
        </svg>
        <div className="flex flex-col items-center">
          <span className="focus-clock">{formatFocusTime(remainingSeconds)}</span>
          <span className="focus-toggle">
            {toggleLabel}
            {isRunning ? ' ...' : ''}
          </span>
        </div>
      </button>

      <div className="focus-bottom">
        <div className="focus-controls">
          {canSavePartial && (
            <button type="button" className="focus-save" onClick={onSavePartial}>
              guardar {elapsedMinutes} min
            </button>
          )}
          <button
            type="button"
            className="focus-reset"
            onClick={onReset}
            aria-label="reiniciar sessão"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
        <p className="focus-hint">{hint}</p>
      </div>
    </div>,
    document.body
  );
};