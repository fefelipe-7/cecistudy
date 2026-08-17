import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play, Pause, RotateCcw, Timer, CheckCircle2, Sparkles } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { celebrate } from '../../lib/celebrate';
import { hapticSuccess } from '../../lib/haptics';

const PRESETS = [25, 45, 15];
const toISODate = (d: Date) => d.toISOString().split('T')[0];

/** Tela dedicada de sessão de foco (timer em tela cheia). */
export const StudyFocusScreen: React.FC = () => {
  const { courses, handleAddSession, showToast } = useApp();

  const [preset, setPreset] = useState(25);
  const [timeLeft, setTimeLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionCourseId, setSessionCourseId] = useState('');
  const [showSaveSession, setShowSaveSession] = useState(false);

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

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md sm:max-w-xl mx-auto space-y-4"
    >
      <div className="rounded-[24px] p-6 bg-white border border-ceci-border-default shadow-sm text-center space-y-4">
        <h2 className="font-display text-xl font-bold text-ceci-primary">cantinho de foco ceci</h2>
        <p className="text-xs text-ceci-secondary -mt-2">
          {isRunning ? '✨ em andamento...' : timeLeft === 0 ? 'finalizada!' : 'pronto para começar'}
        </p>

        {/* Presets */}
        <div className="flex items-center justify-center gap-2">
          {PRESETS.map((mins) => (
            <button
              key={mins}
              onClick={() => resetTimer(mins)}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold tap-interactive cursor-pointer border ${
                preset === mins
                  ? 'bg-ceci-primary text-white border-ceci-primary shadow-xs'
                  : 'bg-white text-ceci-secondary border-ceci-border-default hover:bg-surface-muted'
              }`}
            >
              {mins} min
            </button>
          ))}
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
              className="transition-all duration-1000 ease-linear"
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
            <span>{isRunning ? 'pausar' : 'iniciar'}</span>
          </button>
          <button
            onClick={() => resetTimer()}
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
              className="w-full bg-white border border-ceci-border-default rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-ceci-secondary mb-1">disciplina</label>
            <select
              value={sessionCourseId}
              onChange={(e) => setSessionCourseId(e.target.value)}
              className="w-full bg-white border border-ceci-border-default rounded-xl px-3 py-2 text-xs focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand"
            >
              <option value="">geral</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
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

      <div className="rounded-[20px] p-4 bg-surface-rose border border-ceci-border-brand flex items-center gap-3">
        <Sparkles className="w-5 h-5 text-ceci-brand-strong shrink-0" />
        <p className="text-xs text-ceci-secondary leading-relaxed">
          dica da ceci: sem pressa, sem culpa. cada minutinho conta no seu cantinho ♡
        </p>
      </div>
    </motion.div>
  );
};
