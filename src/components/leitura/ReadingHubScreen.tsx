import React, { useMemo, useRef, useState } from 'react';
import { BookOpen, ChevronRight, Link2, Plus } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { ManageSurface } from '../ui/ManageSurface';
import { UnderlineTabBar, type UnderlineTab } from '../ui/UnderlineTabBar';
import { EmptyState } from '../ui/EmptyState';
import { ProgressBar } from '../ui/ProgressBar';
import { Mascote } from '../ui/Mascote';
import { ReaderModeModal } from '../widgets/ReaderModeModal';
import { CaptureLinkSheet } from '../capture/CaptureLinkSheet';
import { ReadingTrackerScreen } from './ReadingTrackerScreen';
import { formatDateShortBR, todayKeyLocal } from '../../lib/dateBR';
import { readFromClipboard } from '../../lib/utils';
import type { MascoteExpression } from '../ui/Mascote';
import type { ReadingItem } from '@/types';

type Tab = 'lendo' | 'quero' | 'concluidas';

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

const EMPTY_META: Record<Tab, { title?: string; description: string; mascote: MascoteExpression }> = {
  lendo: {
    description:
      'nenhuma leitura em andamento. escolha uma da estante e continue de onde parou ♡',
    mascote: 'library-shelf',
  },
  quero: {
    title: 'fila vazia',
    description: 'guarde aqui os textos e livros que você quer ler quando der tempo ♡',
    mascote: 'empty-invite',
  },
  concluidas: {
    title: 'ainda sem concluídas',
    description: 'terminar a primeira leitura é mais perto do que parece — bora? ♡',
    mascote: 'done-calm',
  },
};

const percentOf = (r: ReadingItem): number | null =>
  r.totalPages ? Math.min(100, Math.round(((r.readPages ?? 0) / r.totalPages) * 100)) : null;

/**
 * Hub de leituras (SPEC-M-010 / SPEC-M-014): estante com abas, "continue
 * lendo", ficha de acompanhamento e o leitor embutido. O registro de sessão
 * acontece no fechar do leitor — a mesma porta de escrita do tracker.
 */
