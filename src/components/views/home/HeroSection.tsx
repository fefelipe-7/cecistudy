// Home — hero: saudação + data + frase do dia (MOD-001 / B.7).
// Extraído de `HomeView.tsx`.
import React from 'react';
import { Mascote } from '../../ui/Mascote';

interface HeroSectionProps {
  formattedDate: string;
  greeting: string;
  name: string;
  dayMessage: string;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  formattedDate,
  greeting,
  name,
  dayMessage,
}) => (
  <section className="rounded-[26px] bg-gradient-to-br from-surface-default to-surface-rose border border-ceci-border-subtle shadow-sm p-5 relative overflow-hidden">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <p className="text-xs font-medium text-ceci-secondary lowercase">{formattedDate}</p>
        </div>
        <h1 className="font-serif-academic text-3xl sm:text-4xl text-ceci-primary mt-1 tracking-tight">
          {greeting}, {name} ✨
        </h1>
      </div>
      <Mascote expression="welcome-wave" className="w-14 h-14 shrink-0" decorative />
    </div>
    <p className="text-xs sm:text-[13px] text-ceci-secondary leading-relaxed mt-2.5 max-w-[92%]">
      {dayMessage}
    </p>
  </section>
);

export default HeroSection;