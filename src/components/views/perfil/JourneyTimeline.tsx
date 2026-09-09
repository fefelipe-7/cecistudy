// Perfil — "linha do tempo da graduação" (MOD-001 / B.6).
// Extraído de `PerfilView.tsx`.
import React from 'react';
import type { UserProfile } from '../../../types';
import { getJourneyReflection } from '../../../lib/profileMeta';

interface JourneyTimelineProps {
  profile: UserProfile;
  percentDegree: number;
}

const JourneyTimeline: React.FC<JourneyTimelineProps> = ({ profile, percentDegree }) => (
  <div className="rounded-2xl p-5 bg-white border border-ceci-border-default shadow-sm space-y-4">
    <div className="flex items-center justify-between gap-2">
      <div>
        <h2 className="font-display font-bold text-xl text-ceci-primary">
          linha do tempo da minha graduação
        </h2>
        <p className="text-xs text-ceci-secondary">
          acompanhando a caminhada desde o primeiro dia até a formação clínica.
        </p>
      </div>
      <span className="text-xs bg-surface-rose text-ceci-brand-strong border border-ceci-border-brand px-3 py-1 rounded-full font-medium shrink-0">
        {percentDegree}% do caminho 🎓
      </span>
    </div>

    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-1">
      {Array.from({ length: profile.totalSemesters }, (_, i) => i + 1).map((sem) => {
        const isPast = sem < profile.semester;
        const isCurrent = sem === profile.semester;

        return (
          <div
            key={sem}
            className={`p-3.5 rounded-2xl border text-center ${
              isCurrent
                ? 'bg-surface-rose border-2 border-ceci-border-brand text-ceci-brand-strong shadow-2xs font-bold'
                : isPast
                ? 'bg-surface-blue/80 border-ceci-border-academic text-ceci-academic-strong'
                : 'bg-white border-ceci-border-default opacity-60 text-ceci-secondary'
            }`}
          >
            <p className="text-xs opacity-80">semestre</p>
            <p className="font-display text-2xl font-bold my-1">{sem}º</p>
            <p className="text-[10px] font-medium">
              {isCurrent ? '🌸 em andamento' : isPast ? '✓ concluído' : 'aguardando'}
            </p>
          </div>
        );
      })}
    </div>

    <div className="p-4 rounded-2xl bg-surface-muted border border-ceci-border-default text-xs space-y-2">
      <p className="font-semibold text-ceci-primary">💭 reflexão de jornada:</p>
      <p className="text-ceci-secondary leading-relaxed">
        “{getJourneyReflection(profile.semester, profile.totalSemesters)}”
      </p>
    </div>
  </div>
);

export default JourneyTimeline;