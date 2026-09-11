import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Timer, CheckCircle2, Sparkles } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { celebrate } from '../../lib/celebrate';
import { hapticSuccess } from '../../lib/haptics';
import { PillGroup } from '../ui/PillGroup';
import { Picker } from '../ui/Picker';
import { Modal } from '../ui/Modal';

const PRESETS = [25, 45, 15];
/** Opções do timer customizável: 5 a 120 min, de 5 em 5. */
const CUSTOM_MINUTES = Array.from({ length: 24 }, (_, i) => (i + 1) * 5);
const toISODate = (d: Date) => d.toISOString().split('T')[0];

/** Tela dedicada de sessão de foco (timer em tela cheia). */
export const StudyFocusScreen: React.FC = () => {
  const { courses, handleAddSession, showToast } = useMobileApp();

  const [preset, setPreset] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionCourseId, setSessionCourseId] = useState('');
  const [showSaveSession, setShowSaveSession] = useState(false);
  const [pendingReset, setPendingReset] = useState(false);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      const t = setTimeout(() => setTimeLeft((prev) => prev - 1), 1000);
      return () => clearTimeout(t);
    }
    if (timeLeft === 0 && isRunning) {
      setIsRunning(false);
      setShowSaveSession(true);
      celebrate('session-done');
      hapticSuccess();
    }
  }, [isRunning, timeLeft]);

  const toggleTimer = () => setIsRunning((r) => !r);

  const resetTimer = (mins: number = preset) => {
    setIsRunning(false);
    setPreset(mins);
    setTimeLeft(mins * 60);
    setShowSaveSession(false);
    setPendingReset(false);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const saveSession = () => {
    handleAddSession({
      id: 'ss-' + Date.now(),
      courseId: sessionCourseId || undefined,
      topic: sessionTopic.trim() || 'sessão de foco',
      date: toISODate(new Date()),
      durationMinutes: preset,
    });
    hapticSuccess();
    showToast('sessão de estudo registrada com carinho ♡');
    setSessionTopic('');
    setShowSaveSession(false);
    resetTimer();
  };

  const progressPct = 100 - (timeLeft / (preset * 60)) * 100;
  const toggleLabel = isRunning ? 'pausar' : preset * 60 - timeLeft > 0 ? 'retomar' : 'iniciar';
  const elapsedSeconds = Math.max(0, preset * 60 - timeLeft);
  const elapsedMinutes = Math.floor(elapsedSeconds / 60);

  /** Guarda o tempo já estudado (parcial) e zera o timer. */
  const savePartialSession = () => {
    handleAddSession({
      id: 'ss-' + Date.now(),
      courseId: sessionCourseId || undefined,
      topic: sessionTopic.trim() || 'sessão de foco',
      date: toISODate(new Date()),
      durationMinutes: Math.max(1, elapsedMinutes),
    });
    hapticSuccess();
    showToast(`${elapsedMinutes} min registrados com carinho ♡`);
    setSessionTopic('');
    setPendingReset(false);
    resetTimer();
  };

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-4">
      <div className="rounded-2xl p-6 bg-surface-default border border-ceci-border-default shadow-sm text-center space-y-4">
        <h2 className="font-display text-xl font-bold text-ceci-primary">cantinho de foco ceci</h2>
        <p className="text-xs text-ceci-secondary -mt-2">
          {isRunning ? '✨ em andamento...' : timeLeft === 0 ? 'finalizada!' : 'pronto para começar'}
        </p>

        {/* Presets + custom */}
        <div className="flex items-center justify-center gap-2">
          <PillGroup
            variant="primary"
            options={PRESETS.map((mins) => ({ value: String(mins), label: `${mins} min` }))}
            value={PRESETS.includes(preset) ? String(preset) : ''}
            onChange={(v) => resetTimer(Number(v))}
          />
          <Picker
            label="minutos customizados"
            value=""
            onChange={(v) => resetTimer(Number(v))}
            options={CUSTOM_MINUTES.map((mins) => ({ value: String(mins), label: `${mins} min` }))}
            placeholder="custom"
            buttonClassName={`px-3.5 py-2 rounded-full text-xs font-semibold border transition-colors ${
              PRESETS.includes(preset)
                ? 'bg-surface-default text-ceci-tertiary border-ceci-border-default'
                : 'bg-ceci-primary text-white border-ceci-primary'
            }`}
            sheetTitle="quantos minutos de foco?"
          />
        </div>

        {/* Timer */}
        <div className="relative w-52 h-52 mx-auto">
          <svg viewBox="0 0 200 200" className="w-full h-full -rotate-90">
            <circle cx="100" cy="100" r="88" fill="none" stroke="var(--color-ceci-border-subtle)" strokeWidth="10" />
            <circle
              cx="100"
              cy="100"
              r="88"
              fill="none"
              stroke="var(--color-ceci-brand)"
              strokeWidth="10"
              strokeLinecap="round"
              strokeDasharray={2 * Math.PI * 88}
              strokeDashoffset={2 * Math.PI * 88 * (1 - progressPct / 100)}
              className="transition-[width] duration-1000 ease-linear"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="font-display font-bold text-5xl text-ceci-primary">{formatTime(timeLeft)}</span>
            <span className="text-xs text-ceci-secondary mt-1">
              {preset} min de foco
            </span>
          </div>
        </div>

        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            onClick={toggleTimer}
            className="flex items-center gap-2 bg-ceci-brand hover:bg-ceci-brand-strong text-white px-6 py-2.5 rounded-full text-xs font-semibold shadow-xs cursor-pointer"
          >
            {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white" />}
            <span>{toggleLabel}</span>
          </button>
          <button
            onClick={() => setPendingReset(true)}
            className="p-2.5 rounded-full bg-surface-muted border border-ceci-border-default text-ceci-primary cursor-pointer"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Registro da sessão concluída */}
      {showSaveSession && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-4 rounded-2xl bg-surface-subtle border border-ceci-border-subtle text-left space-y-3"
        >
          <p className="text-xs font-semibold text-ceci-primary flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-ceci-brand" /> guardar sessão de {preset} min?
          </p>
          <div>
            <label className="block text-xs font-medium text-ceci-secondary mb-1">o que você estudou?</label>
            <input
              type="text"
              value={sessionTopic}
              onChange={(e) => setSessionTopic(e.target.value)}
              placeholder="ex: revisar semiologia dos transtornos do humor"
              className="w-full bg-surface-default border border-ceci-border-default rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ceci-secondary mb-1">disciplina</label>
            <Picker
            label="disciplina"
            value={sessionCourseId}
            onChange={setSessionCourseId}
            options={[{ value: '', label: 'geral' }, ...courses.map((c) => ({ value: c.id, label: c.name }))]}
            placeholder="geral"
            buttonClassName="bg-surface-default border border-ceci-border-default rounded-xl px-3 py-2 text-xs"
            sheetTitle="disciplina da sessão"
          />
          </div>
          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              onClick={() => resetTimer()}
              className="px-4 py-2 rounded-xl text-xs text-ceci-secondary hover:bg-white transition-colors cursor-pointer"
            >
              descartar
            </button>
            <button
              onClick={saveSession}
              className="flex items-center gap-1.5 bg-ceci-brand hover:bg-ceci-brand-strong text-white px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>guardar sessão</span>
            </button>
          </div>
        </motion.div>
      )}

      <div className="rounded-xl p-4 bg-surface-rose border border-ceci-border-brand flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-ceci-brand-strong shrink-0" />
        <p className="text-xs text-ceci-secondary leading-relaxed">
          dica do cecinho: sem pressa, sem culpa. cada minutinho conta no seu cantinho ♡
        </p>
      </div>

      <Modal open={pendingReset} onClose={() => setPendingReset(false)} closeOnBackdrop={false}>
        <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6">
          <h3 className="font-display font-bold text-lg text-ceci-primary mb-2">reiniciar sessão?</h3>
          <p className="text-sm text-ceci-secondary leading-relaxed mb-5">
            isso zera o timer e descarta o tempo já decorrido. tem certeza?
          </p>
          <div className={`flex gap-2 ${elapsedMinutes >= 1 ? 'flex-col' : ''}`}>
            {elapsedMinutes >= 1 && (
              <button
                onClick={savePartialSession}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand cursor-pointer active:scale-95 transition-transform"
              >
                <CheckCircle2 className="w-4 h-4 inline -mt-0.5 mr-1" />
                guardar {elapsedMinutes} min estudados
              </button>
            )}
            <div className="flex gap-2">
              <button
                onClick={() => setPendingReset(false)}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-surface-default border border-ceci-border-default cursor-pointer active:scale-95 transition-transform"
              >
                cancelar
              </button>
              <button
                onClick={() => resetTimer()}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-white bg-ceci-brand hover:bg-ceci-brand-strong cursor-pointer active:scale-95 transition-transform"
              >
                confirmar
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};
