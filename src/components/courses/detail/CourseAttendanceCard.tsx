import React from 'react';
import { CalendarX2, ChevronRight, Settings2, UserCheck, UserMinus } from 'lucide-react';
import { ProgressBar } from '../../ui/ProgressBar';
import { Mascote } from '../../ui/Mascote';
import {
  attendanceStats,
  hoursPerClassFromSchedule,
  sortAttendanceRecords,
  AttendanceMarginStatus,
} from '../../../lib/attendance';
import { formatShortDate, getTodaySchedule } from '../../../lib/schedule';
import { useMobileApp } from '@/context/mobileApp';
import { hapticTap } from '../../../lib/haptics';
import { AttendanceRecord, AttendanceStatus, Course } from '../../../types';

interface CourseAttendanceCardProps {
  course: Course;
  /** Navega para a aba "aulas" (histórico completo) quando existe. */
  onGoToHistory?: () => void;
}

const CARD = 'rounded-2xl paper-card p-4 space-y-3';
const ROW_LABEL = 'text-[10px] font-bold text-ceci-tertiary uppercase tracking-wider';
const QUICK_BTN =
  'flex flex-col items-center gap-1 px-2 py-3 rounded-xl border text-[10px] font-bold cursor-pointer active:scale-95 transition-transform';

const STATUS_COPY: Record<AttendanceMarginStatus, { title: string; hint: string }> = {
  ok: { title: 'tudo em ordem ♡', hint: 'continue com esse ritmo' },
  atencao: {
    title: 'olha a frequência',
    hint: 'a margem ainda existe, mas se der, não falte mais do que o necessário',
  },
  limite: { title: 'no limite de faltas', hint: 'daqui pra frente, cada aula conta bastante' },
  estourou: {
    title: 'faltas acima do limite',
    hint: 'calma, ainda dá para recuperar vindo nas próximas aulas ♡',
  },
};

const STATUS_BAR: Record<AttendanceMarginStatus, string> = {
  ok: 'bg-status-success',
  atencao: 'bg-status-warning',
  limite: 'bg-status-danger',
  estourou: 'bg-status-danger',
};

const STATUS_TEXT: Record<AttendanceMarginStatus, string> = {
  ok: 'var(--color-status-success-strong)',
  atencao: 'var(--color-status-warning-strong)',
  limite: 'var(--color-status-danger-strong)',
  estourou: 'var(--color-status-danger-strong)',
};

const RECORD_LABEL: Record<AttendanceRecord['status'], string> = {
  presente: 'presente',
  falta: 'falta',
  cancelada: 'cancelada',
};

/** Ações rápidas do card (spec-frequencia.md §7.2): registrar hoje direto da aba info. */
const QUICK_ACTIONS: {
  status: AttendanceStatus;
  label: string;
  aria: string;
  icon: React.ReactNode;
  className: string;
  toast: string;
}[] = [
  {
    status: 'presente',
    label: 'fui na aula',
    aria: 'marcar como fui na aula',
    icon: <UserCheck className="w-4 h-4" />,
    className:
      'bg-status-success-surface border-status-success-border text-status-success-strong hover:border-status-success-strong/50',
    toast: 'presença registrada ♡',
  },
  {
    status: 'falta',
    label: 'falta',
    aria: 'marcar como falta',
    icon: <UserMinus className="w-4 h-4" />,
    className:
      'bg-status-danger-surface border-status-danger-border text-status-danger-strong hover:border-status-danger-strong/50',
    toast: 'guardado como falta ♡',
  },
  {
    status: 'cancelada',
    label: 'cancelada',
    aria: 'marcar como aula cancelada',
    icon: <CalendarX2 className="w-4 h-4" />,
    className: 'bg-status-warning-surface border-status-warning-border text-status-warning-strong hover:border-status-warning/60',
    toast: 'aula cancelada não conta como falta ♡',
  },
];

function lastRecord(records: AttendanceRecord[]): AttendanceRecord | undefined {
  return sortAttendanceRecords(records)[0];
}

