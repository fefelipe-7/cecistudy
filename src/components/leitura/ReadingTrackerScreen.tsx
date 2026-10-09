import React, { useMemo, useState } from 'react';
import { BookOpen, ChevronLeft, Clock3, NotebookPen, Timer } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { SectionTitle } from '../ui/SectionTitle';
import { ProgressBar } from '../ui/ProgressBar';
import { EmptyState } from '../ui/EmptyState';
import { FixedBottomBar } from '../ui/FixedBottomBar';
import { Modal } from '../ui/Modal';
import { formatDateShortBR, todayKeyLocal } from '../../lib/dateBR';
import { hapticSuccess } from '../../lib/haptics';
import type { ReadingItem, ReadingSession } from '@/types';

interface Props {
  reading: ReadingItem;
  onBack: () => void;
  onOpenReader: () => void;
}

const STATUS_META: Record<ReadingItem['status'], { label: string; className: string }> = {
  lendo: {
    label: 'lendo',
    className: 'bg-surface-rose text-ceci-brand-strong border-ceci-border-brand',
  },
  nao_iniciado: {
    label: 'quero ler',
    className: 'bg-surface-default text-ceci-secondary border-ceci-border-default',
  },
  concluido: {
    label: 'concluída',
    className: 'bg-surface-blue text-ceci-academic-strong border-ceci-border-academic',
  },
};

/**
 * Ficha de acompanhamento de uma leitura (SPEC-M-014): progresso, derivado das
 * sessões registradas e a porta manual de registro. O leitor continua sendo o
 * caminho principal — aqui é onde se olha o que já foi percorrido.
 */
