// Faculdade — subtab "estágio": diário + preview (MOD-001 / B.7).
// Extraído de `FaculdadeView.tsx`.
import React from 'react';
import { HeartHandshake, ChevronRight, Plus } from 'lucide-react';
import { Mascote } from '../../ui/Mascote';
import { SectionTitle } from '../../ui/SectionTitle';
import { formatShortDate } from '../../../lib/schedule';
import { localDateKey } from '../../../lib/dateBR';
import { selectDiaryPreview } from '../../../lib/internshipPreview';

export interface InternshipRecordPreview {
  id: string;
  date: string;
  activity: string;
  hours: number;
}

interface InternshipSectionProps {
  records: InternshipRecordPreview[];
  now: Date;
  onOpenDiary: () => void;
}

const InternshipSection: React.FC<InternshipSectionProps> = ({
  records,
  now,
  onOpenDiary,
}) => (
  <div className="space-y-4 px-1 pt-1">
    <section className="space-y-2">
      <SectionTitle icon={<HeartHandshake className="w-4 h-4 text-ceci-academic-strong" />}>
        próximos e últimos estágios
      </SectionTitle>
      <div className="divide-y divide-ceci-border-default border-y border-ceci-border-default pt-3">
        {(() => {
          // Usa a função **testada** em vez de reimplementar a mesma lógica inline
          // (`F20`: `selectDiaryPreview` tinha 10 casos de teste e nenhuma view a
          // usava, enquanto esta linha reimplementava a mesma coisa com chave UTC).
          const todayKey = localDateKey(now);
          const preview = selectDiaryPreview(
            records.map((r) => ({ ...r, type: 'estagio', reflections: '', activity: r.activity })),
            now,
            5
          );
          return preview.length > 0 ? (
            preview.map((log) => (
              <button
                key={log.id}
                onClick={onOpenDiary}
                className="w-full py-2.5 flex items-center justify-between gap-3 text-left cursor-pointer group"
              >
                <div className="min-w-0">
                  <h3 className="font-bold text-xs text-ceci-primary line-clamp-1">{log.activity}</h3>
                  <p className="text-[11px] text-ceci-secondary mt-0.5">
                    {log.hours ? `${log.hours}h` : ''}{log.date >= todayKey ? ' · agendado' : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs text-ceci-tertiary">{formatShortDate(log.date)}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-ceci-faded shrink-0" />
                </div>
              </button>
            ))
          ) : (
            <div className="bg-surface-muted border border-ceci-border-subtle rounded-2xl p-5 text-center space-y-2">
              <Mascote expression="field-prepare" className="w-14 h-14 mx-auto" decorative />
              <p className="text-xs text-ceci-secondary">
                ainda não tem registro de estágio — que tal anotar o primeiro? ♡
              </p>
            </div>
          );
        })()}
      </div>
    </section>
  </div>
);

export default InternshipSection;