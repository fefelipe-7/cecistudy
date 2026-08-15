import React from 'react';
import { HeartHandshake } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { InternshipLogCard } from '../InternshipLogCard';

/** Tela cheia do diário de estágio — todos os registros em cards, por extenso. */
export const InternshipDiaryView: React.FC = () => {
  const { internshipLogs } = useApp();
  const totalHours = internshipLogs.reduce((acc, l) => acc + l.hours, 0);

  return (
    <div className="space-y-4 pb-1">
      <div className="flex items-center justify-between gap-3 rounded-[24px] p-4 bg-white border border-ceci-border-default shadow-sm">
        <div className="flex items-center gap-3 min-w-0">
          <span className="w-10 h-10 rounded-2xl bg-surface-rose border border-ceci-border-brand flex items-center justify-center text-ceci-brand-strong shrink-0">
            <HeartHandshake className="w-5 h-5" />
          </span>
          <div className="min-w-0">
            <h2 className="font-display font-bold text-lg text-ceci-primary leading-tight">
              diário de estágio
            </h2>
            <p className="text-[11px] text-ceci-secondary">todos os registros, por extenso ♡</p>
          </div>
        </div>
        <div className="bg-surface-blue px-3.5 py-1.5 rounded-2xl border border-ceci-border-academic text-right shrink-0">
          <p className="text-[10px] lowercase font-bold text-ceci-secondary">total de horas</p>
          <p className="font-bold text-ceci-academic-strong text-sm">{totalHours} horas</p>
        </div>
      </div>

      <div className="space-y-3">
        {internshipLogs.map((log) => (
          <InternshipLogCard key={log.id} log={log} />
        ))}
        {internshipLogs.length === 0 && (
          <p className="text-xs text-ceci-secondary bg-surface-muted border border-ceci-border-subtle rounded-2xl p-4 text-center">
            ainda não tem registro de estágio — que tal anotar o primeiro? ♡
          </p>
        )}
      </div>
    </div>
  );
};
