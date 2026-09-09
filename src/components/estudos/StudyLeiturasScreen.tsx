import React, { useState } from 'react';
import { Plus, BookOpen } from 'lucide-react';
import { useMobileApp } from '@/context/mobileApp';
import { ReaderModeModal } from '../widgets/ReaderModeModal';
import { Mascote } from '../ui/Mascote';
import { ManageSurface } from '../ui/ManageSurface';
import type { ReadingItem } from '../../types';

const READING_STATUS_LABEL: Record<ReadingItem['status'], string> = {
  nao_iniciado: 'não iniciado',
  lendo: 'lendo',
  concluido: 'concluído',
};

/** Tela dedicada de leituras — lista + modo leitura (reusa o ReaderModeModal). */
export const StudyLeiturasScreen: React.FC = () => {
  const { readings, courses, handleUpdateReadingPages, openWizard } = useMobileApp();
  const [readerModalReading, setReaderModalReading] = useState<ReadingItem | null>(null);

  const courseName = (id?: string) => courses.find((c) => c.id === id)?.name || 'geral';

  // ---- estatísticas agregadas ----
  const inProgressCount = readings.filter((r) => r.status === 'lendo').length;
  const doneCount = readings.filter((r) => r.status === 'concluido').length;
  const pagesRead = readings.reduce(
    (acc, r) => acc + (r.totalPages ? Math.min(r.readPages || 0, r.totalPages) : 0),
    0
  );

  return (
    <div className="max-w-md sm:max-w-xl lg:max-w-none mx-auto space-y-3">
      {readings.length > 0 && (
        <div className="rounded-2xl p-4 bg-surface-subtle border border-ceci-border-subtle shadow-sm grid grid-cols-3 divide-x divide-ceci-border-subtle text-center">
          <div className="px-1">
            <p className="font-display font-bold text-lg text-ceci-academic-strong">{inProgressCount}</p>
            <p className="text-[10px] text-ceci-secondary leading-tight">em andamento</p>
          </div>
          <div className="px-1">
            <p className="font-display font-bold text-lg text-ceci-brand-strong">{pagesRead}</p>
            <p className="text-[10px] text-ceci-secondary leading-tight">páginas lidas</p>
          </div>
          <div className="px-1">
            <p className="font-display font-bold text-lg text-green-700">{doneCount}</p>
            <p className="text-[10px] text-ceci-secondary leading-tight">concluídos</p>
          </div>
        </div>
      )}
      {readings.length === 0 ? (
        <div className="rounded-2xl p-6 bg-surface-default border border-ceci-border-default shadow-sm text-center space-y-3">
          <Mascote expression="reading-curious" className="w-14 h-14 mx-auto" decorative />
          <p className="font-serif-academic text-sm text-ceci-secondary leading-relaxed">
            nenhuma leitura anotada ainda. que tal adicionar seu primeiro livro ou artigo ♡
          </p>
        </div>
      ) : (
        [...readings]
          .sort((a, b) => {
            const order = { nao_iniciado: 0, lendo: 1, concluido: 2 } as const;
            return order[a.status] - order[b.status];
          })
          .map((r) => {
            const pct = r.totalPages
              ? Math.round(((r.readPages || 0) / r.totalPages) * 100)
              : r.status === 'concluido'
                ? 100
                : 0;
            const isDone = r.status === 'concluido';
            return (
              <ManageSurface
                key={r.id}
                kind="reading"
                id={r.id}
                onTap={() => setReaderModalReading(r)}
                data-target={r.id}
                className={`rounded-2xl p-5 bg-surface-default border border-ceci-border-default shadow-sm space-y-3 ${
                  isDone ? 'opacity-70' : ''
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="font-semibold text-xs text-ceci-primary leading-snug line-clamp-2">{r.title}</h3>
                    <p className="text-[11px] text-ceci-secondary mt-0.5">
                      {[r.author || 'autor não informado', courseName(r.courseId) || null]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </div>
                  <span
                    className={`text-[10px] font-semibold px-2.5 py-1 rounded-full border shrink-0 ${
                      isDone
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : r.status === 'lendo'
                          ? 'bg-surface-blue text-ceci-academic-strong border-ceci-border-academic'
                          : 'bg-surface-muted text-ceci-tertiary border-ceci-border-default'
                    }`}
                  >
                    {READING_STATUS_LABEL[r.status]}
                  </span>
                </div>

                {r.totalPages ? (
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-ceci-secondary">
                      <span>{r.readPages || 0} de {r.totalPages} páginas</span>
                      <span className="font-semibold text-ceci-brand-strong">{pct}%</span>
                    </div>
                    <div className="w-full h-2 bg-surface-muted border border-ceci-border-subtle rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-ceci-brand to-ceci-brand-strong rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                ) : null}

                <button
                  onClick={() => setReaderModalReading(r)}
                  className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-2xl text-xs font-semibold text-white bg-ceci-primary hover:bg-ceci-primary-hover cursor-pointer"
                >
                  <BookOpen className="w-4 h-4" />
                  {isDone ? 'reler leitura' : r.status === 'lendo' ? 'continuar leitura' : 'iniciar leitura'}
                </button>
              </ManageSurface>
            );
          })
      )}

      <button
        onClick={() => openWizard('reading')}
        className="w-full flex items-center justify-center gap-1.5 py-3 rounded-2xl text-xs font-semibold text-ceci-academic-strong bg-surface-blue border border-ceci-border-academic cursor-pointer"
      >
        <Plus className="w-4 h-4" /> nova leitura
      </button>

      <ReaderModeModal
        isOpen={!!readerModalReading}
        onClose={() => setReaderModalReading(null)}
        reading={readerModalReading}
        onUpdateProgress={handleUpdateReadingPages}
      />
    </div>
  );
};