export const ReadingHubScreen: React.FC = () => {
  const {
    readings,
    courses,
    openWizard,
    handleAddReadingSession,
    handleUpdateReadingPages,
    showToast,
  } = useMobileApp();

  const [tab, setTab] = useState<Tab>('lendo');
  const [reader, setReader] = useState<ReadingItem | null>(null);
  const [trackingId, setTrackingId] = useState<string | null>(null);
  const [captureOpen, setCaptureOpen] = useState(false);
  const [captureText, setCaptureText] = useState('');
  const sessionStart = useRef<{ page: number; at: number } | null>(null);

  /** Camada 1 da captura (§8.3): lê o clipboard e abre a sheet de captura. */
  const openCapture = async () => {
    const text = await readFromClipboard();
    setCaptureText(text ?? '');
    setCaptureOpen(true);
  };

  const courseName = (id?: string) => courses.find((c) => c.id === id)?.name || 'geral';

  const counts = useMemo(
    () => ({
      lendo: readings.filter((r) => r.status === 'lendo').length,
      quero: readings.filter((r) => r.status === 'nao_iniciado').length,
      concluidas: readings.filter((r) => r.status === 'concluido').length,
      paginas: readings.reduce((acc, r) => acc + (r.readPages ?? 0), 0),
    }),
    [readings]
  );

  const tabs: UnderlineTab<Tab>[] = [
    { id: 'lendo', label: 'lendo', badge: counts.lendo },
    { id: 'quero', label: 'quero ler', badge: counts.quero },
    { id: 'concluidas', label: 'concluídas', badge: counts.concluidas },
  ];

  const filtered = useMemo(() => {
    const wanted: ReadingItem['status'] =
      tab === 'lendo' ? 'lendo' : tab === 'quero' ? 'nao_iniciado' : 'concluido';
    return readings
      .filter((r) => r.status === wanted)
      .sort((a, b) => (b.lastReadAt ?? '').localeCompare(a.lastReadAt ?? ''));
  }, [readings, tab]);

  const continueReading = useMemo(
    () =>
      readings.find((r) => r.status === 'lendo' && r.lastReadAt) ??
      readings.find((r) => r.status === 'lendo' && (r.readPages ?? 0) > 0),
    [readings]
  );

  const tracking = trackingId ? readings.find((r) => r.id === trackingId) : undefined;

  const openReader = (r: ReadingItem) => {
    sessionStart.current = { page: r.readPages ?? 1, at: Date.now() };
    setReader(r);
  };

  /** Fecha o leitor e guarda a sessão se a leitura avançou (página ou tempo). */
  const closeReader = () => {
    const start = sessionStart.current;
    const id = reader?.id;
    setReader(null);
    sessionStart.current = null;
    if (!id || !start) return;

    const current = readings.find((r) => r.id === id);
    const endPage = current?.readPages ?? start.page;
    const minutes = Math.max(1, Math.round((Date.now() - start.at) / 60_000));
    if (endPage <= start.page && minutes < 1) return;

    handleAddReadingSession({
      id: 'rs-' + Date.now(),
      readingId: id,
      kind: 'session',
      date: todayKeyLocal(),
      unit: 'pages',
      fromPage: start.page,
      toPage: endPage,
      minutes,
      createdAt: new Date().toISOString(),
    });
    showToast('sessão de leitura guardada com carinho ♡');
  };

  if (tracking) {
    return (
      <ReadingTrackerScreen
        reading={tracking}
        onBack={() => setTrackingId(null)}
        onOpenReader={() => openReader(tracking)}
      />
    );
  }

  return (
    <div className="max-w-md mx-auto space-y-4">
      {/* Hero — leitura */}
      <section className="rounded-[26px] bg-gradient-to-br from-surface-default to-surface-rose border border-ceci-border-subtle shadow-sm p-5 relative overflow-hidden">
        <p className="text-xs text-ceci-secondary font-medium lowercase tracking-wide">
          leituras
        </p>
        <h1 className="font-serif-academic text-3xl text-ceci-primary mt-0.5 tracking-tight">
          {counts.lendo > 0 ? `${counts.lendo} em andamento` : 'sua estante'}
        </h1>

        <div className="flex items-end gap-5 mt-3">
          <div>
            <p className="font-display text-xl font-bold text-ceci-primary leading-none">
              {counts.paginas}
            </p>
            <p className="text-[10px] text-ceci-secondary mt-1">páginas lidas</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold text-ceci-primary leading-none">
              {counts.quero}
            </p>
            <p className="text-[10px] text-ceci-secondary mt-1">na fila</p>
          </div>
          <div>
            <p className="font-display text-xl font-bold text-ceci-primary leading-none">
              {counts.concluidas}
            </p>
            <p className="text-[10px] text-ceci-secondary mt-1">concluídas</p>
          </div>
        </div>

        <p className="text-[11px] text-ceci-secondary leading-relaxed mt-3 max-w-[80%]">
          {counts.lendo > 0
            ? 'cada página conta — sem pressa, com carinho ♡'
            : 'abre uma leitura e o cantinho acompanha por você ♡'}
        </p>

        <Mascote
          expression="reading-curious"
          className="w-16 h-16 absolute -bottom-2 -right-2 opacity-95 pointer-events-none"
          decorative
        />
      </section>

      <UnderlineTabBar<Tab> tabs={tabs} active={tab} onChange={setTab} />

      {continueReading && tab === 'lendo' && (
        <section className="rounded-2xl bg-surface-default border border-ceci-border-subtle shadow-2xs p-4 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[11px] font-bold text-ceci-brand-strong lowercase tracking-wide">
              continue lendo
            </p>
            <span className="text-[10px] text-ceci-tertiary">
              {continueReading.lastReadAt
                ? `última leitura em ${formatDateShortBR(continueReading.lastReadAt.slice(0, 10))}`
                : 'quando quiser'}
            </span>
          </div>
          <div className="min-w-0">
            <p className="font-display font-bold text-sm text-ceci-primary truncate">
              {continueReading.title}
            </p>
            <p className="text-[11px] text-ceci-secondary truncate mt-0.5">
              {continueReading.author || 'autor não informado'} · {courseName(continueReading.courseId)}
            </p>
          </div>
          {percentOf(continueReading) !== null && (
            <div className="space-y-1.5">
              <ProgressBar value={percentOf(continueReading) ?? 0} />
              <p className="text-[10px] text-ceci-tertiary">
                página {continueReading.readPages ?? 0} de {continueReading.totalPages} ·{' '}
                {percentOf(continueReading)}%
              </p>
            </div>
          )}
          <button
            onClick={() => openReader(continueReading)}
            className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-full bg-ceci-brand text-ceci-on-brand text-xs font-bold cursor-pointer active:scale-[0.98] transition-transform"
          >
            <BookOpen className="w-4 h-4" />
            continuar lendo
          </button>
        </section>
      )}

      {filtered.length === 0 ? (
        <EmptyState
          {...EMPTY_META[tab]}
          actionLabel="nova leitura"
          onAction={() => openWizard('reading')}
        />
      ) : (
        <div className="space-y-2.5">
          {filtered.map((r) => {
            const pct = percentOf(r);
            const meta = STATUS_META[r.status];
            return (
              <ManageSurface
                key={r.id}
                kind="reading"
                id={r.id}
                onTap={() => setTrackingId(r.id)}
                className="rounded-2xl bg-surface-default border border-ceci-border-subtle shadow-2xs p-4 cursor-pointer active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-display font-bold text-sm text-ceci-primary truncate">
                      {r.title}
                    </p>
                    <p className="text-[11px] text-ceci-secondary truncate mt-0.5">
                      {r.author || 'autor não informado'} · {courseName(r.courseId)}
                    </p>
                  </div>
                  <span
                    className={`shrink-0 text-[9px] font-bold uppercase tracking-wide px-2 py-0.5 rounded-full border ${meta.className}`}
                  >
                    {meta.label}
                  </span>
                </div>

                {pct !== null && (
                  <div className="mt-3 space-y-1.5">
                    <ProgressBar value={pct} />
                    <p className="text-[10px] text-ceci-tertiary">
                      {r.readPages ?? 0} de {r.totalPages} páginas · {pct}%
                    </p>
                  </div>
                )}

                <div className="mt-2.5 flex items-center justify-between">
                  <span className="text-[10px] text-ceci-tertiary">
                    {r.lastReadAt
                      ? `em ${formatDateShortBR(r.lastReadAt.slice(0, 10))}`
                      : 'ainda não abri'}
                  </span>
                  <ChevronRight className="w-4 h-4 text-ceci-tertiary" />
                </div>
              </ManageSurface>
            );
          })}
        </div>
      )}

      <button
        onClick={() => openWizard('reading')}
        className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-full bg-ceci-primary text-ceci-on-primary text-xs font-bold cursor-pointer active:scale-[0.98] transition-transform"
      >
        <Plus className="w-4 h-4" />
        nova leitura
      </button>

      <button
        onClick={() => void openCapture()}
        className="w-full flex items-center justify-center gap-2 min-h-[44px] px-4 rounded-full bg-surface-default border border-ceci-border-default text-ceci-secondary text-xs font-semibold cursor-pointer active:scale-[0.98] transition-transform"
      >
        <Link2 className="w-4 h-4" />
        guardar link
      </button>

      {captureOpen && (
        <CaptureLinkSheet
          open
          initialText={captureText}
          onClose={() => setCaptureOpen(false)}
        />
      )}

      {reader && (
        <ReaderModeModal
          isOpen
          onClose={closeReader}
          reading={readings.find((r) => r.id === reader.id) ?? reader}
          onUpdateProgress={handleUpdateReadingPages}
        />
      )}
    </div>
  );
};
