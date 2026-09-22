import React, { useCallback, useEffect, useState } from 'react';
import { CheckCircle2, Timer } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { celebrate } from '../../lib/celebrate';
import { hapticSuccess } from '../../lib/haptics';
import { focusController } from '../../lib/focusController';
import {
  releaseFocusOrientation,
  requestFocusLandscape,
  restoreFocusChrome,
  setupFocusChrome,
} from '../../lib/focusOrientation';
import { useFocusTimer } from '../../lib/useFocusTimer';
import { Picker } from '../ui/Picker';
import { Modal } from '../ui/Modal';
import { FocusImmersiveView } from './FocusImmersiveView';

const toISODate = (d: Date) => d.toISOString().split('T')[0];
const HINT = 'dica do cecinho: sem pressa, sem culpa. cada minutinho conta no seu cantinho ♡';

/**
 * Orquestrador da sessão de foco imersiva (EST-002). Fica fino: o timer é
 * `useFocusTimer` (relógio de parede), o chrome preto é `FocusImmersiveView`
 * (portal) e a orientação/status bar ficam em `focusOrientation`. As sheets
 * de salvar sessão / reiniciar / sair permanecem aqui (Modal z-50 sobre o
 * chrome preto z-45).
 */
export const StudyFocusScreen: React.FC = () => {
  const { courses, handleAddSession, showToast, closeStudy } = useMobileApp();

  const [durationMin, setDurationMin] = useState(25);
  const timer = useFocusTimer(durationMin * 60_000);
  const [sessionTopic, setSessionTopic] = useState('');
  const [sessionCourseId, setSessionCourseId] = useState('');
  const [showSaveSession, setShowSaveSession] = useState(false);
  const [pendingReset, setPendingReset] = useState(false);
  const [pendingExit, setPendingExit] = useState(false);

  // Chrome imersivo: aplica ao entrar, restaura ao sair (idempotente).
  useEffect(() => {
    void setupFocusChrome();
    void requestFocusLandscape();
    focusController.setActive(true);
    return () => {
      focusController.setActive(false);
      focusController.setRunning(false);
      void restoreFocusChrome();
      void releaseFocusOrientation();
    };
  }, []);

  // Fim do timer → celebra + sheet de registro.
  useEffect(() => {
    if (timer.isFinishedNow) {
      timer.pause();
      celebrate('session-done');
      hapticSuccess();
      setShowSaveSession(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timer.isFinishedNow]);

  // Guarda de back: o shell interrompe a navegação enquanto o timer roda e
  // emite aqui — abrimos a confirmação de saída.
  useEffect(() => {
    return focusController.onBackRequested(() => setPendingExit(true));
  }, []);

  const toggleLabel: 'iniciar' | 'retomar' | 'pausar' = timer.isRunning
    ? 'pausar'
    : timer.elapsed > 0
      ? 'retomar'
      : 'iniciar';

  const changeMin = useCallback(
    (minutes: number) => {
      setDurationMin(minutes);
      timer.setDuration(minutes);
    },
    [timer]
  );

  const clearSessionFields = useCallback(() => {
    setSessionTopic('');
    setSessionCourseId('');
  }, []);

  const saveSession = useCallback(() => {
    handleAddSession({
      id: 'ss-' + Date.now(),
      courseId: sessionCourseId || undefined,
      topic: sessionTopic.trim() || 'sessão de foco',
      date: toISODate(new Date()),
      durationMinutes: timer.presetMin,
    });
    hapticSuccess();
    showToast('sessão de estudo registrada com carinho ♡');
    clearSessionFields();
    setShowSaveSession(false);
    timer.reset();
  }, [handleAddSession, sessionCourseId, sessionTopic, showToast, clearSessionFields, timer]);

  /** Guarda o tempo já decorrido (parcial) e zera o timer. */
  const savePartialSession = useCallback(() => {
    handleAddSession({
      id: 'ss-' + Date.now(),
      courseId: sessionCourseId || undefined,
      topic: sessionTopic.trim() || 'sessão de foco',
      date: toISODate(new Date()),
      durationMinutes: Math.max(1, timer.partial),
    });
    hapticSuccess();
    showToast(`${Math.max(1, timer.partial)} min registrados com carinho ♡`);
    clearSessionFields();
    setPendingReset(false);
    setPendingExit(false);
    timer.reset();
  }, [handleAddSession, sessionCourseId, sessionTopic, showToast, clearSessionFields, timer]);

  const confirmExit = useCallback(() => {
    clearSessionFields();
    setPendingExit(false);
    setShowSaveSession(false);
    timer.reset();
    closeStudy();
  }, [clearSessionFields, timer, closeStudy]);

  const canSavePartial = timer.elapsed >= 60;

  return (
    <>
      <FocusImmersiveView
        isRunning={timer.isRunning}
        activeMin={timer.presetMin}
        remainingSeconds={Math.ceil(timer.remaining / 1000)}
        toggleLabel={toggleLabel}
        elapsedMinutes={timer.partial}
        canSavePartial={canSavePartial}
        onToggle={timer.toggle}
        onReset={() => setPendingReset(true)}
        onSavePartial={canSavePartial ? savePartialSession : () => {}}
        onExit={() => setPendingExit(true)}
        onChangeMin={changeMin}
        hint={HINT}
      />

      {/* Registro da sessão concluída */}
      <Modal open={showSaveSession} onClose={() => setShowSaveSession(false)} closeOnBackdrop={false}>
        <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6 text-left">
          <p className="font-display font-bold text-lg text-ceci-primary flex items-center gap-1.5 mb-2">
            <Timer className="w-4 h-4 text-ceci-brand" /> guardar sessão de {timer.presetMin} min?
          </p>
          <div className="space-y-3">
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
                options={[
                  { value: '', label: 'geral' },
                  ...courses.map((c) => ({ value: c.id, label: c.name })),
                ]}
                placeholder="geral"
                buttonClassName="bg-surface-default border border-ceci-border-default rounded-xl px-3 py-2 text-xs"
                sheetTitle="disciplina da sessão"
              />
            </div>
          </div>
          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              onClick={() => {
                setShowSaveSession(false);
                timer.reset();
              }}
              className="px-4 py-2 rounded-xl text-xs text-ceci-secondary hover:bg-surface-default transition-colors cursor-pointer"
            >
              descartar
            </button>
            <button
              onClick={saveSession}
              className="flex items-center gap-1.5 bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>guardar sessão</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Reiniciar sessão */}
      <Modal open={pendingReset} onClose={() => setPendingReset(false)} closeOnBackdrop={false}>
        <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6 text-left">
          <h3 className="font-display font-bold text-lg text-ceci-primary mb-2">reiniciar sessão?</h3>
          <p className="text-sm text-ceci-secondary leading-relaxed mb-5">
            isso zera o timer e descarta o tempo já decorrido. tem certeza?
          </p>
          <div className={`flex gap-2 ${canSavePartial ? 'flex-col' : ''}`}>
            {canSavePartial && (
              <button
                onClick={savePartialSession}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand cursor-pointer active:scale-95 transition-transform"
              >
                <CheckCircle2 className="w-4 h-4 inline -mt-0.5 mr-1" />
                guardar {timer.partial} min estudados
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
                onClick={() => {
                  setPendingReset(false);
                  timer.reset();
                }}
                className="flex-1 py-3 rounded-2xl text-sm font-semibold text-ceci-on-brand bg-ceci-brand hover:bg-ceci-brand-strong cursor-pointer active:scale-95 transition-transform"
              >
                confirmar
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* Sair de uma sessão em andamento */}
      <Modal open={pendingExit} onClose={() => setPendingExit(false)} closeOnBackdrop={false}>
        <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6 text-left">
          <h3 className="font-display font-bold text-lg text-ceci-primary mb-2">encerrar a sessão agora?</h3>
          <p className="text-sm text-ceci-secondary leading-relaxed mb-5">
            {canSavePartial
              ? `tem ${timer.partial} min estudados. quer guardar antes de sair?`
              : 'o tempo de hoje ainda não completa 1 minuto.'}
          </p>
          <div className="flex flex-col gap-2">
            {canSavePartial && (
              <button
                onClick={() => {
                  savePartialSession();
                  closeStudy();
                }}
                className="w-full py-3 rounded-2xl text-sm font-semibold text-ceci-brand-strong bg-surface-rose border border-ceci-border-brand cursor-pointer active:scale-95 transition-transform"
              >
                guardar {timer.partial} min e sair
              </button>
            )}
            <button
              onClick={confirmExit}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-ceci-on-brand bg-ceci-brand hover:bg-ceci-brand-strong cursor-pointer active:scale-95 transition-transform"
            >
              sair sem guardar
            </button>
            <button
              onClick={() => setPendingExit(false)}
              className="w-full py-3 rounded-2xl text-sm font-semibold text-ceci-secondary bg-surface-default border border-ceci-border-default cursor-pointer active:scale-95 transition-transform"
            >
              continuar focando
            </button>
          </div>
        </div>
      </Modal>
    </>
  );
};