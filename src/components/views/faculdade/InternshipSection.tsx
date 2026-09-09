// Faculdade — subtab "estágio": diário + preview (MOD-001 / B.7).
// Extraído de `FaculdadeView.tsx`.
import React from 'react';
import { HeartHandshake, ChevronRight, Plus } from 'lucide-react';
import { Mascote } from '../../ui/Mascote';
import { SectionTitle } from '../../ui/SectionTitle';
import { formatShortDate } from '../../../lib/schedule';

export interface InternshipRecordPreview {
  id: string;
  date: string;
  activity: string;
  hours: number;
}

interface InternshipSectionProps {
  records: InternshipRecordPreview[];
  totalHours: number;
  now: Date;
  onOpenDiary: () => void;
  onOpenWizard: () => void;
}

const InternshipSection: React.FC<InternshipSectionProps> = ({
  records,
  totalHours,
  now,
  onOpenDiary,
  onOpenWizard,
}) => (
  <div className="space-y-4 px-1 pt-1">
    <button
      onClick={onOpenDiary}
      aria-label="abrir diário de estágio"
      className="w-full rounded-[26px] p-5 bg-gradient-to-br from-surface-rose via-surface-default to-surface-blue border border-ceci-border-brand shadow-sm card-lift press-card cursor-pointer relative overflow-hidden group"
    >
      <div className="flex items-center gap-4">
        <span className="w-14 h-14 rounded-xl bg-surface-default border border-ceci-border-brand flex items-center justify-center shadow-2xs shrink-0">
          <HeartHandshake className="w-7 h-7 text-ceci-brand-strong" />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="font-display text-lg font-bold text-ceci-primary leading-tight">diário de estágio</h2>
          <p className="text-xs text-ceci-secondary mt-1 leading-relaxed">
            {records.length > 0
              ? `${records.length} ${records.length === 1 ? 'registro' : 'registros'} · ${totalHours}h de campo — toca para entrar no diário ♡`
              : 'campo, supervisão e entregas — tudo num lugar só ♡'}
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-ceci-brand-strong group-hover:translate-x-0.5 transition-transform shrink-0" />
      </div>
      <Mascote expression="field-prepare" className="w-14 h-14 absolute -bottom-2 -right-1 opacity-95 pointer-events-none" decorative />
    </button>

    <button
      onClick={onOpenWizard}
      className="w-full flex items-center justify-center gap-1.5 py-3 rounded-full text-xs font-semibold bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand hover:bg-rose-100 transition-colors cursor-pointer tap-interactive"
    >
      <Plus className="w-4 h-4" /> anotar ou agendar um estágio
    </button>

    <section className="space-y-2">
      <SectionTitle icon={<HeartHandshake className="w-4 h-4 text-ceci-academic-strong" />}>
        próximos e últimos estágios
      </SectionTitle>
      <div className="divide-y divide-ceci-border-default border-y border-ceci-border-default pt-3">
        {(() => {
          const todayKey = now.toISOString().slice(0, 10);
          const future = records
            .filter((r) => r.date >= todayKey)
            .sort((a, b) => a.date.localeCompare(b.date));
          const past = records
            .filter((r) => r.date < todayKey)
            .sort((a, b) => b.date.localeCompare(a.date));
          const preview = [...future, ...past].slice(0, 5);
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