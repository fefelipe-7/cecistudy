import React from 'react';
import { Sparkles, ArrowRight, Brain, HeartPulse, CheckCircle2 } from 'lucide-react';

interface FeaturedChallengeWidgetProps {
  onStartChallenge?: () => void;
}

export const FeaturedChallengeWidget: React.FC<FeaturedChallengeWidgetProps> = ({
  onStartChallenge,
}) => {
  return (
    <div className="rounded-[24px] bg-[#40383A] text-white p-6 shadow-[0_2px_8px_rgba(64,56,58,0.1)] relative overflow-hidden">
      {/* Decorative Background Accents */}
      <div className="absolute -right-8 -bottom-8 w-40 h-40 rounded-full bg-[#E97891]/15 blur-2xl pointer-events-none" />
      <div className="absolute right-12 top-4 opacity-10 pointer-events-none">
        <Brain className="w-32 h-32 text-white" />
      </div>

      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-2 max-w-md">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 text-[#FFD3DD] text-[10px] font-bold tracking-wider uppercase backdrop-blur-xs">
            <Sparkles className="w-3 h-3 text-[#E97891]" /> DESAFIO DE SAÚDE MENTAL CECI
          </div>
          <h3 className="font-display text-xl sm:text-2xl font-bold leading-tight">
            Pausa Reflexiva de 5 Minutos por 7 Dias
          </h3>
          <p className="text-xs text-[#E9DFDC]/80 leading-relaxed">
            Reduza o estresse do semestre e melhore a concentração para as provas com nossa técnica de atenção plena diária.
          </p>
        </div>

        <div className="shrink-0 flex sm:flex-col items-start sm:items-end justify-between sm:justify-center gap-3 border-t sm:border-t-0 border-white/10 pt-3 sm:pt-0">
          <div className="text-left sm:text-right">
            <span className="text-[10px] uppercase tracking-wider text-[#E97891] font-bold">Progresso</span>
            <p className="text-sm font-bold text-white">3 / 7 Dias Concluídos</p>
          </div>

          <button
            onClick={onStartChallenge}
            className="px-5 py-2.5 rounded-2xl bg-white text-[#40383A] hover:bg-[#FFF5F7] transition-colors text-xs font-bold flex items-center gap-2 shadow-2xs active:scale-98 cursor-pointer"
          >
            <span>Iniciar Prática</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
