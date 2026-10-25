// Home — hero: saudação + data + frase do dia (MOD-001 / B.7).
// Extraído de `HomeView.tsx`.
import React from 'react';
import { Ambient } from '../../motion/Ambient';
import { HERO_MASCOTES, type HeroMascoteExpression } from './heroMascote';

interface HeroSectionProps {
  formattedDate: string;
  greeting: string;
  name: string;
  dayMessage: string;
  /** Arte do turno do dia — escolhida por `heroMascote()` em `HomeView`. */
  mascote: HeroMascoteExpression;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  formattedDate,
  greeting,
  name,
  dayMessage,
  mascote,
}) => (
  <section className="rounded-[26px] bg-gradient-to-br from-surface-default to-surface-rose border border-ceci-border-subtle shadow-sm p-5 relative overflow-hidden">
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-ceci-brand animate-pulse" />
          <p className="text-xs font-medium text-ceci-secondary lowercase">{formattedDate}</p>
        </div>
        <h1 className="font-serif-academic text-3xl sm:text-4xl text-ceci-primary mt-1 tracking-tight">
          {greeting}, {name} ✨
        </h1>
      </div>
      {/* O halo dá volume à arte pastel nos temas escuros, onde ela encostaria no fundo. */}
      <Ambient className="relative shrink-0 -mr-1 -mt-1">
        <span
          aria-hidden
          className="absolute inset-3 rounded-full bg-ceci-brand-soft/40 blur-xl"
        />
        <img
          src={HERO_MASCOTES[mascote]}
          alt=""
          aria-hidden
          draggable={false}
          className="relative w-24 h-24 sm:w-28 sm:h-28 select-none"
        />
      </Ambient>
    </div>
    <p className="text-xs sm:text-[13px] text-ceci-secondary leading-relaxed mt-2.5 max-w-[92%]">
      {dayMessage}
    </p>
  </section>
);

export default HeroSection;