/** Card de frequência — pct, margem de faltas restantes, alerta e registro rápido. */
export const CourseAttendanceCard: React.FC<CourseAttendanceCardProps> = ({
  course,
  onGoToHistory,
}) => {
  const { courses, markAttendance, openEditCourse, showToast } = useMobileApp();
  const stats = attendanceStats(course.attendance);

  const hasClassToday = getTodaySchedule(courses, new Date()).some(
    (s) => s.course.id === course.id
  );

  if (!course.attendance) return null;

  const handleQuick = (status: AttendanceStatus, toast: string) => {
    hapticTap();
    markAttendance(course.id, status);
    showToast(toast);
  };

  // Sem total definido (setup): convida a configurar antes de acompanhar.
  if (!stats) {
    return (
      <section className={CARD}>
        <span className={`${ROW_LABEL} flex items-center gap-1.5`}>
          <UserCheck className="w-3.5 h-3.5 text-ceci-muted" /> frequência
        </span>
        <p className="text-xs text-ceci-secondary leading-relaxed">
          que tal definir a carga horária da matéria em horas? aí você acompanha as aulas e a
          margem de faltas com carinho ♡
        </p>
        {hasClassToday && (
          <div className="grid grid-cols-3 gap-2 pt-1">
            {QUICK_ACTIONS.map((a) => (
              <button
                key={a.status}
                onClick={() => handleQuick(a.status, a.toast)}
                aria-label={a.aria}
                className={`${QUICK_BTN} ${a.className}`}
              >
                {a.icon}
                <span>{a.label}</span>
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => openEditCourse(course.id)}
          className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl border border-ceci-border-strong text-xs font-bold text-ceci-secondary bg-surface-muted cursor-pointer active:scale-[0.98] transition-transform"
        >
          <Settings2 className="w-3.5 h-3.5" />
          definir carga horária (horas)
        </button>
      </section>
    );
  }

  const { attended, absences, cancelled, pct, total, minPct, margin, maxAbsences, status } = stats;
  const last = lastRecord(course.attendance!.records);
  const copy = STATUS_COPY[status];
  const att = course.attendance!;
  const hoursDone = att.baseHoursDone ?? 0;
  const hoursLine = att.totalHours
    ? `${hoursDone}h feitas de ${att.totalHours}h · ${att.totalHours}h = ${total} aulas de ${hoursPerClassFromSchedule(Array.isArray(course.schedule) ? course.schedule : [])}h`
    : null;

  const marginLine =
    margin > 0
      ? `ainda pode faltar ${margin} ${margin === 1 ? 'aula' : 'aulas'} sem quebrar o ${minPct}%`
      : margin === 0
        ? 'nenhuma falta restante — respira fundo e vem nas próximas aulas ♡'
        : `já foram ${absences} de ${maxAbsences} faltas permitidas — acima do limite`;

  return (
    <section className={CARD} aria-label="frequência">
      <div className="flex items-center justify-between gap-3">
        <span className={`${ROW_LABEL} flex items-center gap-1.5`}>
          <UserCheck className="w-3.5 h-3.5 text-ceci-muted" /> frequência
        </span>
        <span className="text-xs font-bold" style={{ color: STATUS_TEXT[status] }}>
          {pct}% · {absences} {absences === 1 ? 'falta' : 'faltas'}
        </span>
      </div>

      <ProgressBar value={pct} className="mt-2.5" barClassName={STATUS_BAR[status]} />

      <div className="text-[11px] text-ceci-secondary leading-relaxed space-y-0.5">
        <p className="font-semibold text-ceci-primary">
          {copy.title} <span className="font-normal text-ceci-secondary">— {copy.hint}</span>
        </p>
        <p>{marginLine}</p>
        {cancelled > 0 && (
          <p>
            {cancelled} {cancelled === 1 ? 'aula cancelada' : 'aulas canceladas'} não contam como
            falta ♡
          </p>
        )}
        <p className="text-ceci-tertiary">
          {attended} de {total} aulas registradas · presenças valem {minPct}% de mínimo
        </p>
        {hoursLine && <p className="text-ceci-tertiary">{hoursLine}</p>}
        {last && (
          <p className="text-ceci-tertiary">
            última marcação: {formatShortDate(last.date)} · {RECORD_LABEL[last.status]}
          </p>
        )}
      </div>

      {/* Registro rápido — só quando há aula hoje, para não marcar presença em dia livre. */}
      {hasClassToday && (
        <div className="grid grid-cols-3 gap-2 pt-1">
          {QUICK_ACTIONS.map((a) => (
            <button
              key={a.status}
              onClick={() => handleQuick(a.status, a.toast)}
              aria-label={a.aria}
              className={`${QUICK_BTN} ${a.className}`}
            >
              {a.icon}
              <span>{a.label}</span>
            </button>
          ))}
        </div>
      )}

      {status !== 'ok' && (
        <p className="text-[11px] text-ceci-secondary mt-2.5 leading-relaxed">
          <Mascote expression="boundaries-care" className="w-5 h-5 inline-block -mt-1 mr-1" decorative />
          {copy.hint}. bora manter a frequência com jeitinho?
        </p>
      )}

      {/* Rodapé do card: contagens + navegação */}
      <div className="pt-1 flex items-center justify-between gap-2 border-t border-ceci-border-default/70">
        <button
          onClick={() => openEditCourse(course.id)}
          className="text-[11px] font-semibold text-ceci-tertiary hover:text-ceci-primary transition-colors cursor-pointer flex items-center gap-1"
        >
          <Settings2 className="w-3.5 h-3.5" />
          <span>ajustar carga & contagens</span>
        </button>
        {onGoToHistory && (
          <button
            onClick={onGoToHistory}
            className="text-[11px] font-bold text-ceci-brand-strong hover:underline transition-colors cursor-pointer flex items-center gap-0.5"
          >
            ver histórico completo <ChevronRight className="w-3.5 h-3.5" />
          </button>
        )}
      </div>
    </section>
  );
};