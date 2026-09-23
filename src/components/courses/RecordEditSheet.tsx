// Sheet de edição de um registro de frequência (spec-frequencia.md §7.3).
// Abre ao tocar/long-press num record do histórico: muda o status ou apaga.
import React from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../ui/Modal';
import { useMobileApp } from '@/context/mobileApp';
import { hapticTap } from '../../lib/haptics';
import { formatShortDate } from '../../lib/schedule';
import type { AttendanceRecord, AttendanceStatus, Course } from '../../types';

interface RecordEditSheetProps {
  open: boolean;
  course: Course;
  record: AttendanceRecord | null;
  onClose: () => void;
}

const STATUS_OPTIONS: {
  status: AttendanceStatus;
  label: string;
  hint: string;
  activeClass: string;
}[] = [
  {
    status: 'presente',
    label: 'presente ✓',
    hint: 'conta como assistida',
    activeClass: 'bg-status-success-surface border-status-success-border text-status-success-strong',
  },
  {
    status: 'falta',
    label: 'falta ✗',
    hint: 'conta como falta',
    activeClass: 'bg-status-danger-surface border-status-danger-border text-status-danger-strong',
  },
  {
    status: 'cancelada',
    label: 'cancelada',
    hint: 'não conta no total',
    activeClass: 'bg-status-warning-surface border-status-warning-border text-status-warning-strong',
  },
];

const RecordEditSheet: React.FC<RecordEditSheetProps> = ({ open, course, record, onClose }) => {
  const { updateAttendanceRecord, removeAttendanceRecord, showToast } = useMobileApp();

  const handleStatusChange = (status: AttendanceStatus) => {
    if (!record) return;
    hapticTap();
    updateAttendanceRecord(course.id, record.id, { status });
    showToast('registro atualizado ♡');
    onClose();
  };

  const handleRemove = () => {
    if (!record) return;
    hapticTap();
    removeAttendanceRecord(course.id, record.id);
    showToast('registro apagado ♡');
    onClose();
  };

  return (
    <Modal open={open} onClose={onClose} position="bottom" labelledBy="record-edit-title" className="w-full max-w-md">
      <div className="w-full bg-canvas rounded-t-[28px] sm:rounded-2xl border border-ceci-border-default shadow-xl overflow-hidden px-4 pb-6 pt-1 space-y-4 sm:px-5 text-ceci-primary">
        <div className="text-center">
          <h3
            id="record-edit-title"
            className="font-display font-bold text-base text-ceci-primary"
          >
            {record ? formatShortDate(record.date) : ''}
          </h3>
          <p className="text-xs text-ceci-tertiary mt-0.5">frequência de {course.name}</p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {STATUS_OPTIONS.map((opt) => {
            const isActive = record?.status === opt.status;
            return (
              <button
                key={opt.status}
                onClick={() => handleStatusChange(opt.status)}
                aria-pressed={isActive}
                className={`flex flex-col items-center gap-0.5 px-2 py-3 rounded-xl border text-xs font-bold transition-all cursor-pointer active:scale-95 ${
                  isActive
                    ? opt.activeClass
                    : 'bg-surface-default border-ceci-border-default text-ceci-secondary hover:border-ceci-border-strong'
                }`}
              >
                <span>{opt.label}</span>
                <span className="text-[10px] font-medium text-ceci-tertiary">{opt.hint}</span>
              </button>
            );
          })}
        </div>

        {record?.hours ? (
          <p className="text-[11px] text-ceci-tertiary text-center">
            duração registrada: {record.hours}h
          </p>
        ) : null}

        <button
          onClick={handleRemove}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-ceci-border-strong text-xs font-semibold text-status-danger-strong bg-status-danger-surface cursor-pointer active:scale-[0.98] transition-transform"
        >
          <Trash2 className="w-3.5 h-3.5" />
          apagar registro
        </button>
      </div>
    </Modal>
  );
};

export default RecordEditSheet;