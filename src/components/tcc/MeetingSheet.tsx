import React, { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import {
  THESIS_ID,
  newMeetingId,
  newTaskId,
  type MeetingMode,
  type ThesisMeeting,
  type ThesisTask,
} from '../../types';
import { Modal } from '../ui/Modal';
import { SegmentedControl } from '../ui/SegmentedControl';
import { TagChip } from '../ui/TagChip';
import { hapticTap, hapticWarning } from '../../lib/haptics';
import { todayKeyLocal } from '../../lib/dateBR';

/**
 * Sheet da reunião de orientação (SPEC-012 F6.2/F6.4) — duas intenções, uma
 * escrita por ação.
 *
 * - `agendar`: data (obrigatória), hora (opcional) e modo. Reunião nasce
 *   `agendada` e, por isso, passa a aparecer no calendário e a gerar lembrete
 *   (o motor é derivado — `planThesisReminders`, F4.6; nada é duplicado aqui).
 * - `registrar`: resumo e decisões. Vira `realizada` numa escrita e abre a
 *   geração de pendências: cada decisão marcada vira
 *   `ThesisTask(origin: 'orientadora', meetingId)` e, se pedido, "agendar a
 *   próxima" cria outra `ThesisMeeting` `agendada` — tudo na **mesma ação**
 *   (o precedente é `ChapterSheet.remove`, dois setters por ação).
 *
 * Lê a reunião viva pelo id; os campos são locais.
 */
interface MeetingSheetProps {
  open: boolean;
  /** `'new'` cria; qualquer outro id edita/registra. */
  meetingId: string | 'new';
  /** Intenção inicial. Em reunião já `realizada`, sempre cai no resumo. */
  intent: 'agendar' | 'registrar';
  onClose: () => void;
}

const inputClass =
  'w-full bg-surface-default border border-ceci-border-default rounded-xl px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand';
const labelClass = 'block text-xs font-medium text-ceci-secondary mb-1';

const MODE_OPTIONS: { value: MeetingMode; label: string }[] = [
  { value: 'presencial', label: 'presencial' },
  { value: 'online', label: 'online' },
  { value: 'mensagem', label: 'mensagem' },
];

type Mode = 'agendar' | 'registrar';

export const MeetingSheet: React.FC<MeetingSheetProps> = ({
  open,
  meetingId,
  intent,
  onClose,
}) => {
  const { thesisMeetings, thesisTasks, setThesisMeetings, setThesisTasks, showToast } =
    useMobileApp();

  const live = meetingId === 'new' ? undefined : thesisMeetings.find((m) => m.id === meetingId);

  const [resolvedId, setResolvedId] = useState('');
  const [mode, setMode] = useState<Mode>('agendar');
  const [phase, setPhase] = useState<'form' | 'gerar'>('form');

  // agenda
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [meetingMode, setMeetingMode] = useState<MeetingMode>('presencial');

  // registro
  const [summary, setSummary] = useState('');
  const [decisions, setDecisions] = useState<string[]>([]);
  const [decisionDraft, setDecisionDraft] = useState('');

  // geração de pendências (F6.4)
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [nextEnabled, setNextEnabled] = useState(false);
  const [nextDate, setNextDate] = useState('');
  const [nextTime, setNextTime] = useState('');
  const [nextMode, setNextMode] = useState<MeetingMode>('presencial');

  useEffect(() => {
    if (!open) return;
    setResolvedId(live?.id ?? newMeetingId());
    setMode(live?.status === 'realizada' ? 'registrar' : intent);
    setPhase('form');
    setDate(live?.date ?? (intent === 'registrar' ? todayKeyLocal() : ''));
    setTime(live?.time ?? '');
    setMeetingMode(live?.mode ?? 'presencial');
    setSummary(live?.summary ?? '');
    setDecisions(live?.decisions ?? []);
    setDecisionDraft('');
    setSelected(new Set(live?.decisions ?? []));
    setNextEnabled(false);
    setNextDate('');
    setNextTime('');
    setNextMode('presencial');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, meetingId, intent]);

  const upsertMeeting = (draft: ThesisMeeting) => {
    setThesisMeetings((prev) => {
      const i = prev.findIndex((m) => m.id === draft.id);
      return i === -1 ? [...prev, draft] : prev.map((m) => (m.id === draft.id ? draft : m));
    });
  };

  const now = () => new Date().toISOString();

  const saveSchedule = () => {
    if (!date) {
      hapticWarning();
      showToast('a reunião precisa de uma data ♡');
      return;
    }
    const draft: ThesisMeeting = {
      ...(live ?? {
        id: resolvedId,
        thesisId: THESIS_ID,
        status: 'agendada' as const,
        decisions: [],
        createdAt: now(),
        updatedAt: now(),
      }),
      date,
      time: time || undefined,
      mode: meetingMode,
      updatedAt: now(),
    };
    upsertMeeting(draft);
    hapticTap();
    showToast(live ? 'reunião guardada ♡' : 'reunião agendada ♡');
    onClose();
  };

  const cancelMeeting = () => {
    if (!live) return;
    upsertMeeting({ ...live, status: 'cancelada', updatedAt: now() });
    hapticTap();
    showToast('reunião cancelada');
    onClose();
  };

  const reactivateMeeting = () => {
    if (!live) return;
    upsertMeeting({ ...live, status: 'agendada', updatedAt: now() });
    hapticTap();
    showToast('reunião reativada ♡');
    onClose();
  };

  const addDecision = () => {
    const trimmed = decisionDraft.trim();
    if (!trimmed) return;
    if (!decisions.includes(trimmed)) setDecisions((prev) => [...prev, trimmed]);
    setDecisionDraft('');
  };

  const removeDecision = (value: string) =>
    setDecisions((prev) => prev.filter((d) => d !== value));

  const saveRegister = () => {
    if (!date) {
      hapticWarning();
      showToast('a reunião precisa de uma data ♡');
      return;
    }
    const wasRealizada = live?.status === 'realizada';
    const draft: ThesisMeeting = {
      ...(live ?? {
        id: resolvedId,
        thesisId: THESIS_ID,
        mode: meetingMode,
        decisions: [],
        createdAt: now(),
        updatedAt: now(),
      }),
      date,
      time: time || undefined,
      mode: meetingMode,
      status: 'realizada',
      summary: summary.trim() || undefined,
      decisions,
      updatedAt: now(),
    };
    upsertMeeting(draft);
    hapticTap();
    // Editar uma reunião que já era `realizada` não reabre a geração de
    // pendências (evita duplicar). Só o ato de registrar abre.
    if (wasRealizada) {
      showToast('reunião guardada ♡');
      onClose();
      return;
    }
    showToast('reunião registrada ♡');
    // Todas as decisões entram marcadas por padrão; a usuária desmarca o que
    // não vira pendência.
    setSelected(new Set(decisions));
    setPhase('gerar');
  };

  const toggleDecision = (value: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });

  const finish = () => {
    const stamp = now();
    const chosen = decisions.filter((d) => selected.has(d));
    if (chosen.length > 0) {
      // Uma escrita para todas as pendências (não uma por decisão).
      const created: ThesisTask[] = chosen.map((title) => ({
        id: newTaskId(),
        thesisId: THESIS_ID,
        title,
        origin: 'orientadora',
        meetingId: resolvedId,
        status: 'aberta',
        createdAt: stamp,
        updatedAt: stamp,
      }));
      setThesisTasks((prev) => [...prev, ...created]);
    }
    if (nextEnabled && nextDate) {
      // Mesma ação: agenda a próxima na mesma escrita da ação (F6.4).
      const nextMeeting: ThesisMeeting = {
        id: newMeetingId(),
        thesisId: THESIS_ID,
        date: nextDate,
        time: nextTime || undefined,
        mode: nextMode,
        status: 'agendada',
        decisions: [],
        createdAt: stamp,
        updatedAt: stamp,
      };
      setThesisMeetings((prev) => [...prev, nextMeeting]);
    }
    hapticTap();
    showToast(
      chosen.length > 0
        ? `${chosen.length} ${chosen.length === 1 ? 'pendência criada' : 'pendências criadas'} ♡`
        : 'tudo guardado ♡',
    );
    onClose();
  };

  const title = () => {
    if (phase === 'gerar') return 'gerar pendências das decisões';
    if (mode === 'registrar') return live?.status === 'realizada' ? 'reunião' : 'registrar o que foi conversado';
    return live ? 'reunião' : 'agendar reunião';
  };

  return (
    <Modal open={open} onClose={onClose} position="bottom" className="w-full max-w-lg">
      <div className="w-full bg-canvas rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl overflow-hidden p-5 sm:p-6 text-ceci-primary space-y-4">
        <h3 className="font-display font-bold text-base text-ceci-primary">{title()}</h3>

        {phase === 'gerar' ? (
          <>
            <p className="text-xs text-ceci-secondary leading-relaxed">
              marque as decisões que viram pendência. cada uma entra na lista de
              orientação como pedido da orientadora.
            </p>
            {decisions.length === 0 ? (
              <p className="text-xs text-ceci-secondary bg-surface-muted rounded-xl p-3 border border-ceci-border-default">
                nenhuma decisão registrada nesta reunião — pode seguir sem gerar
                pendências.
              </p>
            ) : (
              <div className="space-y-2">
                {decisions.map((d) => (
                  <label
                    key={d}
                    className="flex items-start gap-3 p-3 rounded-2xl border border-ceci-border-default bg-surface-default cursor-pointer min-h-[44px]"
                  >
                    <input
                      type="checkbox"
                      checked={selected.has(d)}
                      onChange={() => toggleDecision(d)}
                      className="mt-0.5 w-4 h-4 accent-[var(--ceci-brand)]"
                    />
                    <span className="text-xs text-ceci-primary leading-relaxed">{d}</span>
                  </label>
                ))}
              </div>
            )}

            <div className="pt-2 border-t border-ceci-border-subtle space-y-3">
              <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
                <input
                  type="checkbox"
                  checked={nextEnabled}
                  onChange={(e) => setNextEnabled(e.target.checked)}
                  className="w-4 h-4 accent-[var(--ceci-brand)]"
                />
                <span className="text-xs font-medium text-ceci-primary">agendar a próxima reunião</span>
              </label>
              {nextEnabled && (
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="next-data" className={labelClass}>data</label>
                    <input
                      id="next-data"
                      type="date"
                      value={nextDate}
                      onChange={(e) => setNextDate(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div>
                    <label htmlFor="next-hora" className={labelClass}>hora (opcional)</label>
                    <input
                      id="next-hora"
                      type="time"
                      value={nextTime}
                      onChange={(e) => setNextTime(e.target.value)}
                      className={inputClass}
                    />
                  </div>
                  <div className="col-span-2">
                    <label className={labelClass}>modo</label>
                    <SegmentedControl
                      variant="rose"
                      ariaLabel="modo da próxima reunião"
                      className="w-full [&>button]:flex-1"
                      value={nextMode}
                      onChange={(v) => setNextMode(v)}
                      options={MODE_OPTIONS}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-ceci-border-subtle">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl text-xs text-ceci-secondary hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
              >
                agora não
              </button>
              <button
                type="button"
                onClick={finish}
                className="bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[44px] cursor-pointer"
              >
                concluir ♡
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="meeting-data" className={labelClass}>data</label>
                <input
                  id="meeting-data"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className={inputClass}
                />
              </div>
              <div>
                <label htmlFor="meeting-hora" className={labelClass}>hora (opcional)</label>
                <input
                  id="meeting-hora"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className={inputClass}
                />
              </div>
            </div>

            <div>
              <label className={labelClass}>modo</label>
              <SegmentedControl
                variant="rose"
                ariaLabel="modo da reunião"
                className="w-full [&>button]:flex-1"
                value={meetingMode}
                onChange={(v) => setMeetingMode(v)}
                options={MODE_OPTIONS}
              />
            </div>

            {mode === 'registrar' && (
              <>
                <div>
                  <label htmlFor="meeting-resumo" className={labelClass}>o que foi conversado</label>
                  <textarea
                    id="meeting-resumo"
                    rows={3}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    className={inputClass}
                    placeholder="o resumo da conversa com a orientação"
                  />
                </div>

                <div>
                  <label htmlFor="meeting-decisao" className={labelClass}>decisões</label>
                  <div className="flex items-center gap-2">
                    <input
                      id="meeting-decisao"
                      type="text"
                      value={decisionDraft}
                      onChange={(e) => setDecisionDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          e.preventDefault();
                          addDecision();
                        }
                      }}
                      className={inputClass}
                      placeholder="o que ficou decidido"
                    />
                    <button
                      type="button"
                      onClick={addDecision}
                      aria-label="adicionar decisão"
                      className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl text-ceci-brand-strong border border-ceci-border-brand bg-surface-rose cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>
                  {decisions.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {decisions.map((d) => (
                        <TagChip
                          key={d}
                          size="sm"
                          variant="rose"
                          onRemove={() => removeDecision(d)}
                          removeLabel={`remover decisão ${d}`}
                        >
                          {d}
                        </TagChip>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}

            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-ceci-border-subtle">
              <div className="flex items-center gap-2">
                {live && live.status === 'agendada' && (
                  <button
                    type="button"
                    onClick={cancelMeeting}
                    className="px-3 py-2.5 rounded-xl text-xs text-ceci-secondary hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
                  >
                    cancelar reunião
                  </button>
                )}
                {live && live.status === 'cancelada' && (
                  <button
                    type="button"
                    onClick={reactivateMeeting}
                    className="px-3 py-2.5 rounded-xl text-xs text-ceci-brand-strong hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
                  >
                    reativar
                  </button>
                )}
                {live && live.status === 'agendada' && mode === 'agendar' && (
                  <button
                    type="button"
                    onClick={() => setMode('registrar')}
                    className="px-3 py-2.5 rounded-xl text-xs text-ceci-brand-strong hover:bg-surface-muted transition-colors min-h-[44px] cursor-pointer"
                  >
                    registrar o que foi conversado
                  </button>
                )}
              </div>
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
                  onClick={mode === 'registrar' ? saveRegister : saveSchedule}
                  className="bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs transition-transform active:scale-95 min-h-[44px] cursor-pointer"
                >
                  guardar ♡
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};
