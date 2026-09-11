import React from 'react';
import { Plus, Trash2, Clock } from 'lucide-react';
import type { CourseScheduleSlot } from '../../types';
import { WEEKDAY_LABELS } from '../../data/constants';
import { TimeInput } from '../wizards/wizardFields';

interface SchedulePickerProps {
  value: CourseScheduleSlot[];
  onChange: (slots: CourseScheduleSlot[]) => void;
}

/** Editor de horários semanais da disciplina: dias + início/término. */
export const SchedulePicker: React.FC<SchedulePickerProps> = ({ value, onChange }) => {
  const update = (next: CourseScheduleSlot[]) => onChange(next);

  const setDay = (idx: number, day: number) =>
    update(value.map((s, i) => (i === idx ? { ...s, day } : s)));
  const setStart = (idx: number, start: string) =>
    update(value.map((s, i) => (i === idx ? { ...s, start } : s)));
  const setEnd = (idx: number, end: string) =>
    update(value.map((s, i) => (i === idx ? { ...s, end: end || undefined } : s)));
  const remove = (idx: number) => update(value.filter((_, i) => i !== idx));
  const add = () => update([...value, { day: 1, start: '08:00', end: '10:00' }]);

  return (
    <div className="space-y-3">
      {value.map((slot, idx) => (
        <div key={idx} className="rounded-2xl bg-surface-muted border border-ceci-border-subtle p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-ceci-tertiary">
              horário {value.length > 1 ? idx + 1 : ''}
            </span>
            {value.length > 1 && (
              <button
                type="button"
                onClick={() => remove(idx)}
                className="w-7 h-7 rounded-lg bg-surface-default border border-ceci-border-default flex items-center justify-center text-ceci-brand-strong hover:bg-ceci-border-brand/40 cursor-pointer"
                aria-label="remover horário"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {WEEKDAY_LABELS.map((label, day) => {
              const active = slot.day === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setDay(idx, day)}
                  className={`px-2.5 py-1.5 rounded-full text-[11px] font-semibold border transition cursor-pointer ${
                    active
                      ? 'bg-ceci-primary text-white border-ceci-primary'
                      : 'bg-surface-default text-ceci-secondary border-ceci-border-default hover:bg-surface-muted'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <span className="block text-[10px] font-semibold text-ceci-tertiary mb-1">início</span>
              <TimeInput value={slot.start} onChange={(e) => setStart(idx, e.target.value)} />
            </div>
            <div>
              <span className="block text-[10px] font-semibold text-ceci-tertiary mb-1">término</span>
              <TimeInput value={slot.end ?? ''} onChange={(e) => setEnd(idx, e.target.value)} />
            </div>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={add}
        className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-2xl bg-surface-default border border-dashed border-ceci-border-strong text-ceci-secondary text-xs font-semibold hover:bg-surface-muted cursor-pointer"
      >
        <Plus className="w-4 h-4" /> adicionar horário
      </button>

      {value.length === 0 && (
        <p className="flex items-center gap-1.5 text-[11px] text-ceci-tertiary">
          <Clock className="w-3.5 h-3.5" /> toque em + para definir os dias e horários da matéria
        </p>
      )}
    </div>
  );
};