export const ReadingTrackerScreen: React.FC<Props> = ({ reading, onBack, onOpenReader }) => {
  const {
    readingSessions,
    courses,
    handleAddReadingSession,
    handleUpdateReadingPages,
    showToast,
  } = useMobileApp();

  const [openSession, setOpenSession] = useState(false);
  const [toPage, setToPage] = useState(String(reading.readPages ?? ''));
  const [minutes, setMinutes] = useState('');
  const [note, setNote] = useState('');

  const course = courses.find((c) => c.id === reading.courseId);
  const totalPages = reading.totalPages;
  const readPages = reading.readPages ?? 0;
  const pct = totalPages ? Math.min(100, Math.round((readPages / totalPages) * 100)) : 0;

  const sessions = useMemo(
    () =>
      readingSessions
        .filter((s) => s.readingId === reading.id)
        .sort((a, b) => b.date.localeCompare(a.date)),
    [readingSessions, reading.id]
  );

  const totalMinutes = sessions.reduce((acc, s) => acc + (s.minutes ?? 0), 0);
  const meta = STATUS_META[reading.status];

  const saveSession = () => {
    const target = Math.max(0, Number(toPage) || 0);
    const min = Math.max(0, Number(minutes) || 0);
    handleAddReadingSession({
      id: 'rs-' + Date.now(),
      readingId: reading.id,
      kind: 'session',
      date: todayKeyLocal(),
      unit: 'pages',
      fromPage: readPages,
      toPage: target,
      minutes: min || undefined,
      note: note.trim() || undefined,
      createdAt: new Date().toISOString(),
    });
    if (target > readPages) handleUpdateReadingPages(reading.id, target);
    hapticSuccess();
    showToast('sessão de leitura guardada com carinho ♡');
    setOpenSession(false);
    setMinutes('');
    setNote('');
  };

  return (
    <div className="fixed inset-0 z-[44] bg-canvas overflow-y-auto px-4 py-4 pb-32 space-y-5 max-w-md mx-auto">
      <div className="flex items-center gap-2">
        <button
          onClick={onBack}
          aria-label="voltar para as leituras"
          className="w-10 h-10 rounded-2xl bg-surface-default border border-ceci-border-default flex items-center justify-center text-ceci-secondary hover:bg-surface-muted transition-colors shadow-2xs cursor-pointer shrink-0"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <div className="min-w-0">
          <p className="text-xs text-ceci-secondary font-medium lowercase tracking-wide">
            acompanhamento
          </p>
          <p className="text-[11px] text-ceci-tertiary truncate">{reading.title}</p>
        </div>
      </div>

      {/* Hero da leitura — cor da capa/disciplina como detalhe lateral */}
      <section className="relative overflow-hidden rounded-[28px] border border-ceci-border-default bg-surface-default p-4 pl-5 space-y-3">
        <span
          aria-hidden
          className="absolute left-0 top-4 bottom-4 w-1.5 rounded-r-full"
          style={{ background: reading.coverColor ?? course?.color ?? '#D85F79' }}
        />
        <div className="flex items-center justify-between gap-2 pr-1">
          <span
            className={`text-[10px] font-bold uppercase tracking-wide px-2.5 py-0.5 rounded-full border ${meta.className}`}
          >
            {meta.label}
          </span>
          <span className="text-[11px] font-medium text-ceci-tertiary">{reading.type}</span>
        </div>

        <div>
          <h1 className="font-display font-bold text-lg text-ceci-primary leading-tight">
            {reading.title}
          </h1>
          <p className="text-[11px] font-medium text-ceci-tertiary mt-0.5">
            {reading.author ? `de ${reading.author}` : 'autor não informado'} ·{' '}
            {course?.name ?? 'geral'}
          </p>
        </div>

        <div className="space-y-2">
          <ProgressBar value={pct} className="h-2" />
          <div className="flex items-center justify-between text-[11px] text-ceci-secondary">
            <span>
              {totalPages ? `${readPages} de ${totalPages} páginas` : `${readPages} páginas lidas`}
            </span>
            <span className="font-semibold text-ceci-primary">{pct}%</span>
          </div>
          {totalPages ? (
            <p className="text-[10px] text-ceci-tertiary">
              {readPages >= totalPages
                ? 'leitura concluída — parabéns ♡'
                : `faltam ${totalPages - readPages} páginas`}
            </p>
          ) : (
            <p className="text-[10px] text-ceci-tertiary">
              sem total de páginas — registre o progresso pelas sessões
            </p>
          )}
        </div>
      </section>

      <div className="grid grid-cols-3 gap-2.5">
        <div className="rounded-2xl bg-surface-muted border border-ceci-border-subtle p-3 text-center">
          <p className="font-display text-lg font-bold text-ceci-primary leading-none">
            {sessions.length}
          </p>
          <p className="text-[10px] text-ceci-secondary mt-1">sessões</p>
        </div>
        <div className="rounded-2xl bg-surface-muted border border-ceci-border-subtle p-3 text-center">
          <p className="font-display text-lg font-bold text-ceci-primary leading-none">
            {totalMinutes}
          </p>
          <p className="text-[10px] text-ceci-secondary mt-1">minutos</p>
        </div>
        <div className="rounded-2xl bg-surface-muted border border-ceci-border-subtle p-3 text-center">
          <p className="font-display text-lg font-bold text-ceci-primary leading-none">
            {sessions.length ? formatDateShortBR(sessions[0].date) : '—'}
          </p>
          <p className="text-[10px] text-ceci-secondary mt-1">última</p>
        </div>
      </div>

      <section className="space-y-2.5">
        <SectionTitle icon={<Clock3 className="w-3.5 h-3.5 text-ceci-brand" />}>
          sessões de leitura
        </SectionTitle>

        {sessions.length === 0 ? (
          <EmptyState
            title="nenhuma sessão ainda"
            description="abre o leitor e registra de onde saiu — o acompanhamento nasce daqui ♡"
            actionLabel="abrir leitor"
            onAction={onOpenReader}
            secondaryActionLabel="registrar manual"
            onSecondaryAction={() => setOpenSession(true)}
            mascote="reading-curious"
          />
        ) : (
          <ul className="space-y-2">
            {sessions.map((s: ReadingSession) => (
              <li
                key={s.id}
                className="rounded-2xl bg-surface-default border border-ceci-border-subtle p-3.5"
              >
                <div className="flex items-center justify-between gap-3">
                  <p className="text-xs font-semibold text-ceci-primary">
                    {formatDateShortBR(s.date)}
                  </p>
                  <p className="text-[10px] text-ceci-tertiary">
                    {s.minutes ? `${s.minutes} min` : 'sem tempo registrado'}
                  </p>
                </div>
                <p className="text-[11px] text-ceci-secondary mt-1">
                  {typeof s.fromPage === 'number' && typeof s.toPage === 'number'
                    ? `página ${s.fromPage} → ${s.toPage}${
                        s.toPage > s.fromPage ? ` (+${s.toPage - s.fromPage})` : ''
                      }`
                    : 'progresso registrado'}
                </p>
                {s.note && (
                  <p className="text-[11px] text-ceci-tertiary mt-1.5 flex items-start gap-1.5">
                    <NotebookPen className="w-3 h-3 mt-0.5 shrink-0" />
                    {s.note}
                  </p>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      <FixedBottomBar>
        <div className="max-w-md mx-auto flex items-center gap-2 px-4 py-3">
          <button
            onClick={() => setOpenSession(true)}
            className="flex-1 min-h-[44px] px-4 rounded-full bg-surface-default border border-ceci-border-default text-xs font-bold text-ceci-secondary cursor-pointer active:scale-[0.98] transition-transform"
          >
            registrar sessão
          </button>
          <button
            onClick={onOpenReader}
            className="flex-1 min-h-[44px] px-4 rounded-full bg-ceci-brand text-ceci-on-brand text-xs font-bold cursor-pointer active:scale-[0.98] transition-transform flex items-center justify-center gap-2"
          >
            <BookOpen className="w-4 h-4" />
            abrir leitor
          </button>
        </div>
      </FixedBottomBar>

      <Modal open={openSession} onClose={() => setOpenSession(false)} closeOnBackdrop={false}>
        <div className="w-full max-w-sm bg-surface-default rounded-2xl shadow-floating p-6 text-left">
          <p className="font-display font-bold text-lg text-ceci-primary flex items-center gap-1.5 mb-2">
            <Timer className="w-4 h-4 text-ceci-brand" /> registrar sessão de leitura
          </p>

          <div className="space-y-3">
            <div>
              <label className="block text-xs font-medium text-ceci-secondary mb-1">
                até qual página?
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={toPage}
                onChange={(e) => setToPage(e.target.value)}
                placeholder={totalPages ? String(totalPages) : 'ex: 42'}
                className="w-full bg-surface-default border border-ceci-border-default rounded-xl px-3.5 py-2 text-sm text-ceci-primary focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand"
                autoFocus
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ceci-secondary mb-1">
                quanto tempo? (min)
              </label>
              <input
                type="number"
                inputMode="numeric"
                min={0}
                value={minutes}
                onChange={(e) => setMinutes(e.target.value)}
                placeholder="ex: 25"
                className="w-full bg-surface-default border border-ceci-border-default rounded-xl px-3.5 py-2 text-sm text-ceci-primary focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-ceci-secondary mb-1">
                alguma anotação?
              </label>
              <input
                type="text"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="ex: capítulo dos capítulos"
                className="w-full bg-surface-default border border-ceci-border-default rounded-xl px-3.5 py-2 text-sm text-ceci-primary focus:outline-none focus:ring-2 focus:ring-ceci-brand/30 focus:border-ceci-brand"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-4">
            <button
              onClick={() => setOpenSession(false)}
              className="px-4 py-2 rounded-xl text-xs text-ceci-secondary hover:bg-surface-muted transition-colors cursor-pointer"
            >
              cancelar
            </button>
            <button
              onClick={saveSession}
              className="bg-ceci-brand hover:bg-ceci-brand-strong text-ceci-on-brand px-5 py-2.5 rounded-[14px] text-xs font-medium shadow-2xs cursor-pointer"
            >
              guardar sessão
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
